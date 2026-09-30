/**
 * app/auth/login.tsx
 * ==================
 * Connexion.
 *
 * Les erreurs s'affichent sous le champ concerné plutôt que dans une
 * `Alert` modale, et le bouton est verrouillé pendant l'envoi.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Screen, Text, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { isValidEmail } from '@/lib/format';
import { Logo } from '@/components/Logo';

export default function LoginScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { signIn, busy } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Adresse email invalide.';
    if (password.length === 0) next.password = 'Saisissez votre mot de passe.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await signIn(email, password);
      // La garde du layout racine redirige vers l'accueil du rôle.
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connexion impossible.');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.huge }}>
        <View style={{ alignItems: 'center', gap: t.spacing.md }}>
          <Logo size={64} />
          <View style={{ alignItems: 'center', gap: t.spacing.xxs }}>
            <Text variant="display">AubeShop</Text>
            <Text variant="body" tone="muted" center>
              Achetez et vendez facilement sur le campus.
            </Text>
          </View>
        </View>

        <View style={{ gap: t.spacing.md }}>
          <Input
            label="Email"
            placeholder="vous@exemple.com"
            icon="mail-outline"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            icon="lock-closed-outline"
            revealable
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          <Button
            label="Mot de passe oublié ?"
            variant="ghost"
            size="sm"
            style={{ alignSelf: 'flex-end' }}
            onPress={() => router.push('/auth/forgot-password')}
          />

          <Button label="Se connecter" block loading={busy} onPress={submit} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: t.spacing.xs,
          }}>
          <Text variant="body" tone="muted">
            Pas encore de compte ?
          </Text>
          <Button
            label="Créer un compte"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/auth/signup')}
          />
        </View>

        <Button
          label="Parcourir sans compte"
          variant="ghost"
          size="sm"
          iconAfter="arrow-forward"
          style={{ alignSelf: 'center' }}
          onPress={() => router.replace('/')}
        />
      </View>
    </Screen>
  );
}
