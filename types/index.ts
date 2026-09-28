/**
 * types/index.ts
 * ===============
 * Définition complète de tous les types TypeScript utilisés dans AubeShop
 * Commentaires en français pour une compréhension maximale
 */

// ============================================
// TYPES UTILISATEURS & AUTHENTIFICATION
// ============================================

/** Rôles utilisateur possibles */
export type UserRole = 'client' | 'vendor' | 'admin';

/** Statut de vérification vendeur */
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

/** Méthode de vérification vendeur */
export type VerificationMethod = 'email' | 'badge';

/**
 * User - Utilisateur de base (client ou vendeur)
 * Stocké dans Firestore: /users/{uid}
 */
export interface User {
  uid: string;
  email: string;
  phone?: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  address?: {
    street: string;
    city: string;
    postal: string;
    country: string;
  };
  metadata?: {
    lastLogin: number;
    totalOrders: number;
    totalSpent: number;
    deviceTokens: string[];
  };
}

/**
 * Vendor - Informations spécifiques vendeur (extension du User)
 * Stocké dans Firestore: /vendors/{vendorId}
 */
export interface Vendor extends User {
  vendorId: string;
  universityId: string;
  universityEmail: string;
  verificationMethod: VerificationMethod;
  verificationStatus: VerificationStatus;
  verificationDate?: number;
  approvedBy?: string;
  bio: string;
  storeName: string;
  rating: number;
  totalReviews: number;
  totalSales: number;
  commissionBalance: number;
  bankAccount?: {
    accountHolder: string;
    iban: string;
    verifiedAt: number;
  };
  location?: {
    campus: string;
    pickupHours: string;
    pickupDays: string[];
  };
  badgeUpload?: {
    storageUrl: string;
    uploadedAt: number;
    status: 'pending' | 'verified' | 'rejected';
  };
}

/**
 * AuthContextType - Type du contexte d'authentification
 * Gère l'état de connexion, l'utilisateur actuel et les méthodes d'auth
 */
export interface AuthContextType {
  user: User | null;
  currentUser?: User | null; // Alias pour compatibilité
  loading: boolean;
  error: string | null;
  signUpClient: (email: string, password: string, name: string) => Promise<{ uid: string }>;
  signUpVendor: (data: VendorSignUpInput) => Promise<{ vendorId: string; status: string }>;
  login: (email: string, password: string) => Promise<{ uid: string; role: UserRole }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// ============================================
// TYPES PRODUITS
// ============================================

/** Catégories de produits possibles */
export type ProductCategory = 'Livres' | 'Électronique' | 'Mode' | 'Objets' | 'Services';

/**
 * Product - Produit à vendre
 * Stocké dans Firestore: /products/{productId}
 */
export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string; // 'EUR'
  category: ProductCategory;
  stock: {
    total: number;
    available: number;
    reserved: number;
  };
  images: {
    url: string;
    order: number;
    uploadedAt: number;
  }[];
  rating: number;
  reviews: number;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: number;
  updatedAt: number;
  lastModifiedBy: string;
}

/**
 * ProductInput - Input pour créer/modifier un produit
 */
export interface ProductInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  images: string[]; // URIs locales avant upload
  tags?: string[];
}

// ============================================
// TYPES PANIER
// ============================================

/**
 * CartItem - Produit dans le panier
 * Stocké localement en AsyncStorage (pas Firestore)
 */
export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string; // URL première image
  vendorId: string;
}

/**
 * CartContextType - Type du contexte panier
 */
export interface CartContextType {
  items: CartItem[];
  cartItems?: CartItem[]; // Alias pour compatibilité
  itemCount?: number;
  total: number;
  addItem: (item: CartItem) => Promise<void>;
  addToCart?: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => Promise<void>;
  removeFromCart?: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// ============================================
// TYPES COMMANDES
// ============================================

/** Statut possible d'une commande */
export type OrderStatus = 'pending' | 'accepted' | 'in-progress' | 'ready' | 'delivered' | 'cancelled';

/** Statut paiement */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/** Méthode livraison */
export type ShippingMethod = 'pickup' | 'delivery';

/**
 * Order - Commande
 * Stocké dans Firestore: /orders/{orderId}
 */
export interface Order {
  id: string;
  clientId: string;
  vendorId: string;
  items: CartItem[];
  pricing: {
    subtotal: number;
    shipping: number;
    commission: number;
    tax: number;
    total: number;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingInfo: {
    method: ShippingMethod;
    address?: {
      street: string;
      city: string;
      postal: string;
    };
    pickupLocation?: string;
    estimatedDeliveryDate?: number;
  };
  timeline: {
    createdAt: number;
    acceptedAt?: number;
    inProgressAt?: number;
    readyAt?: number;
    deliveredAt?: number;
    cancelledAt?: number;
  };
  notes?: {
    clientNote?: string;
    vendorNote?: string;
  };
  rating?: number;
  ratingDetails?: {
    vendorRating?: number;
    comment?: string;
    ratedAt?: number;
  };
}

/**
 * OrderInput - Input pour créer une commande
 */
export interface OrderInput {
  items: CartItem[];
  shippingInfo: {
    method: ShippingMethod;
    address?: any;
    pickupLocation?: string;
  };
  paymentMethod: 'card' | 'bank_transfer' | 'flutterwave';
  clientNote?: string;
}

// ============================================
// TYPES NOTIFICATIONS
// ============================================

/** Types de notifications */
export type NotificationType = 
  | 'order_created'
  | 'order_accepted'
  | 'order_in_progress'
  | 'order_ready'
  | 'order_delivered'
  | 'order_cancelled'
  | 'vendor_approved'
  | 'vendor_rejected'
  | 'new_product'
  | 'payment_received';

/**
 * Notification - Notification utilisateur
 * Stocké dans Firestore: /notifications/{notificationId}
 * TTL: 30 jours
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  vendorId?: string;
  data?: any;
  isRead: boolean;
  createdAt: number;
  expiresAt: number;
}

// ============================================
// TYPES ADMIN & APPROBATIONS
// ============================================

/**
 * AdminApproval - Demande d'approbation vendeur (badge)
 * Stocké dans Firestore: /adminApprovals/{approvalId}
 */
export interface AdminApproval {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  universityId: string;
  verificationMethod: VerificationMethod;
  badgeUrl: string;
  status: VerificationStatus;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

/**
 * Commission - Suivi commissions vendeurs
 * Stocké dans Firestore: /commissions/{commissionId}
 */
export interface Commission {
  id: string;
  vendorId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  deductedFrom: number;
  createdAt: number;
  paidAt?: number;
  transactionId?: string;
  notes?: string;
}

// ============================================
// TYPES FORMULAIRES & INPUTS
// ============================================

/**
 * VendorSignUpInput - Input pour inscription vendeur
 */
export interface VendorSignUpInput {
  email: string;
  password: string;
  displayName: string;
  storeName: string;
  universityId: string;
  universityEmail?: string;
  verificationMethod: VerificationMethod;
  badgeImage?: string; // URI locale si badge upload
}

/**
 * LoginInput - Input pour connexion
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * CatalogOptions - Options de filtrage catalogue
 */
export interface CatalogOptions {
  category?: ProductCategory;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  pageSize?: number;
  startAfter?: any; // Document Firestore
  searchQuery?: string;
}

// ============================================
// TYPES RÉPONSES API & SERVICES
// ============================================

/**
 * ApiResponse - Réponse générique API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * PaginatedResponse - Réponse paginée
 */
export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  lastDoc?: any;
  pageSize: number;
}

/**
 * FirebaseAuthError - Erreur authentification Firebase
 */
export interface FirebaseAuthError {
  code: string;
  message: string;
}

// ============================================
// TYPES CONFIGURATION
// ============================================

/**
 * VerificationDomain - Configuration domaine email universitaire
 * Stocké dans Firestore: /verificationDomains/{domain}
 */
export interface VerificationDomain {
  domain: string;
  isActive: boolean;
  autoVerify: boolean;
  createdAt: number;
  createdBy: string;
  lastUpdated: number;
  notes: string;
}

/**
 * AppConfig - Configuration globale app
 */
export interface AppConfig {
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  commissionRate: number; // Ex: 0.10 pour 10%
  shippingCost: number; // Coût livraison
  maxUploadSize: number; // En MB
  cacheValidityDays: number; // Jours validité cache
}
