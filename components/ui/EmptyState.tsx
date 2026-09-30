/**
 * components/ui/EmptyState.tsx
 * ============================
 * État vide, et son cousin l'état d'erreur.
 *
 * Un écran vide doit toujours proposer une porte de sortie : la v1 renvoyait
 * l'utilisateur vers `/`, qui était la démo Expo.
 */

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  icon = 'cube-outline',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger';
}) {
  const t = useTheme();
  const accent = tone === 'danger' ? t.colors.danger : t.colors.textSubtle;
  const halo = tone === 'danger' ? t.colors.dangerSubtle : t.colors.surfaceAlt;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: t.spacing.xl,
        paddingVertical: t.spacing.huge,
        gap: t.spacing.md,
      }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: t.radius.full,
          backgroundColor: halo,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: t.spacing.xs,
        }}>
        <Ionicons name={icon} size={32} color={accent} />
      </View>

      <Text variant="heading" center>
        {title}
      </Text>

      {message && (
        <Text variant="body" tone="muted" center>
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={tone === 'danger' ? 'secondary' : 'primary'}
          style={{ marginTop: t.spacing.sm }}
        />
      )}
    </View>
  );
}

/**
 * Erreur de chargement avec possibilité de réessayer.
 *
 * La v1 avalait les erreurs (`catch { return [] }`) et affichait « Aucune
 * commande » — l'utilisateur ne pouvait pas distinguer « vide » de « cassé ».
 */
export function ErrorState({
  message = "Le chargement a échoué. Vérifiez votre connexion.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      tone="danger"
      title="Oups, ça n'a pas marché"
      message={message}
      actionLabel={onRetry ? 'Réessayer' : undefined}
      onAction={onRetry}
    />
  );
}
