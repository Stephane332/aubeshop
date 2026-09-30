/**
 * lib/adminService.ts
 * ===================
 * Lectures réservées à l'administration.
 *
 * Toutes ces requêtes sont refusées par les règles Firestore si l'appelant
 * n'a pas `role: 'admin'`. La v1 se contentait de masquer le bouton dans
 * l'écran de profil : n'importe quel client connecté pouvait atteindre
 * `/admin` et approuver des vendeurs.
 */

import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { Application, ApplicationStatus, Commission, Order } from '@/types';
import { firestore } from './firebase.config';

/** Candidatures, en temps réel, filtrées par état. */
export function watchApplications(
  status: ApplicationStatus,
  onChange: (items: Application[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'applications'),
      where('status', '==', status),
      orderBy('submittedAt', 'desc'),
      limit(100)
    ),
    (snapshot) => onChange(snapshot.docs.map(toApplication)),
    onError
  );
}

export interface PlatformStats {
  users: number;
  vendors: number;
  couriers: number;
  pendingApplications: number;
  orders: number;
  /** Commissions cumulées, toutes commandes confondues. */
  revenue: number;
}

/**
 * Statistiques de la plateforme.
 *
 * Les comptages passent par `getCountFromServer`, qui renvoie un nombre sans
 * télécharger les documents — indispensable dès que les collections
 * grossissent, et bien moins coûteux en lectures facturées.
 */
export async function fetchPlatformStats(): Promise<PlatformStats> {
  const countOf = async (path: string, ...constraints: Parameters<typeof query>[1][]) => {
    const snapshot = await getCountFromServer(
      query(collection(firestore, path), ...(constraints as never[]))
    );
    return snapshot.data().count;
  };

  const [users, vendors, couriers, pendingApplications, orders] = await Promise.all([
    countOf('users'),
    countOf('vendors'),
    countOf('couriers'),
    countOf('applications', where('status', '==', 'pending')),
    countOf('orders'),
  ]);

  // Les commissions sont agrégées côté client : il n'y a pas de somme
  // serveur dans Firestore, et le volume reste faible à ce stade.
  const commissionDocs = await getDocs(
    query(collection(firestore, 'commissions'), orderBy('createdAt', 'desc'), limit(500))
  );
  const revenue = commissionDocs.docs.reduce(
    (sum, doc) => sum + (Number((doc.data() as Commission).amount) || 0),
    0
  );

  return { users, vendors, couriers, pendingApplications, orders, revenue };
}

/** Dernières commandes de la plateforme, pour le suivi d'activité. */
export async function fetchRecentOrders(count = 10): Promise<Order[]> {
  const snapshot = await getDocs(
    query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(count))
  );
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
}

function toApplication(snap: QueryDocumentSnapshot): Application {
  return { uid: snap.id, ...snap.data() } as Application;
}
