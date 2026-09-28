/**
 * lib/orderService.ts
 * ===================
 * Service pour gérer les commandes
 * Création, statut, historique, etc.
 * Commentaires en français
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { Order, OrderInput } from '../types/index';
import { firestore } from './firebase.config';

// Commission prélevée par AubeShop (10%)
const COMMISSION_RATE = 0.10;
const SHIPPING_COST = 5.0; // EUR

/**
 * OrderService - Service pour gestion des commandes
 */
export class OrderService {
  /**
   * Créer une commande (Checkout)
   * @param clientId - ID du client
   * @param orderInput - Données de la commande
   * @returns { orderId, total, paymentUrl }
   */
  static async createOrder(
    clientId: string,
    orderInput: OrderInput
  ): Promise<{ orderId: string; total: number }> {
    try {
      // 1. Valider panier (stocks, produits existent)
      let subtotal = 0;
      for (const item of orderInput.items) {
        const product = await this.getProductForOrder(item.productId);
        if (!product) {
          throw new Error(`Produit ${item.productId} n'existe pas`);
        }
        if (product.stock.available < item.quantity) {
          throw new Error(`Stock insuffisant pour ${product.title}`);
        }
        subtotal += product.price * item.quantity;
      }

      // 2. Calculer frais
      const shipping = orderInput.shippingInfo.method === 'delivery' ? SHIPPING_COST : 0;
      const commission = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
      const total = subtotal + shipping;

      // 3. Déterminer vendeur (supposé unique par commande pour MVP)
      const vendorId = orderInput.items[0].vendorId;

      // 4. Créer document commande
      const newOrder = {
        clientId,
        vendorId,
        items: orderInput.items,
        pricing: {
          subtotal,
          shipping,
          commission,
          tax: 0,
          total,
        },
        status: 'pending',
        paymentStatus: 'pending',
        shippingInfo: orderInput.shippingInfo,
        timeline: {
          createdAt: Date.now(),
        },
        notes: orderInput.clientNote ? { clientNote: orderInput.clientNote } : {},
      };

      const orderRef = await addDoc(collection(firestore, 'orders'), newOrder);
      const orderId = orderRef.id;

      // 5. Utiliser batch pour :
      //    - Décrémenter stocks
      //    - Créer commission
      //    - Créer notification
      const batch = writeBatch(firestore);

      // Décrémenter stocks
      for (const item of orderInput.items) {
        const productRef = doc(firestore, 'products', item.productId);
        batch.update(productRef, {
          'stock.available': increment(-item.quantity),
          'stock.reserved': increment(item.quantity),
        });
      }

      // Créer commission
      const commissionRef = await addDoc(collection(firestore, 'commissions'), {
        vendorId,
        orderId,
        amount: commission,
        status: 'pending',
        paymentMethod: 'pending', // À déterminer après paiement
        deductedFrom: total,
        createdAt: Date.now(),
      });

      // Créer notification vendeur
      const notifRef = await addDoc(collection(firestore, 'notifications'), {
        userId: vendorId,
        type: 'order_created',
        title: 'Nouvelle commande !',
        message: `Commande #${orderId} - ${orderInput.items.length} produit(s)`,
        orderId,
        isRead: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 jours
      });

      await batch.commit();

      console.log('✅ Commande créée:', orderId);
      return { orderId, total };
    } catch (error: any) {
      console.error('❌ Erreur création commande:', error);
      throw new Error('Impossible de créer la commande: ' + error.message);
    }
  }

  /**
   * Mettre à jour statut d'une commande
   * @param orderId - ID de la commande
   * @param newStatus - Nouveau statut
   * @param actorId - ID de l'utilisateur qui effectue l'action
   * @param actorRole - Rôle de l'utilisateur ('vendor' ou 'client')
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    actorId: string,
    actorRole: string
  ): Promise<void> {
    try {
      // 1. Récupérer commande
      const orderRef = doc(firestore, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Commande non trouvée');
      }

      const order = orderSnap.data() as any;

      // 2. Vérifier autorisation
      if (newStatus === 'accepted' && actorRole !== 'vendor') {
        throw new Error('Seul le vendeur peut accepter');
      }
      if (newStatus === 'cancelled' && actorId !== order.clientId) {
        throw new Error('Seul le client peut annuler');
      }

      // 3. Préparer mise à jour
      const updateData: any = {
        status: newStatus,
      };

      // Mettre à jour timeline
      if (newStatus === 'accepted') {
        updateData['timeline.acceptedAt'] = Date.now();
      } else if (newStatus === 'in-progress') {
        updateData['timeline.inProgressAt'] = Date.now();
      } else if (newStatus === 'ready') {
        updateData['timeline.readyAt'] = Date.now();
      } else if (newStatus === 'delivered') {
        updateData['timeline.deliveredAt'] = Date.now();
        updateData['paymentStatus'] = 'paid'; // Paiement simulé OK
      } else if (newStatus === 'cancelled') {
        updateData['timeline.cancelledAt'] = Date.now();
      }

      // 4. Mettre à jour
      await updateDoc(orderRef, updateData);

      // 5. Créer notification pour l'autre partie
      const recipient =
        actorRole === 'vendor' ? order.clientId : order.vendorId;
      await addDoc(collection(firestore, 'notifications'), {
        userId: recipient,
        type: 'order_' + newStatus,
        title: `Commande #${orderId} - ${newStatus}`,
        message: `Votre commande a été ${this.getStatusFrench(newStatus)}`,
        orderId,
        isRead: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      console.log('✅ Statut commande mis à jour:', newStatus);
    } catch (error: any) {
      console.error('❌ Erreur mise à jour statut:', error);
      throw error;
    }
  }

  /**
   * Récupérer commandes d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param role - Rôle ('client' ou 'vendor')
   * @returns Order[]
   */
  static async getUserOrders(userId: string, role: 'client' | 'vendor'): Promise<Order[]> {
    try {
      const field = role === 'client' ? 'clientId' : 'vendorId';

      const q = query(
        collection(firestore, 'orders'),
        where(field, '==', userId),
        orderBy('timeline.createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order));
    } catch (error: any) {
      console.error('❌ Erreur récupération commandes:', error);
      return [];
    }
  }

  /**
   * Récupérer détail d'une commande
   * @param orderId - ID de la commande
   * @returns Order
   */
  static async getOrder(orderId: string): Promise<Order> {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Commande non trouvée');
      }

      return { id: orderSnap.id, ...orderSnap.data() } as Order;
    } catch (error: any) {
      console.error('❌ Erreur récupération commande:', error);
      throw error;
    }
  }

  /**
   * Ajouter note de commande (client)
   * @param orderId - ID de la commande
   * @param clientNote - Note du client
   */
  static async addOrderNote(orderId: string, clientNote: string): Promise<void> {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        'notes.clientNote': clientNote,
      });
    } catch (error: any) {
      console.error('❌ Erreur ajout note:', error);
      throw error;
    }
  }

  /**
   * Évaluer une commande (après livraison)
   * @param orderId - ID de la commande
   * @param rating - Note (1-5)
   * @param comment - Commentaire
   */
  static async rateOrder(
    orderId: string,
    rating: number,
    comment: string
  ): Promise<void> {
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        rating: Math.min(5, Math.max(1, rating)),
        'ratingDetails.vendorRating': rating,
        'ratingDetails.comment': comment,
        'ratingDetails.ratedAt': Date.now(),
      });

      console.log('✅ Évaluation enregistrée');
    } catch (error: any) {
      console.error('❌ Erreur évaluation:', error);
      throw error;
    }
  }

  /**
   * Helper: récupérer produit pour vérification
   */
  private static async getProductForOrder(productId: string) {
    try {
      const productRef = doc(firestore, 'products', productId);
      const productSnap = await getDoc(productRef);
      return productSnap.data();
    } catch {
      return null;
    }
  }

  /**
   * Helper: convertir statut en français
   */
  private static getStatusFrench(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'en attente',
      accepted: 'acceptée',
      'in-progress': 'en cours de préparation',
      ready: 'prête pour retrait',
      delivered: 'livrée',
      cancelled: 'annulée',
    };
    return statusMap[status] || status;
  }
}

export default OrderService;
