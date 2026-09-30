/**
 * components/ui/StatTile.tsx
 * ==========================
 * Indicateur chiffré des tableaux de bord.
 *
 * Le nombre passe en premier et en gros, le libellé en dessous : c'est la
 * valeur qu'on vient lire, pas son intitulé.
 */

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import type { BadgeTone } from '@/components/ui/Badge';

export function StatTile({
  label,
  value,
  icon,
  tone = 'neutral',
  /** Précision sous le libellé (« +3 cette semaine »). */
  hint,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: BadgeTone;
  hint?: string;
}) {
  const t = useTheme();

  const accent = {
    neutral: t.colors.textMuted,
    primary: t.colors.primaryText,
    success: t.colors.success,
    warning: t.colors.warning,
    danger: t.colors.danger,
    info: t.colors.info,
  }[tone];

  const halo = {
    neutral: t.colors.surfaceAlt,
    primary: t.colors.primarySubtle,
    success: t.colors.successSubtle,
    warning: t.colors.warningSubtle,
    danger: t.colors.dangerSubtle,
    info: t.colors.infoSubtle,
  }[tone];

  return (
    <View
      // Le lecteur d'écran annonce « 12 commandes en attente » d'un bloc,
      // plutôt que trois fragments séparés.
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{
        flex: 1,
        minWidth: 140,
        gap: t.spacing.xs,
        padding: t.spacing.lg,
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
      }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: t.radius.sm,
          backgroundColor: halo,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: t.spacing.xxs,
        }}>
        <Ionicons name={icon} size={17} color={accent} />
      </View>

      <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      {hint && (
        <Text variant="caption" style={{ color: accent }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

/** Grille responsive de tuiles : deux par ligne, retour à la ligne auto. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }}>
      {children}
    </View>
  );
}
