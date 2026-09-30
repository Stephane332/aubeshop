/**
 * components/SetupBanner.tsx
 * ==========================
 * Avertissement affiché tant qu'aucun projet Firebase n'est relié.
 *
 * Volontairement **non bloquant** : un écran plein empêcherait de
 * parcourir l'interface et de travailler le design avant d'avoir un
 * backend. L'application reste navigable ; seules les données manquent,
 * et chaque écran affiche alors son état d'erreur.
 *
 * Repliable, et l'état du repli tient jusqu'au rechargement — on ne veut
 * ni l'oublier, ni le subir à chaque écran.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Text } from '@/components/ui';
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
    detail: 'Authentication (Email/Mot de passe), Firestore Database et Storage.',
  },
  {
    title: 'Déployer les règles et les index',
    detail:
      'firebase deploy --only firestore:rules,firestore:indexes,storage — les fichiers sont à la racine du dépôt. Sans les index, les requêtes filtrées échouent.',
  },
  {
    title: 'Relancer le serveur',
    detail: 'Les variables EXPO_PUBLIC_ ne sont lues qu’au démarrage de Metro.',
  },
];

export function SetupBanner() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <View
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 900,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          paddingHorizontal: t.spacing.md,
          paddingVertical: t.spacing.sm,
          backgroundColor: t.colors.warning,
        }}>
        <Ionicons name="warning-outline" size={16} color="#FFFFFF" />
        <Text variant="caption" style={{ flex: 1, color: '#FFFFFF' }}>
          Firebase non configuré — aucune donnée ne sera chargée.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir comment configurer Firebase"
          onPress={() => setOpen(true)}
          hitSlop={8}>
          <Text variant="captionStrong" style={{ color: '#FFFFFF', textDecorationLine: 'underline' }}>
            Configurer
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Masquer cet avertissement"
          onPress={() => setDismissed(true)}
          hitSlop={8}>
          <Ionicons name="close" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: t.colors.background, paddingTop: insets.top }}>
          <ScrollView
            contentContainerStyle={{
              padding: t.spacing.lg,
              gap: t.spacing.lg,
              paddingBottom: insets.bottom + t.spacing.xxl,
            }}>
            <View style={{ gap: t.spacing.xs }}>
              <Text variant="title">Relier un projet Firebase</Text>
              <Text variant="body" tone="muted">
                L&apos;interface fonctionne déjà. Ces étapes lui donnent des données.
              </Text>
            </View>

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

            <Card level={0}>
              <View style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'flex-start' }}>
                <Ionicons name="shield-checkmark-outline" size={18} color={t.colors.info} />
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  Les clés préfixées EXPO_PUBLIC_ sont publiques par nature : elles se retrouvent
                  dans le paquet de l&apos;application. Ce sont les règles Firestore et Storage,
                  livrées avec ce dépôt, qui protègent réellement les données.
                </Text>
              </View>
            </Card>

            <Button
              label="Ouvrir la console Firebase"
              icon="open-outline"
              block
              onPress={() => Linking.openURL('https://console.firebase.google.com')}
            />
            <Button label="Fermer" variant="ghost" block onPress={() => setOpen(false)} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
