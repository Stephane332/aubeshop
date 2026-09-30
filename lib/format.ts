/**
 * lib/format.ts
 * =============
 * Formatage de dates et de texte, en français.
 *
 * Remplace l'ancien `lib/utils.ts`, dont l'export par défaut omettait cinq
 * fonctions et dont plusieurs écrans importaient des noms inexistants
 * (`formatDate`, `validateEmail`).
 */

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Garde-fou : un horodatage absent ne doit pas produire « Invalid Date ». */
function toDate(timestamp: unknown): Date | null {
  const n = Number(timestamp);
  if (!Number.isFinite(n) || n <= 0) return null;
  const date = new Date(n);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « il y a 2 heures ». */
export function formatRelative(timestamp: unknown): string {
  const date = toDate(timestamp);
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/** « Aujourd'hui à 14:30 », « Hier à 09:15 », sinon « 12 mars 2026 à 14:30 ». */
export function formatDateTime(timestamp: unknown): string {
  const date = toDate(timestamp);
  if (!date) return '—';

  if (isToday(date)) return `Aujourd'hui à ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Hier à ${format(date, 'HH:mm')}`;
  return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

/** « 12 mars 2026 ». */
export function formatDate(timestamp: unknown): string {
  const date = toDate(timestamp);
  return date ? format(date, 'd MMMM yyyy', { locale: fr }) : '—';
}

// ============================================
// TEXTE
// ============================================

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ============================================
// VALIDATION
// ============================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Numéro burkinabè : 8 chiffres, éventuellement précédés de l'indicatif
 * +226. Les espaces et tirets de saisie sont tolérés.
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^\d+]/g, '');
  return /^(\+?226)?[0-9]{8}$/.test(digits);
}

/**
 * Met en forme un numéro burkinabè : « 70 12 34 56 ».
 *
 * La v1 échappait deux fois ses classes de caractères (`/\\D/g` au lieu de
 * `/\D/g`), si bien que la fonction ne remplaçait jamais rien.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^226/, '');
  if (digits.length !== 8) return phone;
  return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}
