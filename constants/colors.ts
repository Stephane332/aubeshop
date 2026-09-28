/**
 * constants/colors.ts
 * ====================
 * Palette de couleurs AubeShop (Rouge / Noir / Blanc)
 * Commentaires en français
 */

/**
 * COLORS - Objet centralisé de couleurs
 * Utilisé partout dans l'app pour cohérence visuelle
 */
export const COLORS = {
  // ============================================
  // COULEURS PRIMAIRES (ROUGE)
  // ============================================
  primary: '#DC143C',        // Rouge crimson (principal)
  primaryLight: '#FF6B6B',   // Rouge clair (secondaire)
  primaryDark: '#A00000',    // Rouge foncé (accent)

  // ============================================
  // COULEURS SECONDAIRES (NOIR)
  // ============================================
  secondary: '#000000',      // Noir pur
  secondaryLight: '#333333', // Gris très foncé
  secondaryDarker: '#1A1A1A', // Presque noir

  // ============================================
  // COULEURS TERTIAIRES (BLANC)
  // ============================================
  tertiary: '#FFFFFF',       // Blanc pur
  tertiaryLight: '#F9F9F9',  // Blanc cassé (fond)
  tertiaryGray: '#F5F5F5',   // Gris très clair

  // ============================================
  // COULEURS NEUTRES (GRIS)
  // ============================================
  gray: '#F5F5F5',           // Gris très clair (fond)
  grayMedium: '#CCCCCC',     // Gris moyen (bordures)
  grayDark: '#999999',       // Gris foncé (texte secondaire)
  grayLight: '#EEEEEE',      // Gris très clair

  // ============================================
  // COULEURS DE STATUT
  // ============================================
  success: '#28A745',        // Vert (succès, livré)
  warning: '#FFA500',        // Orange (en attente, en cours)
  error: '#DC3545',          // Rouge (erreur, rejeté)
  info: '#1E90FF',           // Bleu (info, notification)

  // ============================================
  // COULEURS TEXTE
  // ============================================
  textPrimary: '#000000',    // Texte noir (titre, principal)
  textSecondary: '#666666',  // Texte gris (description)
  textTertiary: '#999999',   // Texte gris clair (aide, placeholder)
  textInverse: '#FFFFFF',    // Texte blanc (sur fond foncé)
  textDisabled: '#CCCCCC',   // Texte désactivé

  // ============================================
  // COULEURS FOND
  // ============================================
  backgroundPrimary: '#FFFFFF',  // Fond blanc (principal)
  backgroundSecondary: '#F5F5F5', // Fond gris très clair
  backgroundModal: 'rgba(0, 0, 0, 0.5)', // Overlay semi-transparent

  // ============================================
  // COULEURS SPÉCIALES
  // ============================================
  border: '#DDDDDD',         // Couleur bordures
  divider: '#EEEEEE',        // Couleur séparateurs
  placeholder: '#BBBBBB',    // Texte placeholder inputs
  shadow: 'rgba(0, 0, 0, 0.1)', // Ombre légère
};

/**
 * OPACITY - Niveaux d'opacité
 * Utilisé pour les variations de couleurs
 */
export const OPACITY = {
  full: 1,
  high: 0.8,
  medium: 0.6,
  low: 0.4,
  veryLow: 0.2,
};

/**
 * COLORS_SEMANTIC - Couleurs sémantiques selon contexte
 * Plus lisible que des valeurs hex directes
 */
export const COLORS_SEMANTIC = {
  // Boutons
  buttonPrimary: COLORS.primary,
  buttonPrimaryHover: COLORS.primaryDark,
  buttonSecondary: COLORS.secondary,
  buttonSecondaryHover: COLORS.secondaryLight,
  buttonDisabled: COLORS.grayMedium,

  // Cartes & conteneurs
  cardBackground: COLORS.tertiary,
  cardBorder: COLORS.border,
  cardShadow: COLORS.shadow,

  // Formulaires
  inputBackground: COLORS.tertiaryLight,
  inputBorder: COLORS.border,
  inputBorderFocus: COLORS.primary,
  inputPlaceholder: COLORS.textTertiary,
  inputError: COLORS.error,

  // Barres & headers
  headerBackground: COLORS.primary,
  headerText: COLORS.textInverse,
  tabBarBackground: COLORS.tertiary,
  tabBarBorder: COLORS.border,

  // Badges & tags
  badgeSuccess: COLORS.success,
  badgeWarning: COLORS.warning,
  badgeError: COLORS.error,
  badgeInfo: COLORS.info,

  // Listes & item
  listItemBackground: COLORS.tertiary,
  listItemHover: COLORS.tertiaryGray,
  listItemBorder: COLORS.divider,

  // Modals
  modalBackground: COLORS.tertiary,
  modalOverlay: COLORS.backgroundModal,
  modalBorder: COLORS.border,

  // Links
  link: COLORS.primary,
  linkVisited: COLORS.primaryDark,
  linkHover: COLORS.primaryLight,
};

/**
 * GRADIENTS - Dégradés pour animations (Reanimated)
 * Utiliser avec react-native-reanimated
 */
export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.primaryLight],
  secondary: [COLORS.secondary, COLORS.secondaryLight],
  warm: ['#FF6B6B', '#FFE66D'],
  cool: ['#1E90FF', '#00BFFF'],
};
