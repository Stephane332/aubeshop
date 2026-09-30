/**
 * types/index.ts
 * ==============
 * Modèle de données AubeShop — source de vérité unique.
 *
 * Principes tenus ici, après l'audit de la v1 :
 *
 * - **Aucun alias de compatibilité.** Une donnée, un nom. Les `cartItems?` /
 *   `itemCount?` optionnels de la v1 causaient la moitié des erreurs de typage.
 * - **Une commande appartient à un seul vendeur.** Un panier multi-vendeurs
 *   produit plusieurs commandes liées par `groupId`, au lieu d'attribuer
 *   silencieusement tout au premier vendeur.
 * - **Le rôle porte le droit.** Un candidat vendeur reste `client` jusqu'à
 *   validation. Plus besoin de recroiser un statut de vérification à chaque
 *   écran, et les règles Firestore n'ont qu'un champ à regarder.
 * - **Les montants sont des entiers en XOF.** Voir `lib/money.ts`.
 */

import type { DeliveryZoneId } from '@/lib/money';

// ============================================
// RÔLES
// ============================================

/**
 * Les cinq rôles de l'app. Chacun a son tableau de bord et ses écrans.
 *
 * Un compte porte un seul rôle : un livreur ne vend pas, un vendeur ne livre
 * pas pour les autres. Cela garde les tableaux de bord lisibles et les règles
 * de sécurité simples.
 */
export type UserRole =
  | 'client'
  | 'student_vendor'
  | 'partner_vendor'
  | 'courier'
  | 'admin';

/** Rôles autorisés à vendre. */
export const VENDOR_ROLES = ['student_vendor', 'partner_vendor'] as const;
export type VendorRole = (typeof VENDOR_ROLES)[number];

export function isVendorRole(role: UserRole | undefined): role is VendorRole {
  return role === 'student_vendor' || role === 'partner_vendor';
}

/** Libellés affichés, par rôle. */
export const ROLE_LABEL: Record<UserRole, string> = {
  client: 'Client',
  student_vendor: 'Vendeur étudiant',
  partner_vendor: 'Vendeur partenaire',
  courier: 'Livreur',
  admin: 'Administrateur',
};

/** Campus de l'Université Aube Nouvelle. */
export type Campus = 'Ouagadougou' | 'Bobo-Dioulasso';
export const CAMPUSES: Campus[] = ['Ouagadougou', 'Bobo-Dioulasso'];

// ============================================
// COMPTE UTILISATEUR
// ============================================

/**
 * Adresse de livraison.
 *
 * Pensée pour l'adressage burkinabè : on repère au secteur/quartier et au
 * point de repère, pas au numéro de rue. `zone` détermine le tarif.
 */
export interface Address {
  id: string;
  /** Étiquette libre : « Cité U », « Maison », « Boutique ». */
  label: string;
  /** Secteur ou quartier. */
  district: string;
  city: string;
  /** Point de repère — en pratique c'est ça qui permet de trouver. */
  landmark?: string;
  /** Zone tarifaire choisie par le client, contrôlée par le livreur. */
  zone: DeliveryZoneId;
  phone: string;
  isDefault: boolean;
}

/**
 * Compte — `/users/{uid}`.
 * Ne contient que l'identité : le métier vit dans les profils dédiés.
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  campus?: Campus;
  addresses: Address[];
  /** Suspension par un admin (fraude, non-livraison répétée). */
  isBlocked: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// PROFILS MÉTIER
// ============================================

/**
 * Vitrine d'un vendeur — `/vendors/{uid}`.
 *
 * N'étend délibérément pas `User` : la v1 dupliquait tous les champs du
 * compte dans deux collections sans synchronisation, et elles divergeaient
 * dès le premier changement de nom.
 */
export interface VendorProfile {
  uid: string;
  /** Étudiant ou partenaire — change la vérification et l'UI, pas le taux. */
  kind: 'student' | 'partner';
  storeName: string;
  bio: string;
  logo?: string;
  campus: Campus;

  /** Retrait sur place : où et quand. */
  pickupPoint?: string;
  pickupHours?: string;

  /** Réservé aux partenaires : le stand physique. */
  stand?: {
    /** Emplacement sur ou près du campus. */
    location: string;
    openingHours: string;
    /** Numéro d'enregistrement commercial (IFU au Burkina). */
    businessId?: string;
  };

  /** Le vendeur peut fermer temporairement (examens, vacances). */
  isOpen: boolean;

  /** Agrégats tenus par le serveur, jamais saisis à la main. */
  rating: number;
  reviewCount: number;
  salesCount: number;
  /** Chiffre d'affaires net cumulé, commission déduite. */
  totalEarnings: number;

  createdAt: number;
  updatedAt: number;
}

/** Profil livreur — `/couriers/{uid}`. */
export interface CourierProfile {
  uid: string;
  displayName: string;
  phone: string;
  campus: Campus;
  /** Moyen de locomotion : conditionne les zones qu'il peut couvrir. */
  vehicle: 'foot' | 'bicycle' | 'motorbike' | 'car';
  /** Zones que le livreur accepte de desservir. */
  zones: DeliveryZoneId[];
  /** Interrupteur « je prends des courses » — contrôlé par le livreur. */
  isAvailable: boolean;

  rating: number;
  reviewCount: number;
  deliveryCount: number;
  /** Gains cumulés sur les courses livrées. */
  totalEarnings: number;

  createdAt: number;
  updatedAt: number;
}

export const VEHICLE_LABEL: Record<CourierProfile['vehicle'], string> = {
  foot: 'À pied',
  bicycle: 'Vélo',
  motorbike: 'Moto',
  car: 'Voiture',
};

// ============================================
// CANDIDATURES
// ============================================

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/** Ce à quoi on candidate. Détermine le rôle accordé en cas d'acceptation. */
export type ApplicationKind = 'student_vendor' | 'partner_vendor' | 'courier';

/** Comment le candidat prouve ce qu'il avance. */
export type VerificationMethod =
  /** Email universitaire vérifié — validation automatique possible. */
  | 'university_email'
  /** Photo de la carte d'étudiant, contrôlée par un admin. */
  | 'student_card'
  /** Convention de partenariat, pour les commerces. */
  | 'partnership'
  /** Pièce d'identité, pour les livreurs. */
  | 'id_card';

/**
 * Candidature — `/applications/{uid}`.
 *
 * Un document par compte : on ne candidate qu'à un rôle à la fois. Les trois
 * files de validation de l'admin sont des vues filtrées sur `kind`.
 */
export interface Application {
  uid: string;
  kind: ApplicationKind;
  status: ApplicationStatus;

  /** Identité du candidat, recopiée pour que l'admin lise sans jointure. */
  displayName: string;
  email: string;
  phone: string;
  campus: Campus;

  method: VerificationMethod;
  /** URL Firebase Storage du justificatif — jamais une URI locale. */
  documentUrl?: string;
  /** Email universitaire, si `method === 'university_email'`. */
  universityEmail?: string;

  /** Vendeurs : nom de boutique souhaité. */
  storeName?: string;
  /** Vendeur étudiant : numéro de carte. */
  studentId?: string;
  /** Partenaire : identifiant commercial et emplacement du stand. */
  businessId?: string;
  standLocation?: string;
  /** Livreur : véhicule et zones couvertes. */
  vehicle?: CourierProfile['vehicle'];
  zones?: DeliveryZoneId[];

  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  /** Motif transmis au candidat en cas de refus. */
  rejectionReason?: string;
}

/** Rôle accordé quand une candidature est acceptée. */
export const ROLE_FOR_APPLICATION: Record<ApplicationKind, UserRole> = {
  student_vendor: 'student_vendor',
  partner_vendor: 'partner_vendor',
  courier: 'courier',
};

// ============================================
// PRODUITS
// ============================================

/**
 * Catégorie stockée sous forme de clé stable : renommer « Livres » ne doit
 * pas invalider les produits existants.
 */
export type CategoryId =
  | 'books'
  | 'electronics'
  | 'fashion'
  | 'food'
  | 'supplies'
  | 'services'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  /** Nom d'icône, résolu par `IconSymbol`. */
  icon: string;
}

/** Le retrait est réversible, d'où l'absence de suppression définitive. */
export type ProductStatus = 'active' | 'hidden' | 'removed';

/**
 * Produit — `/products/{productId}`.
 *
 * `stock` est un entier simple et non l'objet `{total, available, reserved}`
 * de la v1 : cet objet se faisait écraser par un nombre à chaque mise à jour
 * partielle, corrompant le document.
 */
export interface Product {
  id: string;
  vendorId: string;
  /** Dénormalisés : une carte produit s'affiche sans lecture supplémentaire. */
  vendorName: string;
  vendorKind: VendorProfile['kind'];
  vendorCampus: Campus;

  title: string;
  description: string;
  /** Prix unitaire en XOF, entier. */
  price: number;
  category: CategoryId;
  /** URLs Firebase Storage ; la première sert de vignette. */
  images: string[];
  /** Unités disponibles à la vente. */
  stock: number;
  status: ProductStatus;

  /** Mots-clés en minuscules, pour la recherche. */
  keywords: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;

  createdAt: number;
  updatedAt: number;
}

/** Saisie du formulaire produit — ce que le vendeur contrôle réellement. */
export interface ProductDraft {
  title: string;
  description: string;
  price: number;
  category: CategoryId;
  stock: number;
  /** URIs locales avant envoi vers Storage. */
  images: string[];
}

// ============================================
// PANIER
// ============================================

/**
 * Ligne de panier — persistée localement, par utilisateur.
 *
 * Auto-suffisante : la v1 lisait `item.product.title` sur un type qui ne
 * portait que `productId`, si bien que chaque ligne affichait
 * « Produit inconnu ».
 */
export interface CartLine {
  productId: string;
  title: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  /** Stock connu à l'ajout, revalidé au paiement. */
  maxStock: number;
}

/** Lignes d'un même vendeur : chaque groupe donnera une commande. */
export interface CartGroup {
  vendorId: string;
  vendorName: string;
  lines: CartLine[];
  subtotal: number;
}

// ============================================
// COMMANDES
// ============================================

/**
 * Cycle de vie côté vente.
 * `refused` (le vendeur décline) et `cancelled` (le client renonce) sont
 * distincts : ils n'engagent pas la même responsabilité.
 */
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'refused'
  | 'cancelled';

/**
 * Transitions autorisées, et qui peut les déclencher.
 * Garde unique partagée par l'app et les services — la v1 laissait passer
 * `delivered → pending` et `cancelled → delivered`.
 */
export const ORDER_TRANSITIONS: Record<
  OrderStatus,
  { to: OrderStatus; by: 'client' | 'vendor' }[]
> = {
  pending: [
    { to: 'accepted', by: 'vendor' },
    { to: 'refused', by: 'vendor' },
    { to: 'cancelled', by: 'client' },
  ],
  accepted: [
    { to: 'preparing', by: 'vendor' },
    { to: 'cancelled', by: 'client' },
  ],
  preparing: [{ to: 'ready', by: 'vendor' }],
  ready: [{ to: 'completed', by: 'vendor' }],
  completed: [],
  refused: [],
  cancelled: [],
};

/** Une transition est-elle permise pour cet acteur ? */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: 'client' | 'vendor'
): boolean {
  return ORDER_TRANSITIONS[from].some((t) => t.to === to && t.by === actor);
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  refused: 'Refusée',
  cancelled: 'Annulée',
};

export type PaymentStatus = 'unpaid' | 'processing' | 'paid' | 'refunded' | 'failed';

/** Le paiement à la livraison reste la norme au Burkina ; le reste suivra. */
export type PaymentMethod = 'cash_on_delivery' | 'mobile_money' | 'card';

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Paiement à la livraison',
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
};

export type ShippingMethod = 'pickup' | 'delivery';

/** Détail chiffré, calculé par `lib/money.ts` et figé à la commande. */
export interface OrderPricing {
  subtotal: number;
  shipping: number;
  /** Part AubeShop sur la vente, déduite du versement vendeur. */
  commission: number;
  vendorPayout: number;
  /** Part du livreur sur les frais de livraison. */
  courierPayout: number;
  /** Ce que le client paie. */
  total: number;
}

/** Article commandé — copie figée, insensible aux évolutions du produit. */
export interface OrderLine {
  productId: string;
  title: string;
  image?: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Commande — `/orders/{orderId}`.
 * Toujours un seul vendeur ; `groupId` relie celles d'un même passage en caisse.
 */
export interface Order {
  id: string;
  /**
   * Relie les commandes issues d'un même panier. Le client voit « sa commande
   * du 3 mars », chaque vendeur ne voit que ce qui le concerne.
   */
  groupId: string;

  clientId: string;
  clientName: string;
  clientPhone: string;

  vendorId: string;
  vendorName: string;

  lines: OrderLine[];
  pricing: OrderPricing;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  shippingMethod: ShippingMethod;
  /** Obligatoire si `shippingMethod === 'delivery'`. */
  address?: Address;
  /** Renseigné si `shippingMethod === 'pickup'`. */
  pickupPoint?: string;

  /** Hors `timeline` pour trier sans index exotique. */
  createdAt: number;
  timeline: Partial<Record<OrderStatus, number>>;

  clientNote?: string;
  cancelReason?: string;
  review?: OrderReview;
}

export interface OrderReview {
  rating: number;
  comment?: string;
  createdAt: number;
}

// ============================================
// LIVRAISONS
// ============================================

export type DeliveryStatus =
  /** Dans le vivier, aucun livreur ne l'a prise. */
  | 'available'
  /** Un livreur l'a acceptée, pas encore récupérée chez le vendeur. */
  | 'claimed'
  | 'picked_up'
  | 'delivered'
  | 'failed';

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  available: 'À prendre',
  claimed: 'Acceptée',
  picked_up: 'En route',
  delivered: 'Livrée',
  failed: 'Échouée',
};

/**
 * Course — `/deliveries/{orderId}`.
 *
 * Collection distincte de `orders` **pour des raisons de vie privée** : le
 * vivier est lisible par tous les livreurs disponibles, donc il ne contient
 * que ce qui permet de décider d'accepter — quartier, zone, tarif, nombre
 * d'articles. Le téléphone et l'adresse exacte du client restent dans la
 * commande, que seul le livreur ayant accepté peut lire.
 */
export interface Delivery {
  /** Identique à l'id de la commande. */
  orderId: string;
  groupId: string;
  status: DeliveryStatus;

  /** Où récupérer. */
  vendorId: string;
  vendorName: string;
  pickupPoint?: string;
  campus: Campus;

  /** Où livrer — volontairement approximatif tant que non acceptée. */
  zone: DeliveryZoneId;
  district: string;
  city: string;

  /** Rémunération de la course. */
  fee: number;
  payout: number;
  itemCount: number;

  courierId?: string;
  courierName?: string;
  courierPhone?: string;

  createdAt: number;
  claimedAt?: number;
  pickedUpAt?: number;
  deliveredAt?: number;
  failureReason?: string;
}

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType =
  | 'order_placed'
  | 'order_accepted'
  | 'order_preparing'
  | 'order_ready'
  | 'order_completed'
  | 'order_refused'
  | 'order_cancelled'
  | 'delivery_available'
  | 'delivery_claimed'
  | 'delivery_picked_up'
  | 'delivery_delivered'
  | 'application_approved'
  | 'application_rejected'
  | 'review_received';

/** Notification — `/notifications/{id}`. */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Route expo-router ouverte au clic. */
  href?: string;
  isRead: boolean;
  createdAt: number;
}

// ============================================
// COMMISSIONS
// ============================================

/** Écriture de commission — `/commissions/{id}`, lecture seule côté app. */
export interface Commission {
  id: string;
  vendorId: string;
  orderId: string;
  amount: number;
  orderSubtotal: number;
  status: 'pending' | 'settled';
  createdAt: number;
  settledAt?: number;
}

// ============================================
// REQUÊTES
// ============================================

export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'popular';

export interface CatalogFilters {
  category?: CategoryId;
  campus?: Campus;
  search?: string;
  sort?: SortOption;
}

/** Page de résultats, avec le curseur de pagination Firestore. */
export interface Page<T> {
  items: T[];
  hasMore: boolean;
  /** `QueryDocumentSnapshot` opaque, à repasser tel quel. */
  cursor: unknown | null;
}

// ============================================
// CONTEXTES
// ============================================

export interface AuthContextValue {
  user: User | null;
  /** Vitrine, chargée seulement pour un rôle vendeur. */
  vendor: VendorProfile | null;
  /** Profil livreur, chargé seulement pour le rôle livreur. */
  courier: CourierProfile | null;
  /** Candidature en cours, pour afficher l'état « en attente ». */
  application: Application | null;

  /** `true` tant que l'état d'authentification initial n'est pas résolu. */
  initializing: boolean;
  /** `true` pendant une opération déclenchée par l'utilisateur. */
  busy: boolean;

  isAuthenticated: boolean;
  isVendor: boolean;
  isCourier: boolean;
  isAdmin: boolean;

  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  apply: (input: ApplicationInput) => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<User, 'displayName' | 'phone' | 'campus' | 'avatar'>>
  ) => Promise<void>;
  saveAddress: (address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
}

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  campus?: Campus;
}

/** Saisie de candidature, avant envoi du justificatif vers Storage. */
export interface ApplicationInput {
  kind: ApplicationKind;
  method: VerificationMethod;
  campus: Campus;
  phone: string;
  /** URI locale du justificatif. */
  documentImage?: string;
  universityEmail?: string;
  storeName?: string;
  studentId?: string;
  businessId?: string;
  standLocation?: string;
  vehicle?: CourierProfile['vehicle'];
  zones?: DeliveryZoneId[];
}

export interface CartContextValue {
  lines: CartLine[];
  /** Regroupées par vendeur — une commande sera créée par groupe. */
  groups: CartGroup[];
  /** Somme des quantités, pas le nombre de lignes. */
  itemCount: number;
  subtotal: number;
  /** `true` tant que le panier n'est pas relu depuis le stockage local. */
  hydrating: boolean;

  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Quantité déjà au panier pour ce produit, 0 sinon. */
  quantityOf: (productId: string) => number;
}
