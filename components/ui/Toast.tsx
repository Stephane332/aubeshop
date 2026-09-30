/**
 * components/ui/Toast.tsx
 * =======================
 * Retour non bloquant, en remplacement des 36 `Alert.alert` de la v1.
 *
 * Une confirmation d'ajout au panier ne doit pas exiger un tap pour
 * disparaître. `Alert` reste réservé aux décisions réellement bloquantes
 * (supprimer, annuler une commande) — voir `confirm()` dans `lib/feedback`.
 */

import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';

type ToastKind = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DISPLAY_MS = 2800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  // Les délais sont suivis pour être annulés au démontage, sinon un toast
  // affiché juste avant une navigation tente de modifier un état démonté.
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId.current++;
      haptic(kind === 'error' ? 'error' : kind === 'success' ? 'success' : 'light');
      setToasts((current) => [...current.slice(-2), { id, kind, text }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DISPLAY_MS)
      );
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (text) => push('success', text),
      error: (text) => push('error', text),
      info: (text) => push('info', text),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      // `box-none` laisse passer les taps vers l'écran en dessous : le toast
      // informe, il ne bloque pas l'interaction.
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + t.spacing.sm,
        left: t.spacing.lg,
        right: t.spacing.lg,
        gap: t.spacing.sm,
        zIndex: 1000,
      }}>
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
}

function ToastRow({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const t = useTheme();

  const style = {
    success: { bg: t.colors.success, icon: 'checkmark-circle' },
    error: { bg: t.colors.danger, icon: 'alert-circle' },
    info: { bg: t.colors.surfaceInverse, icon: 'information-circle' },
  }[toast.kind] as { bg: string; icon: keyof typeof Ionicons.glyphMap };

  // Le texte doit contraster avec le fond : blanc sur les tons pleins,
  // couleur inversée du thème sur le ton neutre.
  const fg = toast.kind === 'info' ? t.colors.background : '#FFFFFF';

  return (
    <Animated.View entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)}>
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={toast.text}
        onPress={onDismiss}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          backgroundColor: style.bg,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          borderRadius: t.radius.md,
          ...t.elevation(2),
        }}>
        <Ionicons name={style.icon} size={20} color={fg} />
        <Text variant="bodyStrong" style={{ flex: 1, color: fg }}>
          {toast.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** Accès aux toasts. Nécessite `ToastProvider` en amont. */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider');
  return context;
}
