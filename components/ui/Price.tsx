/**
 * components/ui/Price.tsx
 * =======================
 * Affichage monétaire. Passe toujours par `lib/money` : c'est ce qui évite
 * les trois formats concurrents de la v1 (`formatPrice()`, `${n} €`, `'€0.00'`).
 */

import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { formatXOF } from '@/lib/money';

export function Price({
  value,
  size = 'md',
  tone = 'primary',
  /** Barré, pour un prix de référence. */
  strike = false,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'primary' | 'default' | 'muted';
  strike?: boolean;
}) {
  const variant = (
    { sm: 'captionStrong', md: 'bodyStrong', lg: 'heading', xl: 'title' } as const
  )[size];

  return (
    <Text
      variant={variant}
      tone={tone === 'primary' ? 'primary' : tone === 'muted' ? 'muted' : 'default'}
      style={strike ? { textDecorationLine: 'line-through' } : undefined}>
      {formatXOF(value)}
    </Text>
  );
}

/** Ligne « libellé … montant » d'un récapitulatif de commande. */
export function PriceRow({
  label,
  value,
  emphasis = false,
  tone,
  /** Affiche le montant en négatif (commission déduite). */
  negative = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
  tone?: 'muted' | 'success' | 'danger';
  negative?: boolean;
}) {
  const t = useTheme();
  const variant = emphasis ? 'subheading' : 'body';

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: t.spacing.md,
        paddingVertical: t.spacing.xs,
      }}>
      <Text variant={variant} tone={emphasis ? 'default' : 'muted'}>
        {label}
      </Text>
      <Text
        variant={emphasis ? 'subheading' : 'bodyStrong'}
        tone={emphasis ? 'primary' : (tone ?? 'default')}>
        {negative ? '− ' : ''}
        {formatXOF(value)}
      </Text>
    </View>
  );
}
