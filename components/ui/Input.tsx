/**
 * components/ui/Input.tsx
 * =======================
 * Champ de saisie avec libellé, aide et erreur.
 *
 * L'erreur est reliée au champ via `accessibilityLabel` afin qu'un lecteur
 * d'écran l'annonce — la v1 affichait les erreurs dans des `Alert` modales.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { IconButton } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Texte d'aide sous le champ, masqué quand une erreur s'affiche. */
  hint?: string;
  error?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Affiche l'œil pour révéler le mot de passe. */
  revealable?: boolean;
  /** Suffixe fixe affiché à droite (« FCFA », « @u-auben.bf »). */
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  hint,
  error,
  icon,
  revealable = false,
  suffix,
  containerStyle,
  ...rest
}: InputProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(revealable);

  const borderColor = error
    ? t.colors.danger
    : focused
      ? t.colors.primary
      : t.colors.border;

  return (
    <View style={[{ gap: t.spacing.xs }, containerStyle]}>
      {label && (
        <Text variant="captionStrong" tone="muted">
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          minHeight: 48,
          paddingHorizontal: t.spacing.md,
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.md,
          borderWidth: 1,
          borderColor,
        }}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? t.colors.primary : t.colors.textSubtle}
          />
        )}

        <TextInput
          accessibilityLabel={label}
          // L'erreur est annoncée avec le champ plutôt que dans une modale.
          accessibilityHint={error ?? hint}
          placeholderTextColor={t.colors.textSubtle}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            Type.body,
            {
              flex: 1,
              color: t.colors.text,
              // Android ajoute un rembourrage vertical par défaut qui
              // désaligne le texte dans un conteneur à hauteur fixe.
              paddingVertical: 0,
            },
          ]}
          {...rest}
        />

        {suffix && (
          <Text variant="caption" tone="subtle">
            {suffix}
          </Text>
        )}

        {revealable && (
          <IconButton
            icon={hidden ? 'eye-outline' : 'eye-off-outline'}
            label={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            tone="muted"
            size={32}
            onPress={() => setHidden((v) => !v)}
          />
        )}
      </View>

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
