/**
 * components/ui/Text.tsx
 * ======================
 * Le seul composant texte de l'app.
 *
 * On choisit un rôle typographique (`variant`) et une couleur sémantique
 * (`tone`), jamais un `fontSize` ni un hexadécimal. C'est ce qui garantit que
 * deux écrans écrits à deux moments différents s'alignent.
 */

import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = keyof typeof Type;
type Tone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  /** Centre le texte — raccourci fréquent, évite un style inline. */
  center?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'default',
  center,
  style,
  ...rest
}: TextProps) {
  const t = useTheme();

  const color = {
    default: t.colors.text,
    muted: t.colors.textMuted,
    subtle: t.colors.textSubtle,
    inverse: t.colors.textInverse,
    primary: t.colors.primaryText,
    success: t.colors.success,
    warning: t.colors.warning,
    danger: t.colors.danger,
  }[tone];

  return (
    <RNText
      style={[Type[variant], { color }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
