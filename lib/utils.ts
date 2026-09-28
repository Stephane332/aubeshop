/**
 * lib/utils.ts
 * ============
 * Utilitaires et helpers
 * Formatage dates, validation, etc.
 * Commentaires en français
 */

import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formater une date en français (ex: "il y a 2 heures")
 */
export const formatDateRelative = (timestamp: number): string => {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: fr,
    });
  } catch {
    return 'Date invalide';
  }
};

/**
 * Formater une date au format français (ex: "17 nov. 2024")
 */
export const formatDateFrench = (timestamp: number): string => {
  try {
    return format(new Date(timestamp), 'dd MMM yyyy', { locale: fr });
  } catch {
    return 'Date invalide';
  }
};

/**
 * Formater une date avec heure (ex: "17 nov. 2024 14:30")
 */
export const formatDateTimeFrench = (timestamp: number): string => {
  try {
    return format(new Date(timestamp), 'dd MMM yyyy HH:mm', { locale: fr });
  } catch {
    return 'Date invalide';
  }
};

/**
 * Valider format email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valider format URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Formater prix (ex: "25,50 €")
 */
export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(price);
};

/**
 * Formater devise courte (ex: "25€")
 */
export const formatPriceShort = (price: number): string => {
  return `${price.toFixed(2)}€`;
};

/**
 * Tronquer texte avec "..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitaliser première lettre
 */
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitaliser chaque mot
 */
export const capitalizeName = (str: string): string => {
  return str
    .split(' ')
    .map((word) => capitalizeFirst(word.toLowerCase()))
    .join(' ');
};

/**
 * Générer couleur aléatoire (pour avatars)
 */
export const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Obtenir initiales (ex: "Marc Dupont" → "MD")
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

/**
 * Formater numéro téléphone (optionnel)
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\\D/g, '');
  const match = cleaned.match(/^(\\d{3})(\\d{3})(\\d{4})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]}`;
  }
  return phone;
};

/**
 * Générer ID unique (pour clés React, etc.)
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Délai (pour async/await)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Vérifier si page en bas (pour infinite scroll)
 */
export const isScrolledToBottom = (
  contentOffsetY: number,
  contentHeight: number,
  layoutHeight: number,
  threshold: number = 100
): boolean => {
  return contentOffsetY + layoutHeight >= contentHeight - threshold;
};

/**
 * Encoder fichier image en base64
 */
export const encodeImageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Erreur encodage image:', error);
    throw error;
  }
};

/**
 * Extraire domaine d'email
 */
export const extractEmailDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : '';
};

/**
 * Formater statut commande en français
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: '⏳ En attente',
    accepted: '✅ Acceptée',
    'in-progress': '🔄 En cours de préparation',
    ready: '📦 Prête pour retrait',
    delivered: '✓ Livrée',
    cancelled: '❌ Annulée',
  };
  return statusMap[status] || status;
};

/**
 * Obtenir couleur statut commande
 */
export const getOrderStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    pending: '#FFA500', // Orange
    accepted: '#FFA500', // Orange
    'in-progress': '#1E90FF', // Bleu
    ready: '#4ECDC4', // Cyan
    delivered: '#28A745', // Vert
    cancelled: '#DC3545', // Rouge
  };
  return colorMap[status] || '#999999';
};

/**
 * Valider numéro étudiant (format: ETU-XXXX-XXXXX)
 */
export const isValidStudentId = (id: string): boolean => {
  const studentIdRegex = /^[A-Z0-9]{6,20}$/;
  return studentIdRegex.test(id);
};

/**
 * Cloner objet (deep copy)
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Fusionner objets
 */
export const mergeObjects = <T>(obj1: T, obj2: Partial<T>): T => {
  return { ...obj1, ...obj2 };
};

export default {
  formatDateRelative,
  formatDateFrench,
  formatDateTimeFrench,
  isValidEmail,
  formatPrice,
  formatPriceShort,
  truncateText,
  capitalizeFirst,
  capitalizeName,
  getRandomColor,
  getInitials,
  generateId,
  delay,
  isScrolledToBottom,
  formatOrderStatus,
  getOrderStatusColor,
  isValidStudentId,
};
