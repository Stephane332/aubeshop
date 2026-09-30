/**
 * app/auth/signup.tsx
 * ===================
 * Création de compte.
 *
 * Tout le monde s'inscrit comme client. Devenir vendeur ou livreur passe
 * ensuite par une candidature vérifiée — la v1 accordait le rôle vendeur
 * dès l'inscription, sans attendre le moindre contrôle.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Input, Screen, Text, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';
import { isValidEmail, isValidPhone } from '@/lib/format';
import { CAMPUSES, type Campus } from '@/types';

export default function SignUpScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { signUp, busy } = useAuth();

  const [displayName, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState<Campus | undefined>();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const submit = async () => {
    const next: Record<string, string | undefined> = {};
    if (displayName.trim().length < 2) next.displayName = 'Indiquez votre nom complet.';
    if (!isValidEmail(email)) next.email = 'Adresse email invalide.';
    if (phone && !isValidPhone(phone)) next.phone = 'Numéro burkinabè à 8 chiffres.';
    if (password.length < 8) next.password = 'Au moins 8 caractères.';

    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    try {
      await signUp({ email, password, displayName, phone: phone || undefined, campus });
      toast.success('Bienvenue sur AubeShop !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Inscription impossible.');
    }
  };

  const clearError = (key: string) =>
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.xxl }}>
        <View style={{ gap: t.spacing.xxs }}>
          <Text variant="display">Créer un compte</Text>
          <Text variant="body" tone="muted">
            Quelques secondes suffisent pour commencer à acheter.
          </Text>
        </View>

        <View style={{ gap: t.spacing.md }}>
          <Input
            label="Nom complet"
            placeholder="Awa Traoré"
            icon="person-outline"
            value={displayName}
            onChangeText={(v) => {
              setName(v);
              clearError('displayName');
            }}
            error={errors.displayName}
            autoComplete="name"
            textContentType="name"
          />

          <Input
            label="Email"
            placeholder="vous@exemple.com"
            icon="mail-outline"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              clearError('email');
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Input
            label="Téléphone"
            placeholder="70 12 34 56"
            icon="call-outline"
            suffix="+226"
            hint="Pour que le vendeur et le livreur puissent vous joindre."
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              clearError('phone');
            }}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Input
            label="Mot de passe"
            placeholder="8 caractères minimum"
            icon="lock-closed-outline"
            revealable
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              clearError('password');
            }}
            error={errors.password}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <View style={{ gap: t.spacing.xs }}>
            <Text variant="captionStrong" tone="muted">
              Campus (facultatif)
            </Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              {CAMPUSES.map((c) => {
                const active = campus === c;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Campus ${c}`}
                    onPress={() => {
                      haptic('select');
                      setCampus(active ? undefined : c);
                    }}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: t.radius.md,
                      backgroundColor: active ? t.colors.primarySubtle : t.colors.surface,
                      borderWidth: 1,
                      borderColor: active ? t.colors.primary : t.colors.border,
                      opacity: pressed ? 0.75 : 1,
                    })}>
                    <Text
                      variant="captionStrong"
                      style={{ color: active ? t.colors.primaryText : t.colors.textMuted }}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button label="Créer mon compte" block loading={busy} onPress={submit} />

          <Text variant="caption" tone="subtle" center>
            En créant un compte, vous acceptez les conditions d&apos;utilisation d&apos;AubeShop.
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: t.spacing.xs,
          }}>
          <Text variant="body" tone="muted">
            Déjà inscrit ?
          </Text>
          <Button
            label="Se connecter"
            variant="ghost"
            size="sm"
            onPress={() => router.replace('/auth/login')}
          />
        </View>
      </View>
    </Screen>
  );
}
