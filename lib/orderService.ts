/**
 * lib/orderService.ts
 * ===================
 * Cycle de vie des commandes.
 *
 * Trois défauts majeurs de la v1 sont corrigés ici :
 *
 * 1. **Survente.** Le stock était vérifié par une lecture puis modifié par
 *    une écriture séparée : deux acheteurs simultanés passaient tous les
 *    deux. Tout se fait désormais dans une transaction Firestore.
 * 2. **Panier multi-vendeurs.** La v1 attribuait la commande entière à
 *    `items[0].vendorId` : le vendeur A recevait les produits du vendeur B,
 *    et B n'était ni prévenu ni payé. On crée maintenant une commande par
 *    vendeur, reliées par `groupId`.
 * 3. **Absence d'atomicité.** Le `writeBatch` de la v1 ne couvrait pas la
 *    création de la commande ni celle de la commission — un échec laissait
 *    des données incohérentes.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type {
  Address,
  CartGroup,
  Commission,
  Delivery,
  Order,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  Product,
  ShippingMethod,
  User,
} from '@/types';
import { canTransition } from '@/types';
import { stripUndefined } from './authService';
import { firestore } from './firebase.config';
import { priceBreakdown, toAmount } from './money';
import { notify } from './notificationService';

export interface CheckoutInput {
  shippingMethod: ShippingMethod;
  /** Obligatoire en livraison. */
  address?: Address;
  /** Obligatoire en retrait. */
  pickupPoint?: string;
  paymentMethod: PaymentMethod;
  clientNote?: string;
}

// ============================================
// PASSAGE DE COMMANDE
// ============================================

/**
 * Valide le panier et crée une commande par vendeur.
 *
 * Tout est fait dans une seule transaction : soit l'ensemble des stocks est
 * décrémenté et toutes les commandes sont créées, soit rien ne l'est.
 *
 * @returns Les identifiants créés et le `groupId` qui les relie.
 */
export async function placeOrder(
  user: User,
  groups: CartGroup[],
  input: CheckoutInput
): Promise<{ groupId: string; orderIds: string[] }> {
  if (groups.length === 0) throw new Error('Votre panier est vide.');

  if (input.shippingMethod === 'delivery' && !input.address) {
    throw new Error('Choisissez une adresse de livraison.');
  }
  if (!user.phone && !input.address?.phone) {
    throw new Error('Un numéro de téléphone est nécessaire pour vous joindre.');
  }

  const groupId = doc(collection(firestore, 'orderGroups')).id;
  const now = Date.now();
  const phone = input.address?.phone ?? user.phone ?? '';

  const orderIds = await runTransaction(firestore, async (transaction) => {
    const allLines = groups.flatMap((g) => g.lines);

    // --- Phase de lecture -------------------------------------------------
    // Firestore impose que toutes les lectures précèdent toutes les
    // écritures dans une transaction.
    const productRefs = allLines.map((line) => doc(firestore, 'products', line.productId));
    const snapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

    const stockByProduct = new Map<string, number>();
    /**
     * Prix lus en base, indexés par produit.
     *
     * On ne réécrit pas `line.unitPrice` : les lignes appartiennent à
     * l'état React du panier, les muter ici reviendrait à modifier l'état
     * en dehors de son propriétaire.
     */
    const priceByProduct = new Map<string, number>();

    snapshots.forEach((snap, index) => {
      const line = allLines[index];
      if (!snap.exists()) {
        throw new Error(`« ${line.title} » n'est plus disponible.`);
      }
      const product = snap.data() as Product;
      if (product.status !== 'active') {
        throw new Error(`« ${line.title} » n'est plus en vente.`);
      }
      const available = Math.max(0, Math.trunc(Number(product.stock) || 0));
      if (available < line.quantity) {
        throw new Error(
          available === 0
            ? `« ${line.title} » est en rupture de stock.`
            : `Il ne reste que ${available} × « ${line.title} ».`
        );
      }
      stockByProduct.set(line.productId, available);
      // Le prix facturé est celui de la base, jamais celui envoyé par le
      // client : c'est ce qui empêche de forcer un total à 0.
      priceByProduct.set(line.productId, toAmount(product.price));
    });

    // --- Phase d'écriture -------------------------------------------------
    const createdIds: string[] = [];

    for (const group of groups) {
      // Copie figée de la commande, aux prix relus en base.
      const lines: OrderLine[] = group.lines.map((l) => ({
        productId: l.productId,
        title: l.title,
        image: l.image,
        unitPrice: priceByProduct.get(l.productId) ?? toAmount(l.unitPrice),
        quantity: l.quantity,
      }));

      const pricing = priceBreakdown(
        lines.map((l) => ({ price: l.unitPrice, quantity: l.quantity })),
        { method: input.shippingMethod, zone: input.address?.zone }
      );

      const orderRef = doc(collection(firestore, 'orders'));

      const order: Omit<Order, 'id'> = {
        groupId,
        clientId: user.uid,
        clientName: user.displayName,
        clientPhone: phone,
        vendorId: group.vendorId,
        vendorName: group.vendorName,
        lines,
        pricing,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: input.paymentMethod,
        shippingMethod: input.shippingMethod,
        address: input.address,
        pickupPoint: input.pickupPoint,
        createdAt: now,
        timeline: { pending: now },
        clientNote: input.clientNote?.trim() || undefined,
      };

      transaction.set(orderRef, stripUndefined(order));
      createdIds.push(orderRef.id);

      // Décrément du stock, produit par produit.
      for (const line of group.lines) {
        const current = stockByProduct.get(line.productId)!;
        const next = current - line.quantity;
        stockByProduct.set(line.productId, next);
        transaction.update(doc(firestore, 'products', line.productId), {
          stock: next,
          soldCount: increment(line.quantity),
          updatedAt: now,
        });
      }

      // Écriture de commission, dans la même transaction que la commande.
      const commissionRef = doc(collection(firestore, 'commissions'));
      const commission: Omit<Commission, 'id'> = {
        vendorId: group.vendorId,
        orderId: orderRef.id,
        amount: pricing.commission,
        orderSubtotal: pricing.subtotal,
        status: 'pending',
        createdAt: now,
      };
      transaction.set(commissionRef, commission);
    }

    return createdIds;
  });

  // Les notifications sont hors transaction : leur échec ne doit pas annuler
  // une commande valide.
  await Promise.allSettled(
    groups.map((group, index) =>
      notify({
        userId: group.vendorId,
        type: 'order_placed',
        title: 'Nouvelle commande',
        body: `${group.lines.length} article(s) — ${group.lines[0].title}`,
        href: `/order/${orderIds[index]}`,
      })
    )
  );

  return { groupId, orderIds };
}

// ============================================
// TRANSITIONS
// ============================================

/**
 * Fait avancer une commande.
 *
 * La transition est validée contre la machine à états partagée : la v1
 * acceptait `delivered → pending` et laissait un client annuler après
 * réception. On vérifie aussi que l'acteur est bien partie prenante, ce que
 * la v1 déléguait à un paramètre `actorRole` fourni par l'appelant.
 */
export async function advanceOrder(
  orderId: string,
  to: OrderStatus,
  actor: { uid: string; role: 'client' | 'vendor' },
  reason?: string
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const orderRef = doc(firestore, 'orders', orderId);
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) throw new Error('Commande introuvable.');

    const order = { id: snap.id, ...snap.data() } as Order;

    const belongs =
      actor.role === 'client' ? order.clientId === actor.uid : order.vendorId === actor.uid;
    if (!belongs) throw new Error("Cette commande ne vous concerne pas.");

    if (!canTransition(order.status, to, actor.role)) {
      throw new Error(
        `Impossible de passer de « ${order.status} » à « ${to} ».`
      );
    }

    const now = Date.now();
    transaction.update(orderRef, {
      status: to,
      [`timeline.${to}`]: now,
      ...(reason ? { cancelReason: reason } : {}),
      // Le paiement à la livraison est encaissé à la remise du colis.
      ...(to === 'completed' && order.paymentMethod === 'cash_on_delivery'
        ? { paymentStatus: 'paid' }
        : {}),
    });

    // Une commande annulée ou refusée rend son stock — la v1 le laissait
    // réservé indéfiniment.
    if (to === 'cancelled' || to === 'refused') {
      for (const line of order.lines) {
        transaction.update(doc(firestore, 'products', line.productId), {
          stock: increment(line.quantity),
          soldCount: increment(-line.quantity),
          updatedAt: now,
        });
      }
    }

    // Une commande prête et à livrer entre dans le vivier des livreurs.
    if (to === 'ready' && order.shippingMethod === 'delivery' && order.address) {
      const delivery: Delivery = {
        orderId: order.id,
        groupId: order.groupId,
        status: 'available',
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        pickupPoint: order.pickupPoint,
        campus: order.address.city === 'Bobo-Dioulasso' ? 'Bobo-Dioulasso' : 'Ouagadougou',
        zone: order.address.zone,
        district: order.address.district,
        city: order.address.city,
        fee: order.pricing.shipping,
        payout: order.pricing.courierPayout,
        itemCount: order.lines.reduce((n, l) => n + l.quantity, 0),
        createdAt: now,
      };
      transaction.set(doc(firestore, 'deliveries', order.id), stripUndefined(delivery));
    }
  });

  await notifyCounterpart(orderId, to);
}

/** Prévient l'autre partie du changement de statut. */
async function notifyCounterpart(orderId: string, status: OrderStatus): Promise<void> {
  const order = await fetchOrder(orderId).catch(() => null);
  if (!order) return;

  const toVendor = status === 'cancelled';
  const messages: Partial<Record<OrderStatus, string>> = {
    accepted: 'Votre commande a été acceptée.',
    preparing: 'Votre commande est en préparation.',
    ready: 'Votre commande est prête.',
    completed: 'Votre commande est terminée. Merci !',
    refused: 'Votre commande a été refusée par le vendeur.',
    cancelled: 'Une commande a été annulée par le client.',
  };
  const body = messages[status];
  if (!body) return;

  await notify({
    userId: toVendor ? order.vendorId : order.clientId,
    type: `order_${status}` as never,
    title: `Commande #${orderId.slice(0, 6).toUpperCase()}`,
    body,
    href: `/order/${orderId}`,
  }).catch(() => {});
}

// ============================================
// LECTURE
// ============================================

export async function fetchOrder(orderId: string): Promise<Order> {
  const snap = await getDoc(doc(firestore, 'orders', orderId));
  if (!snap.exists()) throw new Error('Commande introuvable.');
  return { id: snap.id, ...snap.data() } as Order;
}

/**
 * Abonnement temps réel aux commandes d'un utilisateur.
 *
 * Le cahier des charges promettait un suivi « en temps réel » ; la v1 ne
 * comptait pas un seul `onSnapshot` et n'actualisait jamais l'écran.
 */
export function watchOrders(
  userId: string,
  role: 'client' | 'vendor',
  onChange: (orders: Order[]) => void,
  onError: (error: Error) => void
): () => void {
  const field = role === 'client' ? 'clientId' : 'vendorId';
  return onSnapshot(
    query(
      collection(firestore, 'orders'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => onChange(snapshot.docs.map(toOrder)),
    onError
  );
}

export function watchOrder(
  orderId: string,
  onChange: (order: Order) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(firestore, 'orders', orderId),
    (snap) => {
      if (snap.exists()) onChange({ id: snap.id, ...snap.data() } as Order);
      else onError(new Error('Commande introuvable.'));
    },
    onError
  );
}

/** Commandes d'un vendeur, pour les statistiques du tableau de bord. */
export async function fetchVendorOrders(vendorId: string): Promise<Order[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'orders'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map(toOrder);
}

// ============================================
// ÉVALUATION
// ============================================

/** Note laissée par le client, une fois la commande terminée. */
export async function reviewOrder(
  orderId: string,
  clientUid: string,
  rating: number,
  comment?: string
): Promise<void> {
  await runTransaction(firestore, async (transaction) => {
    const orderRef = doc(firestore, 'orders', orderId);
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) throw new Error('Commande introuvable.');

    const order = snap.data() as Order;
    if (order.clientId !== clientUid) throw new Error("Cette commande n'est pas la vôtre.");
    if (order.status !== 'completed') {
      throw new Error('Vous pourrez noter une fois la commande terminée.');
    }
    if (order.review) throw new Error('Vous avez déjà noté cette commande.');

    transaction.update(orderRef, {
      review: stripUndefined({
        rating: Math.min(5, Math.max(1, Math.round(rating))),
        comment: comment?.trim() || undefined,
        createdAt: Date.now(),
      }),
    });
  });
}

// ============================================
// OUTILS
// ============================================

function toOrder(snap: QueryDocumentSnapshot): Order {
  return { id: snap.id, ...snap.data() } as Order;
}

/** Identifiant court et lisible, affiché à l'utilisateur. */
export function orderReference(orderId: string): string {
  return `#${orderId.slice(0, 6).toUpperCase()}`;
}
