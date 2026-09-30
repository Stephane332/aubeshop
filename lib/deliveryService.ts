/**
 * lib/deliveryService.ts
 * ======================
 * Le vivier de courses et le parcours d'un livreur.
 *
 * Modèle retenu : **pool ouvert**. Une commande prête et à livrer entre dans
 * le vivier ; les livreurs disponibles la voient et la première acceptation
 * l'emporte. Aucun répartiteur, donc rien ne bloque si personne n'est devant
 * un écran.
 *
 * Point de conception important : la collection `deliveries` ne contient que
 * le quartier et la zone, jamais le téléphone ni l'adresse exacte. Le vivier
 * étant lisible par tous les livreurs disponibles, y stocker les
 * coordonnées des clients reviendrait à les diffuser à tout le monde. Ces
 * données restent dans `orders`, que seul le livreur ayant accepté peut lire.
 */

import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { CourierProfile, Delivery, Order } from '@/types';
import { firestore } from './firebase.config';
import type { DeliveryZoneId } from './money';
import { notify } from './notificationService';

// ============================================
// LE VIVIER
// ============================================

/**
 * Courses à prendre, filtrées sur les zones que le livreur dessert.
 *
 * Firestore plafonne `in` à 30 valeurs ; il n'y a que quatre zones, donc
 * aucun risque de dépassement.
 */
export function watchAvailableDeliveries(
  courier: CourierProfile,
  onChange: (items: Delivery[]) => void,
  onError: (error: Error) => void
): () => void {
  const zones = courier.zones.length > 0 ? courier.zones : (['campus'] as DeliveryZoneId[]);

  return onSnapshot(
    query(
      collection(firestore, 'deliveries'),
      where('status', '==', 'available'),
      where('campus', '==', courier.campus),
      where('zone', 'in', zones),
      orderBy('createdAt', 'asc')
    ),
    (snapshot) => onChange(snapshot.docs.map(toDelivery)),
    onError
  );
}

/** Courses en cours ou passées d'un livreur. */
export function watchCourierDeliveries(
  courierId: string,
  onChange: (items: Delivery[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'deliveries'),
      where('courierId', '==', courierId),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => onChange(snapshot.docs.map(toDelivery)),
    onError
  );
}

// ============================================
// PARCOURS DU LIVREUR
// ============================================

/**
 * Accepte une course.
 *
 * Transaction obligatoire : sans elle, deux livreurs qui tapent en même
 * temps sur la même course se la verraient tous les deux attribuée.
 */
export async function claimDelivery(
  orderId: string,
  courier: CourierProfile
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const ref = doc(firestore, 'deliveries', orderId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Cette course n'existe plus.");

    const delivery = snap.data() as Delivery;
    if (delivery.status !== 'available') {
      throw new Error('Un autre livreur vient de prendre cette course.');
    }

    transaction.update(ref, {
      status: 'claimed',
      courierId: courier.uid,
      courierName: courier.displayName,
      courierPhone: courier.phone,
      claimedAt: Date.now(),
    });
  });

  const order = await getDoc(doc(firestore, 'orders', orderId));
  if (order.exists()) {
    const data = order.data() as Order;
    await notify({
      userId: data.clientId,
      type: 'delivery_claimed',
      title: 'Un livreur a pris votre commande',
      body: `${courier.displayName} s'occupe de votre livraison.`,
      href: `/order/${orderId}`,
    });
  }
}

/** Le livreur a récupéré le colis chez le vendeur. */
export async function markPickedUp(orderId: string, courierId: string): Promise<void> {
  await transitionDelivery(orderId, courierId, 'claimed', {
    status: 'picked_up',
    pickedUpAt: Date.now(),
  });

  const order = await getDoc(doc(firestore, 'orders', orderId));
  if (order.exists()) {
    await notify({
      userId: (order.data() as Order).clientId,
      type: 'delivery_picked_up',
      title: 'Votre commande est en route',
      body: 'Le livreur a récupéré votre colis.',
      href: `/order/${orderId}`,
    });
  }
}

/**
 * Colis remis. Crédite le livreur de sa part et clôture la course.
 *
 * La commande reste au vendeur à passer en « terminée » : c'est lui qui
 * constate la vente, le livreur ne constate que le transport.
 */
export async function markDelivered(
  orderId: string,
  courier: CourierProfile
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const ref = doc(firestore, 'deliveries', orderId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Cette course n'existe plus.");

    const delivery = snap.data() as Delivery;
    if (delivery.courierId !== courier.uid) {
      throw new Error("Cette course n'est pas la vôtre.");
    }
    if (delivery.status !== 'picked_up') {
      throw new Error('Marquez d’abord le colis comme récupéré.');
    }

    const now = Date.now();
    transaction.update(ref, { status: 'delivered', deliveredAt: now });
    transaction.update(doc(firestore, 'couriers', courier.uid), {
      deliveryCount: increment(1),
      totalEarnings: increment(delivery.payout),
      updatedAt: now,
    });
  });

  const order = await getDoc(doc(firestore, 'orders', orderId));
  if (order.exists()) {
    await notify({
      userId: (order.data() as Order).clientId,
      type: 'delivery_delivered',
      title: 'Commande livrée',
      body: 'Votre colis vous a été remis. Bonne réception !',
      href: `/order/${orderId}`,
    });
  }
}

/**
 * Livraison impossible (client injoignable, adresse introuvable).
 * La course retourne au vivier pour qu'un autre livreur puisse réessayer.
 */
export async function markFailed(
  orderId: string,
  courierId: string,
  reason: string
): Promise<void> {
  await transitionDelivery(orderId, courierId, ['claimed', 'picked_up'], {
    status: 'available',
    courierId: null,
    courierName: null,
    courierPhone: null,
    claimedAt: null,
    pickedUpAt: null,
    failureReason: reason,
  });
}

/** Le livreur s'ouvre ou se ferme aux nouvelles courses. */
export async function setAvailability(
  courierId: string,
  isAvailable: boolean
): Promise<void> {
  await updateDoc(doc(firestore, 'couriers', courierId), {
    isAvailable,
    updatedAt: Date.now(),
  });
}

/** Met à jour les zones desservies. */
export async function setZones(courierId: string, zones: DeliveryZoneId[]): Promise<void> {
  await updateDoc(doc(firestore, 'couriers', courierId), {
    zones: zones.length > 0 ? zones : ['campus'],
    updatedAt: Date.now(),
  });
}

// ============================================
// OUTILS
// ============================================

/**
 * Applique un changement d'état en vérifiant l'état de départ et le
 * propriétaire de la course, à l'abri d'une transaction.
 */
async function transitionDelivery(
  orderId: string,
  courierId: string,
  from: Delivery['status'] | Delivery['status'][],
  patch: Record<string, unknown>
): Promise<void> {
  const allowed = Array.isArray(from) ? from : [from];

  await runTransaction(firestore, async (transaction) => {
    const ref = doc(firestore, 'deliveries', orderId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Cette course n'existe plus.");

    const delivery = snap.data() as Delivery;
    if (delivery.courierId !== courierId) {
      throw new Error("Cette course n'est pas la vôtre.");
    }
    if (!allowed.includes(delivery.status)) {
      throw new Error('Action impossible dans l’état actuel de la course.');
    }

    transaction.update(ref, patch);
  });
}

function toDelivery(snap: QueryDocumentSnapshot): Delivery {
  return { orderId: snap.id, ...snap.data() } as Delivery;
}
