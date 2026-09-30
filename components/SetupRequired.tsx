/**
 * components/SetupRequired.tsx
 * ============================
 * Écran affiché tant qu'AubeShop n'a pas de projet Firebase relié.
 *
 * Sans cela, une configuration absente se traduit par une page blanche et
 * une erreur « auth/invalid-api-key » illisible dans la console. Ici, on
 * dit ce qu'il manque et comment le corriger.
 */

import { Ionicons } from '@expo/vector-icons';
import { Linking, ScrollView, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const STEPS = [
  {
    title: 'Créer le projet Firebase',
    detail: 'Sur console.firebase.google.com, créez un projet puis ajoutez-y une application Web.',
  },
  {
    title: 'Copier les clés dans .env',
    detail:
      'Dupliquez .env.example en .env et remplacez chaque valeur par celle du bloc firebaseConfig.',
  },
  {
    title: 'Activer les services',
    detail:
      'Authentication (Email/Mot de passe), Firestore Database et Storage, de préférence en région europe-west.',
  },
  {
    title: 'Déployer les règles',
    detail:
      'firebase deploy --only firestore:rules,firestore:indexes,storage — les fichiers sont à la racine du dépôt.',
  },
  {
    title: 'Relancer le serveur',
    detail: 'Les variables EXPO_PUBLIC_ ne sont lues qu’au démarrage de Metro.',
  },
];

export function SetupRequired() {
  const t = useTheme();

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.xl }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.xl }}>
          <Logo size={64} />
          <View style={{ alignItems: 'center', gap: t.spacing.xs }}>
            <Text variant="title" center>
              Configuration requise
            </Text>
            <Text variant="body" tone="muted" center>
              AubeShop n&apos;est relié à aucun projet Firebase. L&apos;interface fonctionne, mais
              aucune donnée ne peut être lue ni enregistrée.
            </Text>
          </View>
        </View>

        <View style={{ gap: t.spacing.sm }}>
          {STEPS.map((step, index) => (
            <Card key={step.title}>
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: t.radius.full,
                    backgroundColor: t.colors.primarySubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text variant="captionStrong" tone="primary">
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: t.spacing.xxs }}>
                  <Text variant="bodyStrong">{step.title}</Text>
                  <Text variant="caption" tone="muted">
                    {step.detail}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Card level={0}>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'flex-start' }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={t.colors.info} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              Les clés Firebase préfixées EXPO_PUBLIC_ sont publiques par nature : elles se
              retrouvent dans le paquet de l&apos;application. Ce sont les règles Firestore et
              Storage, livrées avec ce dépôt, qui protègent réellement les données.
            </Text>
          </View>
        </Card>

        <Button
          label="Ouvrir la console Firebase"
          icon="open-outline"
          block
          onPress={() => Linking.openURL('https://console.firebase.google.com')}
        />
      </ScrollView>
    </Screen>
  );
}
