/**
 * constants/theme.ts
 * ==================
 * Système de design AubeShop — source de vérité unique.
 *
 * Tout ce qui est visuel passe par ici : couleurs, espacements, typographie,
 * rayons, ombres. Aucun écran ne doit inventer ses propres valeurs.
 *
 * Marque : rouge / noir / blanc. Le rouge « Aube » est décliné en deux
 * variantes par thème car un aplat de bouton et un texte coloré n'ont pas
 * les mêmes exigences de contraste (WCAG AA : 4.5:1).
 */

import { Platform, TextStyle } from 'react-native';

// ============================================
// ÉCHELLES BRUTES (indépendantes du thème)
// ============================================

/** Espacements — base 4. Utiliser ces clés, jamais un nombre en dur. */
export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Rayons de bordure. `full` pour les pastilles et avatars. */
export const Radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

/** Taille minimale d'une cible tactile (recommandation WCAG / Apple HIG). */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_SIZE = 44;

/** Durées d'animation, en millisecondes. */
export const Duration = {
  instant: 120,
  fast: 180,
  normal: 240,
  slow: 360,
} as const;

// ============================================
// TYPOGRAPHIE
// ============================================

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
})!;

/**
 * Échelle typographique. Chaque entrée porte taille, interlignage et graisse
 * ensemble — on ne règle jamais un `fontSize` sans son `lineHeight`.
 */
export const Type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  subheading: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6 },
} satisfies Record<string, TextStyle>;

// ============================================
// PALETTES
// ============================================

/**
 * Palette claire.
 *
 * `primary` est un aplat (texte blanc dessus), `primaryText` sert au texte et
 * aux icônes rouges posés sur un fond de page.
 */
const light = {
  // Fonds
  background: '#F6F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F1F4',
  surfaceInverse: '#101013',
  overlay: 'rgba(16, 16, 19, 0.55)',

  // Texte
  text: '#101013',
  textMuted: '#61616E',
  textSubtle: '#8E8E9B',
  textInverse: '#FFFFFF',
  textDisabled: '#B4B4BF',

  // Marque
  primary: '#C81E3C',
  primaryPressed: '#A81833',
  primaryText: '#B01832',
  primarySubtle: '#FDEBEF',
  onPrimary: '#FFFFFF',

  // Traits
  border: '#E4E4E9',
  borderStrong: '#CFCFD8',
  divider: '#EDEDF1',

  // Statuts — `*Subtle` sert de fond de badge, la couleur pleine du texte
  success: '#0E7C3A',
  successSubtle: '#E4F5EA',
  warning: '#9A5B00',
  warningSubtle: '#FCF0DC',
  danger: '#C0271F',
  dangerSubtle: '#FCEAE8',
  info: '#1D4ED8',
  infoSubtle: '#E8EDFD',

  // Divers
  shadow: '#101013',
  skeleton: '#E8E8ED',
  star: '#E8A317',
};

/** Palette sombre — mêmes clés, obligatoirement. */
const dark: typeof light = {
  background: '#0D0D10',
  surface: '#17171C',
  surfaceAlt: '#1F1F26',
  surfaceInverse: '#F2F2F5',
  overlay: 'rgba(0, 0, 0, 0.7)',

  text: '#F2F2F5',
  textMuted: '#A3A3B0',
  textSubtle: '#7C7C8A',
  textInverse: '#101013',
  textDisabled: '#55555F',

  primary: '#D92B47',
  primaryPressed: '#B92038',
  primaryText: '#FF8095',
  primarySubtle: '#2A1219',
  onPrimary: '#FFFFFF',

  border: '#2A2A33',
  borderStrong: '#3A3A46',
  divider: '#23232B',

  success: '#3DD17A',
  successSubtle: '#0F2A1B',
  warning: '#FBBF24',
  warningSubtle: '#2E2410',
  danger: '#FF7A70',
  dangerSubtle: '#2E1513',
  info: '#7AA2FF',
  infoSubtle: '#141D33',

  shadow: '#000000',
  skeleton: '#23232B',
  star: '#F5C242',
};

export const Colors = { light, dark };

/** Un thème résolu (clair ou sombre) tel que le consomment les composants. */
export type Palette = typeof light;
export type ColorSchemeName = keyof typeof Colors;

// ============================================
// OMBRES
// ============================================

/**
 * Élévations. Android n'utilise que `elevation`, iOS/web les `shadow*`.
 * La couleur suit le thème, d'où la fonction plutôt qu'un objet figé.
 */
export const elevation = (palette: Palette, level: 0 | 1 | 2 | 3) => {
  if (level === 0) return {};
  const config = {
    1: { opacity: 0.06, radius: 6, offset: 2, elevation: 2 },
    2: { opacity: 0.1, radius: 14, offset: 5, elevation: 5 },
    3: { opacity: 0.16, radius: 26, offset: 10, elevation: 10 },
  }[level];

  return {
    shadowColor: palette.shadow,
    shadowOpacity: config.opacity,
    shadowRadius: config.radius,
    shadowOffset: { width: 0, height: config.offset },
    elevation: config.elevation,
  };
};

// ============================================
// AGRÉGAT
// ============================================

/** Tout le design system en un objet, pour `useTheme()`. */
export const Theme = {
  spacing: Spacing,
  radius: Radius,
  type: Type,
  fonts: Fonts,
  duration: Duration,
} as const;
