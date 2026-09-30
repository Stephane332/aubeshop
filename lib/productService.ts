/**
 * lib/productService.ts
 * =====================
 * Catalogue et gestion des produits.
 *
 * Corrections par rapport à la v1 :
 * - les erreurs remontent au lieu d'être avalées en `return []`, ce qui
 *   faisait afficher « aucun résultat » sur une panne réseau ou un index
 *   manquant ;
 * - `stock` est un entier, plus un objet qu'une mise à jour partielle
 *   écrasait silencieusement ;
 * - la recherche s'appuie sur un tableau de mots-clés indexé, au lieu de
 *   télécharger 100 documents pour les filtrer sur le téléphone.
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type {
  CatalogFilters,
  Page,
  Product,
  ProductDraft,
  VendorProfile,
} from '@/types';
import { stripUndefined } from './authService';
import { firestore } from './firebase.config';
import { toAmount } from './money';
import { uploadImages } from './uploadService';

const PAGE_SIZE = 20;

// ============================================
// RECHERCHE
// ============================================

/**
 * Découpe un titre en mots-clés interrogeables.
 *
 * Firestore ne sait pas faire de recherche plein texte : on pré-calcule les
 * termes à l'écriture pour pouvoir utiliser `array-contains` à la lecture.
 * Les accents sont retirés afin que « electronique » trouve « électronique ».
 */
export function buildKeywords(...parts: string[]): string[] {
  const words = parts
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);

  // Limité à 30 termes : Firestore plafonne la taille des index de tableau.
  return Array.from(new Set(words)).slice(0, 30);
}

function normalizeSearch(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// ============================================
// LECTURE DU CATALOGUE
// ============================================

function catalogConstraints(filters: CatalogFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where('status', '==', 'active')];

  if (filters.category) constraints.push(where('category', '==', filters.category));
  if (filters.campus) constraints.push(where('vendorCampus', '==', filters.campus));

  if (filters.search) {
    const term = normalizeSearch(filters.search);
    if (term) constraints.push(where('keywords', 'array-contains', term));
  }

  switch (filters.sort) {
    case 'price_asc':
      constraints.push(orderBy('price', 'asc'));
      break;
    case 'price_desc':
      constraints.push(orderBy('price', 'desc'));
      break;
    case 'popular':
      constraints.push(orderBy('soldCount', 'desc'));
      break;
    default:
      constraints.push(orderBy('createdAt', 'desc'));
  }

  return constraints;
}

/**
 * Une page du catalogue.
 *
 * @param cursor Dernier document de la page précédente, tel que renvoyé ici.
 */
export async function fetchCatalog(
  filters: CatalogFilters = {},
  cursor?: unknown
): Promise<Page<Product>> {
  const constraints = catalogConstraints(filters);
  if (cursor) constraints.push(startAfter(cursor as QueryDocumentSnapshot));
  // On demande un élément de plus que nécessaire pour savoir s'il reste
  // une page, sans second appel.
  constraints.push(fsLimit(PAGE_SIZE + 1));

  const snapshot = await getDocs(query(collection(firestore, 'products'), ...constraints));
  const docs = snapshot.docs;
  const hasMore = docs.length > PAGE_SIZE;
  const page = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

  return {
    items: page.map(toProduct),
    hasMore,
    cursor: page.length > 0 ? page[page.length - 1] : null,
  };
}

export async function fetchProduct(productId: string): Promise<Product> {
  const snap = await getDoc(doc(firestore, 'products', productId));
  if (!snap.exists()) throw new Error("Ce produit n'existe plus.");
  return toProduct(snap);
}

/** Produits d'un vendeur, brouillons et masqués compris. */
export async function fetchVendorProducts(vendorId: string): Promise<Product[]> {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'products'),
      where('vendorId', '==', vendorId),
      where('status', 'in', ['active', 'hidden']),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map(toProduct);
}

/**
 * Abonnement temps réel au catalogue d'un vendeur.
 * Le tableau de bord reflète ainsi une vente sans rafraîchissement manuel.
 */
export function watchVendorProducts(
  vendorId: string,
  onChange: (products: Product[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(
      collection(firestore, 'products'),
      where('vendorId', '==', vendorId),
      where('status', 'in', ['active', 'hidden']),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => onChange(snapshot.docs.map(toProduct)),
    onError
  );
}

// ============================================
// ÉCRITURE
// ============================================

/** Crée un produit. Les images partent vers Storage au préalable. */
export async function createProduct(
  vendor: VendorProfile,
  draft: ProductDraft
): Promise<string> {
  validateDraft(draft);

  const images = await uploadImages(draft.images, `products/${vendor.uid}`);
  const now = Date.now();

  const product: Omit<Product, 'id'> = {
    vendorId: vendor.uid,
    vendorName: vendor.storeName,
    vendorKind: vendor.kind,
    vendorCampus: vendor.campus,
    title: draft.title.trim(),
    description: draft.description.trim(),
    price: toAmount(draft.price),
    category: draft.category,
    images,
    stock: Math.max(0, Math.trunc(draft.stock)),
    status: 'active',
    keywords: buildKeywords(draft.title, draft.description, vendor.storeName),
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(firestore, 'products'), stripUndefined(product));
  return ref.id;
}

/**
 * Modifie un produit.
 *
 * N'accepte que des champs explicitement autorisés : la v1 étalait un
 * `Partial<ProductInput>` dans `updateDoc`, si bien qu'envoyer `stock: 5`
 * remplaçait l'objet de stock par un entier et corrompait le document.
 */
export async function updateProduct(
  vendorId: string,
  productId: string,
  draft: ProductDraft
): Promise<void> {
  validateDraft(draft);

  const images = await uploadImages(draft.images, `products/${vendorId}`);

  await updateDoc(doc(firestore, 'products', productId), {
    title: draft.title.trim(),
    description: draft.description.trim(),
    price: toAmount(draft.price),
    category: draft.category,
    images,
    stock: Math.max(0, Math.trunc(draft.stock)),
    keywords: buildKeywords(draft.title, draft.description),
    updatedAt: Date.now(),
  });
}

/** Masque ou réaffiche un produit sans perdre son historique de ventes. */
export async function setProductVisibility(
  productId: string,
  visible: boolean
): Promise<void> {
  await updateDoc(doc(firestore, 'products', productId), {
    status: visible ? 'active' : 'hidden',
    updatedAt: Date.now(),
  });
}

/**
 * Retire définitivement un produit du catalogue.
 * Reste un retrait logique : les commandes passées y font référence.
 */
export async function removeProduct(productId: string): Promise<void> {
  await updateDoc(doc(firestore, 'products', productId), {
    status: 'removed',
    updatedAt: Date.now(),
  });
}

// ============================================
// OUTILS
// ============================================

function validateDraft(draft: ProductDraft): void {
  if (!draft.title.trim()) throw new Error('Le titre est requis.');
  if (draft.title.trim().length < 3) throw new Error('Le titre est trop court.');
  if (toAmount(draft.price) <= 0) throw new Error('Indiquez un prix supérieur à 0.');
  if (draft.stock < 0) throw new Error('Le stock ne peut pas être négatif.');
  if (draft.images.length === 0) throw new Error('Ajoutez au moins une photo.');
}

/**
 * Convertit un document Firestore en `Product` en comblant les champs
 * manquants. Les documents ne sont pas validés à l'écriture par le SDK : un
 * ancien document sans `stock` faisait planter la carte produit de la v1 sur
 * un accès direct à `product.stock.available`.
 */
function toProduct(snap: QueryDocumentSnapshot | Awaited<ReturnType<typeof getDoc>>): Product {
  const data = snap.data() as Partial<Product>;
  return {
    id: snap.id,
    vendorId: data.vendorId ?? '',
    vendorName: data.vendorName ?? 'Vendeur',
    vendorKind: data.vendorKind ?? 'student',
    vendorCampus: data.vendorCampus ?? 'Ouagadougou',
    title: data.title ?? 'Produit',
    description: data.description ?? '',
    price: toAmount(data.price),
    category: data.category ?? 'other',
    images: Array.isArray(data.images) ? data.images : [],
    stock: Math.max(0, Math.trunc(Number(data.stock) || 0)),
    status: data.status ?? 'active',
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    rating: Number(data.rating) || 0,
    reviewCount: Number(data.reviewCount) || 0,
    soldCount: Number(data.soldCount) || 0,
    createdAt: Number(data.createdAt) || 0,
    updatedAt: Number(data.updatedAt) || 0,
  };
}
