/**
 * components/ui/Badge.tsx
 * =======================
 * Pastilles d'état : statut de commande, de livraison, de candidature.
 *
 * Chaque ton a un fond assourdi et un texte plein : un badge reste lisible
 * dans les deux thèmes, contrairement aux aplats saturés de la v1.
 */

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import {
  DELIVERY_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  type DeliveryStatus,
  type OrderStatus,
} from '@/types';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const t = useTheme();

  const map = {
    neutral: { bg: t.colors.surfaceAlt, fg: t.colors.textMuted },
    primary: { bg: t.colors.primarySubtle, fg: t.colors.primaryText },
    success: { bg: t.colors.successSubtle, fg: t.colors.success },
    warning: { bg: t.colors.warningSubtle, fg: t.colors.warning },
    danger: { bg: t.colors.dangerSubtle, fg: t.colors.danger },
    info: { bg: t.colors.infoSubtle, fg: t.colors.info },
  }[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.xs,
        alignSelf: 'flex-start',
        backgroundColor: map.bg,
        paddingHorizontal: t.spacing.sm,
        paddingVertical: t.spacing.xs,
        borderRadius: t.radius.full,
      }}>
      {icon && <Ionicons name={icon} size={12} color={map.fg} />}
      <Text variant="captionStrong" style={{ color: map.fg }}>
        {label}
      </Text>
    </View>
  );
}

/** Ton associé à chaque statut de commande. */
const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  accepted: 'info',
  preparing: 'info',
  ready: 'primary',
  completed: 'success',
  refused: 'danger',
  cancelled: 'neutral',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={ORDER_STATUS_LABEL[status]} tone={ORDER_TONE[status]} />;
}

const DELIVERY_TONE: Record<DeliveryStatus, BadgeTone> = {
  available: 'primary',
  claimed: 'info',
  picked_up: 'info',
  delivered: 'success',
  failed: 'danger',
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <Badge label={DELIVERY_STATUS_LABEL[status]} tone={DELIVERY_TONE[status]} />;
}

/**
 * Marque de confiance d'un vendeur. C'est l'argument central d'AubeShop —
 * la v1 avait un composant pour ça et ne l'affichait nulle part.
 */
export function VerifiedBadge({ kind }: { kind: 'student' | 'partner' }) {
  return kind === 'partner' ? (
    <Badge label="Partenaire" tone="info" icon="storefront" />
  ) : (
    <Badge label="Étudiant vérifié" tone="success" icon="shield-checkmark" />
  );
}
