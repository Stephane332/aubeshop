/**
 * constants/catalog.ts
 * ====================
 * Référentiels du catalogue : catégories et tris.
 *
 * Les identifiants sont stables et en anglais ; seuls les libellés sont
 * traduits. Renommer « Livres » en « Livres & manuels » n'invalide donc
 * aucun produit existant.
 */

import type { Category, CategoryId, SortOption } from '@/types';

export const CATEGORIES: Category[] = [
  { id: 'books', label: 'Livres & manuels', icon: 'book-outline' },
  { id: 'electronics', label: 'Électronique', icon: 'phone-portrait-outline' },
  { id: 'fashion', label: 'Mode', icon: 'shirt-outline' },
  { id: 'food', label: 'Alimentation', icon: 'fast-food-outline' },
  { id: 'supplies', label: 'Fournitures', icon: 'pencil-outline' },
  { id: 'services', label: 'Services', icon: 'construct-outline' },
  { id: 'other', label: 'Divers', icon: 'ellipsis-horizontal-outline' },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Libellé d'une catégorie, avec repli sûr si la donnée est inattendue. */
export function categoryLabel(id: CategoryId | undefined): string {
  return (id && CATEGORY_BY_ID.get(id)?.label) || 'Divers';
}

export function categoryIcon(id: CategoryId | undefined): string {
  return (id && CATEGORY_BY_ID.get(id)?.icon) || 'ellipsis-horizontal-outline';
}

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'recent', label: 'Plus récents' },
  { id: 'popular', label: 'Populaires' },
  { id: 'price_asc', label: 'Prix croissant' },
  { id: 'price_desc', label: 'Prix décroissant' },
];
