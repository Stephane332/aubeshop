/**
 * app/auth/forgot-password.tsx
 * ============================
 * Réinitialisation du mot de passe.
 *
 * Le message de confirmation est volontairement identique que l'adresse
 * existe ou non : révéler qu'un compte est inconnu permettrait d'énumérer
 * les utilisateurs inscrits.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, Input, Screen, Text } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { isValidEmail } from '@/lib/format';

export default function ForgotPasswordScreen() {
  const t = useTheme();
  const router = useRouter();
  const { resetPassword, busy } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError('Adresse email invalide.');
      return;
    }
    try {
      await resetPassword(email);
    } catch {
      // Silencieux : voir l'en-tête du fichier.
    } finally {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="mail-open-outline"
          title="Vérifiez votre boîte mail"
          message={`Si un compte existe pour ${email.trim()}, vous recevrez un lien de réinitialisation dans quelques instants.`}
          actionLabel="Retour à la connexion"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.xxl }}>
        <View style={{ gap: t.spacing.xxs }}>
          <Text variant="title">Mot de passe oublié</Text>
          <Text variant="body" tone="muted">
            Indiquez votre adresse email : nous vous enverrons un lien pour choisir un nouveau
            mot de passe.
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="vous@exemple.com"
          icon="mail-outline"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setError(null);
          }}
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onSubmitEditing={submit}
          returnKeyType="send"
        />

        <View style={{ gap: t.spacing.sm }}>
          <Button label="Envoyer le lien" block loading={busy} onPress={submit} />
          <Button label="Annuler" variant="ghost" block onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
