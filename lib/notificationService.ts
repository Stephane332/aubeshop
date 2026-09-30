/**
 * lib/notificationService.ts
 * ==========================
 * Notifications dans l'application.
 *
 * Les règles Firestore de la v1 autorisaient `create: if request.auth == null`
 * sur cette collection, en croyant réserver l'écriture au serveur. C'était
 * l'inverse : les Cloud Functions passent au-dessus des règles, si bien que
 * la ligne ouvrait la collection à n'importe quel inconnu tout en refusant
 * les écritures de l'app elle-même. Ici, un utilisateur authentifié peut
 * notifier un tiers, et les règles limitent ce qu'il peut écrire.
 */

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { AppNotification, NotificationType } from '@/types';
import { firestore } from './firebase.config';

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Route expo-router ouverte au clic. */
  href?: string;
}

/**
 * Dépose une notification.
 *
 * Volontairement tolérante : prévenir quelqu'un est accessoire, l'échec ne
 * doit jamais faire échouer l'action métier qui l'a déclenché.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await addDoc(collection(firestore, 'notifications'), {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      ...(input.href ? { href: input.href } : {}),
      isRead: false,
      createdAt: Date.now(),
    });
  } catch {
    // Silencieux par conception — voir ci-dessus.
  }
}

/** Abonnement aux notifications d'un utilisateur, les 50 plus récentes. */
export function watchNotifications(
  userId: string,
  onChange: (items: AppNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snapshot) => onChange(snapshot.docs.map(toNotification)),
    (error) => onError?.(error)
  );
}

export async function markAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(firestore, 'notifications', notificationId), { isRead: true });
}

/** Marque tout comme lu en une écriture groupée. */
export async function markAllAsRead(items: AppNotification[]): Promise<void> {
  const unread = items.filter((n) => !n.isRead);
  if (unread.length === 0) return;

  const batch = writeBatch(firestore);
  unread.forEach((n) => batch.update(doc(firestore, 'notifications', n.id), { isRead: true }));
  await batch.commit();
}

function toNotification(snap: QueryDocumentSnapshot): AppNotification {
  return { id: snap.id, ...snap.data() } as AppNotification;
}
