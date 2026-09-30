/**
 * components/ui/Button.tsx
 * ========================
 * Bouton unique de l'app.
 *
 * Reprend ce qui manquait à la v1 : un état pressé visible, un état de
 * chargement qui empêche le double envoi, une cible tactile d'au moins
 * 44 px, et un rôle d'accessibilité renseigné.
 */

import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { MIN_TOUCH_SIZE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  /** Icône Ionicons affichée avant le libellé. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icône affichée après le libellé (chevron, flèche…). */
  iconAfter?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  /** Occupe toute la largeur disponible. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  loading = false,
  block = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  // Un bouton en cours de chargement ne doit plus répondre : c'est ce qui
  // évite la double commande sur un double tap.
  const inactive = disabled || loading;

  const height = { sm: 36, md: MIN_TOUCH_SIZE, lg: 52 }[size];
  const paddingHorizontal = { sm: t.spacing.md, md: t.spacing.lg, lg: t.spacing.xl }[size];
  const textVariant = size === 'sm' ? 'captionStrong' : 'bodyStrong';
  const iconSize = size === 'sm' ? 15 : 18;

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: t.colors.primary, fg: t.colors.onPrimary },
    secondary: { bg: 'transparent', fg: t.colors.text, border: t.colors.borderStrong },
    ghost: { bg: 'transparent', fg: t.colors.primaryText },
    danger: { bg: t.colors.danger, fg: t.colors.onPrimary },
  };
  const { bg, fg, border } = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.sm,
          borderRadius: t.radius.md,
          backgroundColor: bg,
          borderWidth: border ? 1 : 0,
          borderColor: border,
          alignSelf: block ? 'stretch' : 'flex-start',
          // Le retour tactile passe par l'opacité plutôt que par un
          // changement de couleur, pour rester lisible dans les deux thèmes.
          opacity: inactive ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={iconSize} color={fg} />}
          {/* `numberOfLines` empêche un libellé long de casser la hauteur. */}
          <Text variant={textVariant} numberOfLines={1} style={{ color: fg }}>
            {label}
          </Text>
          {iconAfter && <Ionicons name={iconAfter} size={iconSize} color={fg} />}
        </>
      )}
    </Pressable>
  );
}

/**
 * Bouton réduit à une icône. Conserve la cible tactile de 44 px même quand
 * le dessin est petit, et exige un libellé d'accessibilité.
 */
export function IconButton({
  icon,
  label,
  onPress,
  tone = 'default',
  size = MIN_TOUCH_SIZE,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  /** Lu par les lecteurs d'écran — obligatoire, l'icône seule ne dit rien. */
  label: string;
  onPress?: () => void;
  tone?: 'default' | 'muted' | 'primary' | 'danger' | 'inverse';
  size?: number;
  disabled?: boolean;
}) {
  const t = useTheme();
  const color = {
    default: t.colors.text,
    muted: t.colors.textMuted,
    primary: t.colors.primaryText,
    danger: t.colors.danger,
    inverse: t.colors.textInverse,
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: t.radius.full,
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
      })}>
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={color} />
    </Pressable>
  );
}

/** Espace vertical standard entre deux boutons empilés. */
export function ButtonRow({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing.md }}>{children}</View>
  );
}
