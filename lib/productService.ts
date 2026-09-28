/**
 * lib/productService.ts
 * =====================
 * Service pour gérer les produits
 * CRUD produits, catalogue, recherche
 * Commentaires en français
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    where
} from 'firebase/firestore';
import { CatalogOptions, Product, ProductCategory, ProductInput } from '../types/index';
import { firestore } from './firebase.config';

/**
 * ProductService - Service pour gestion des produits
 */
export class ProductService {
  /**
   * Créer un produit (Vendeur seulement)
   * @param vendorId - ID du vendeur
   * @param productData - Données du produit
   * @returns { productId }
   */
  static async createProduct(
    vendorId: string,
    productData: ProductInput
  ): Promise<{ productId: string }> {
    try {
      // 1. Valider données
      if (!productData.title || productData.price < 0 || productData.stock < 0) {
        throw new Error('Données produit invalides');
      }

      // 2. Créer document Firestore
      const newProduct = {
        vendorId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        currency: 'EUR',
        category: productData.category,
        stock: {
          total: productData.stock,
          available: productData.stock,
          reserved: 0,
        },
        images: productData.images.map((url, index) => ({
          url,
          order: index + 1,
          uploadedAt: Date.now(),
        })),
        rating: 0,
        reviews: 0,
        tags: productData.tags || [],
        isActive: true,
        isFeatured: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastModifiedBy: vendorId,
      };

      const productsRef = collection(firestore, 'products');
      const docRef = await addDoc(productsRef, newProduct);

      console.log('✅ Produit créé:', docRef.id);
      return { productId: docRef.id };
    } catch (error: any) {
      console.error('❌ Erreur création produit:', error);
      throw new Error('Impossible de créer le produit: ' + error.message);
    }
  }

  /**
   * Récupérer le catalogue avec filtres et pagination
   * @param options - Options de filtrage/pagination
   * @returns { products, hasMore, lastDoc }
   */
  static async getCatalog(options: CatalogOptions = {}) {
    try {
      let q = query(
        collection(firestore, 'products'),
        where('isActive', '==', true)
      );

      // Appliquer filtres
      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      // Appliquer tri
      if (options.sortBy === 'price-asc') {
        q = query(q, orderBy('price', 'asc'));
      } else if (options.sortBy === 'price-desc') {
        q = query(q, orderBy('price', 'desc'));
      } else if (options.sortBy === 'rating') {
        q = query(q, orderBy('rating', 'desc'));
      } else {
        // Défaut: plus récents d'abord
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Appliquer pagination
      const pageSize = options.pageSize || 20;
      q = query(q, limit(pageSize + 1)); // +1 pour déterminer hasMore

      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      // Récupérer documents
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));

      // Déterminer s'il y a d'autres pages
      const hasMore = products.length > pageSize;
      if (hasMore) {
        products.pop(); // Retirer le +1
      }

      const lastDoc = snapshot.docs[Math.min(pageSize - 1, snapshot.docs.length - 1)] || null;

      return { products, hasMore, lastDoc };
    } catch (error: any) {
      console.error('❌ Erreur récupération catalogue:', error);
      throw new Error('Impossible de charger le catalogue');
    }
  }

  /**
   * Récupérer un produit par ID
   * @param productId - ID du produit
   * @returns Product
   */
  static async getProduct(productId: string): Promise<Product> {
    try {
      const docRef = doc(firestore, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Produit non trouvé');
      }

      return { id: docSnap.id, ...docSnap.data() } as Product;
    } catch (error: any) {
      console.error('❌ Erreur récupération produit:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un produit
   * @param vendorId - ID du vendeur (pour vérifier autorisation)
   * @param productId - ID du produit
   * @param updates - Champs à mettre à jour
   */
  static async updateProduct(
    vendorId: string,
    productId: string,
    updates: Partial<ProductInput>
  ): Promise<void> {
    try {
      // 1. Vérifier propriété du produit
      const productRef = doc(firestore, 'products', productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error('Produit non trouvé');
      }

      if (productSnap.data().vendorId !== vendorId) {
        throw new Error('Non autorisé: vous n\'êtes pas le propriétaire');
      }

      // 2. Mettre à jour
      const updateData = {
        ...updates,
        updatedAt: Date.now(),
        lastModifiedBy: vendorId,
      };

      await updateDoc(productRef, updateData);
      console.log('✅ Produit mis à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour produit:', error);
      throw error;
    }
  }

  /**
   * Supprimer un produit
   * @param vendorId - ID du vendeur
   * @param productId - ID du produit
   */
  static async deleteProduct(vendorId: string, productId: string): Promise<void> {
    try {
      // 1. Vérifier propriété
      const productRef = doc(firestore, 'products', productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error('Produit non trouvé');
      }

      if (productSnap.data().vendorId !== vendorId) {
        throw new Error('Non autorisé');
      }

      // 2. Supprimer (soft delete en mettant isActive à false)
      await updateDoc(productRef, {
        isActive: false,
        updatedAt: Date.now(),
      });

      console.log('✅ Produit supprimé');
    } catch (error: any) {
      console.error('❌ Erreur suppression produit:', error);
      throw error;
    }
  }

  /**
   * Récupérer produits d'un vendeur
   * @param vendorId - ID du vendeur
   * @returns Product[]
   */
  static async getVendorProducts(vendorId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(firestore, 'products'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
    } catch (error: any) {
      console.error('❌ Erreur récupération produits vendeur:', error);
      return [];
    }
  }

  /**
   * Rechercher produits par texte
   * @param searchQuery - Termes de recherche
   * @returns Product[]
   */
  static async searchProducts(searchQuery: string): Promise<Product[]> {
    try {
      // Note: Firestore ne supporte pas bien la recherche texte
      // En production, utiliser Algolia ou Elasticsearch
      // Pour le MVP, récupérer tous les produits et filtrer (⚠️ pas optimal)

      const snapshot = await getDocs(
        query(
          collection(firestore, 'products'),
          where('isActive', '==', true),
          limit(100)
        )
      );

      const searchLower = searchQuery.toLowerCase();
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        .filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        );

      return filtered;
    } catch (error: any) {
      console.error('❌ Erreur recherche produits:', error);
      return [];
    }
  }

  /**
   * Obtenir catégories disponibles
   * @returns Liste des catégories
   */
  static getCategories(): ProductCategory[] {
    return ['Livres', 'Électronique', 'Mode', 'Objets', 'Services'];
  }
}

export default ProductService;
