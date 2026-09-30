/**
 * lib/feedback.ts
 * ===============
 * Retours haptiques et confirmations bloquantes.
 *
 * Règle de partage avec les toasts :
 * - une action réussie ou une information → `useToast()` ;
 * - une décision irréversible (supprimer, annuler, refuser) → `confirm()`.
 *
 * La v1 utilisait `Alert` pour les deux, y compris pour confirmer un ajout
 * au panier.
 */

import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';

type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select';

/**
 * Vibration courte. Silencieuse sur le web, où l'API n'existe pas, et
 * volontairement non bloquante : un retour haptique ne doit jamais faire
 * échouer l'action qu'il accompagne.
 */
export function haptic(kind: HapticKind = 'light'): void {
  if (Platform.OS === 'web') return;

  const run = () => {
    switch (kind) {
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'error':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      case 'select':
        return Haptics.selectionAsync();
      case 'medium':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'heavy':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      default:
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  void Promise.resolve().then(run).catch(() => {});
}

/**
 * Demande une confirmation avant une action irréversible.
 *
 * Résout `true` si l'utilisateur confirme. Contrairement à la v1, le bouton
 * d'annulation porte bien `style: 'cancel'` et l'action destructive
 * `style: 'destructive'`, ce qui change leur apparence et leur position sur
 * iOS et permet de fermer par un geste.
 */
export function confirm(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Confirmer',
    cancelLabel = 'Annuler',
    destructive = false,
  } = options;

  // `Alert` n'existe pas sur le web : on retombe sur la boîte native.
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(
      typeof globalThis.confirm === 'function' ? globalThis.confirm(text) : true
    );
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => {
          haptic(destructive ? 'warning' : 'medium');
          resolve(true);
        },
      },
    ]);
  });
}
