/**
 * app/(tabs)/applications.tsx
 * ===========================
 * File de validation des candidatures — vendeurs et livreurs.
 *
 * Branché sur Firestore, contrairement à l'écran d'administration de la v1
 * qui affichait deux candidats codés en dur avec la vraie requête laissée
 * en commentaire.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Platform, Pressable, ScrollView, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  RowSkeleton,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { watchApplications } from '@/lib/adminService';
import { approveApplication, rejectApplication } from '@/lib/authService';
import { confirm, haptic } from '@/lib/feedback';
import { formatPhone, formatRelative } from '@/lib/format';
import { ROLE_LABEL, ROLE_FOR_APPLICATION, type Application, type ApplicationStatus } from '@/types';

const TABS: { id: ApplicationStatus; label: string }[] = [
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Acceptées' },
  { id: 'rejected', label: 'Refusées' },
];

export default function ApplicationsScreen() {
  const t = useTheme();
  const toast = useToast();
  const { user } = useAuth();

  const [status, setStatus] = useState<ApplicationStatus>('pending');
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    return watchApplications(
      status,
      (list) => {
        setItems(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [status]);

  const handleApprove = async (application: Application) => {
    if (!user) return;
    const role = ROLE_LABEL[ROLE_FOR_APPLICATION[application.kind]];

    const ok = await confirm({
      title: 'Accepter cette candidature ?',
      message: `${application.displayName} deviendra « ${role} » et pourra accéder à son tableau de bord.`,
      confirmLabel: 'Accepter',
    });
    if (!ok) return;

    try {
      await approveApplication(application, user.uid);
      haptic('success');
      toast.success(`${application.displayName} est maintenant ${role.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation impossible.');
    }
  };

  const reject = async (application: Application, reason: string) => {
    if (!user) return;
    try {
      await rejectApplication(application.uid, user.uid, reason);
      toast.info('Candidature refusée');
    } catch {
      toast.error('Action impossible.');
    }
  };

  const handleReject = async (application: Application) => {
    if (!user) return;
    const fallbackReason = 'Justificatif non conforme.';

    // Un refus doit être motivé : le candidat reçoit la raison. Seul iOS sait
    // afficher une invite de saisie native ; ailleurs on confirme et on
    // transmet un motif générique plutôt que de bloquer l'administrateur.
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Motif du refus',
        `Ce message sera transmis à ${application.displayName}.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Refuser',
            style: 'destructive',
            onPress: (reason?: string) => void reject(application, reason?.trim() || fallbackReason),
          },
        ],
        'plain-text'
      );
      return;
    }

    const ok = await confirm({
      title: 'Refuser cette candidature ?',
      message: `${application.displayName} sera informé que son justificatif n’est pas conforme.`,
      confirmLabel: 'Refuser',
      destructive: true,
    });
    if (ok) await reject(application, fallbackReason);
  };

  const header = (
    <View style={{ gap: t.spacing.md, paddingBottom: t.spacing.md }}>
      <Text variant="title">Candidatures</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -t.spacing.lg }}
        contentContainerStyle={{ gap: t.spacing.sm, paddingHorizontal: t.spacing.lg }}>
        {TABS.map((tab) => {
          const active = status === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                haptic('select');
                setStatus(tab.id);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: t.spacing.md,
                height: 36,
                justifyContent: 'center',
                borderRadius: t.radius.full,
                backgroundColor: active ? t.colors.primary : t.colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: t.colors.border,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Text
                variant="captionStrong"
                style={{ color: active ? t.colors.onPrimary : t.colors.textMuted }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ gap: t.spacing.md, paddingTop: t.spacing.md }}>
          {header}
          <RowSkeleton />
          <RowSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: t.spacing.xxxl,
          gap: t.spacing.md,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            onApprove={() => handleApprove(item)}
            onReject={() => handleReject(item)}
          />
        )}
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} />
          ) : (
            <EmptyState
              icon="shield-checkmark-outline"
              title={status === 'pending' ? 'Aucune candidature en attente' : 'Rien à afficher'}
              message={
                status === 'pending'
                  ? 'Les nouvelles demandes de vendeurs et de livreurs arriveront ici.'
                  : undefined
              }
            />
          )
        }
      />
    </Screen>
  );
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
}: {
  application: Application;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTheme();
  const role = ROLE_LABEL[ROLE_FOR_APPLICATION[application.kind]];

  // Une adresse universitaire vérifiée est un signal fort : on le met en
  // avant pour que l'administrateur traite ces dossiers en un coup d'œil.
  const preVerified = application.method === 'university_email' && !!application.universityEmail;

  return (
    <Card>
      <View style={{ gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' }}>
          <Avatar name={application.displayName} size={44} />
          <View style={{ flex: 1, gap: t.spacing.xxs }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {application.displayName}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {application.email}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: t.spacing.xs, flexWrap: 'wrap' }}>
          <Badge
            label={role}
            tone={application.kind === 'courier' ? 'info' : 'primary'}
            icon={application.kind === 'courier' ? 'bicycle' : 'storefront'}
          />
          <Badge label={application.campus} tone="neutral" icon="school" />
          {preVerified && (
            <Badge label="Email universitaire" tone="success" icon="shield-checkmark" />
          )}
        </View>

        <View style={{ gap: t.spacing.xs }}>
          {application.storeName && (
            <Field label="Boutique" value={application.storeName} />
          )}
          {application.studentId && (
            <Field label="N° étudiant" value={application.studentId} />
          )}
          {application.businessId && <Field label="IFU" value={application.businessId} />}
          {application.standLocation && (
            <Field label="Stand" value={application.standLocation} />
          )}
          {application.vehicle && <Field label="Véhicule" value={application.vehicle} />}
          {application.universityEmail && (
            <Field label="Email univ." value={application.universityEmail} />
          )}
          <Field label="Téléphone" value={formatPhone(application.phone)} />
          <Field label="Déposée" value={formatRelative(application.submittedAt)} />
        </View>

        {application.documentUrl && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le justificatif en grand"
            onPress={() => Linking.openURL(application.documentUrl!)}
            style={{
              height: 160,
              borderRadius: t.radius.md,
              overflow: 'hidden',
              backgroundColor: t.colors.surfaceAlt,
            }}>
            <Image
              source={{ uri: application.documentUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={180}
            />
          </Pressable>
        )}

        {application.status === 'rejected' && application.rejectionReason && (
          <View
            style={{
              flexDirection: 'row',
              gap: t.spacing.sm,
              padding: t.spacing.md,
              borderRadius: t.radius.md,
              backgroundColor: t.colors.dangerSubtle,
            }}>
            <Ionicons name="close-circle-outline" size={16} color={t.colors.danger} />
            <Text variant="caption" style={{ flex: 1, color: t.colors.danger }}>
              {application.rejectionReason}
            </Text>
          </View>
        )}

        {application.status === 'pending' && (
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Button
              label="Refuser"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={onReject}
            />
            <Button
              label="Accepter"
              icon="checkmark"
              style={{ flex: 1 }}
              onPress={onApprove}
            />
          </View>
        )}
      </View>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
      <Text variant="caption" tone="subtle" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1 }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
