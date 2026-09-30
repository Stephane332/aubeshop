/**
 * app/(tabs)/profile.tsx
 * ======================
 * Profil, adresses et accès aux candidatures.
 *
 * La v1 y affichait les boutons du tableau de bord vendeur à tout compte
 * portant le rôle, **y compris en attente de vérification**, et ces boutons
 * menaient à des routes inexistantes. Ici l'état de la candidature est
 * explicite et chaque lien mène quelque part.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Screen,
  Text,
  VerifiedBadge,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/feedback';
import { formatPhone, formatRelative } from '@/lib/format';
import { ROLE_LABEL, ROLE_FOR_APPLICATION } from '@/types';

export default function ProfileScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user, vendor, courier, application, isVendor, isCourier, isAdmin, signOut } = useAuth();

  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon="person-circle-outline"
          title="Vous n'êtes pas connecté"
          message="Connectez-vous pour commander, suivre vos livraisons et gérer votre compte."
          actionLabel="Se connecter"
          onAction={() => router.push('/auth/login')}
        />
      </Screen>
    );
  }

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Se déconnecter ?',
      confirmLabel: 'Se déconnecter',
      destructive: true,
    });
    if (!ok) return;

    try {
      await signOut();
      router.replace('/auth/login');
    } catch {
      toast.error('Déconnexion impossible.');
    }
  };

  const defaultAddress = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

  return (
    <Screen scroll>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.md }}>
        {/* Identité */}
        <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
          <Avatar name={user.displayName} uri={user.avatar} size={72} />
          <View style={{ alignItems: 'center', gap: t.spacing.xxs }}>
            <Text variant="heading">{user.displayName}</Text>
            <Text variant="caption" tone="muted">
              {user.email}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.xs, flexWrap: 'wrap', justifyContent: 'center' }}>
            {isVendor && vendor ? (
              <VerifiedBadge kind={vendor.kind} />
            ) : (
              <Badge
                label={ROLE_LABEL[user.role]}
                tone={isAdmin ? 'danger' : isCourier ? 'info' : 'neutral'}
                icon={isAdmin ? 'shield' : isCourier ? 'bicycle' : 'person'}
              />
            )}
            {user.campus && <Badge label={user.campus} tone="neutral" icon="school" />}
          </View>
        </View>

        {/* Candidature en cours ou refusée */}
        {application && application.status !== 'approved' && (
          <ApplicationStatusCard
            status={application.status}
            role={ROLE_LABEL[ROLE_FOR_APPLICATION[application.kind]]}
            reason={application.rejectionReason}
            submittedAt={application.submittedAt}
          />
        )}

        {/* Devenir vendeur ou livreur */}
        {!isVendor && !isCourier && !isAdmin && application?.status !== 'pending' && (
          <View style={{ gap: t.spacing.sm }}>
            <Text variant="subheading">Rejoindre AubeShop</Text>

            <Card onPress={() => router.push('/become/student_vendor')} accessibilityLabel="Devenir vendeur étudiant">
              <Opportunity
                icon="school-outline"
                title="Vendeur étudiant"
                description="Vendez vos livres, votre matériel ou vos services. Vérification par carte d'étudiant."
              />
            </Card>

            <Card onPress={() => router.push('/become/partner_vendor')} accessibilityLabel="Devenir vendeur partenaire">
              <Opportunity
                icon="storefront-outline"
                title="Vendeur partenaire"
                description="Vous tenez un stand ou un commerce près du campus ? Ouvrez votre boutique en ligne."
              />
            </Card>

            <Card onPress={() => router.push('/become/courier')} accessibilityLabel="Devenir livreur">
              <Opportunity
                icon="bicycle-outline"
                title="Livreur"
                description="Livrez sur le campus et en ville, à votre rythme. Vous choisissez vos courses."
              />
            </Card>
          </View>
        )}

        {/* Adresses */}
        {!isCourier && !isAdmin && (
          <View style={{ gap: t.spacing.sm }}>
            <Text variant="subheading">Adresse de livraison</Text>
            <Card>
              {defaultAddress ? (
                <View style={{ gap: t.spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                    <Ionicons name="location-outline" size={18} color={t.colors.primaryText} />
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {defaultAddress.label}
                    </Text>
                    <Badge label="Par défaut" tone="primary" />
                  </View>
                  <Text variant="caption" tone="muted">
                    {defaultAddress.district}, {defaultAddress.city}
                    {defaultAddress.landmark ? ` — ${defaultAddress.landmark}` : ''}
                  </Text>
                  <Text variant="caption" tone="subtle">
                    {formatPhone(defaultAddress.phone)}
                  </Text>
                  <Button
                    label="Gérer mes adresses"
                    variant="secondary"
                    icon="create-outline"
                    block
                    onPress={() => router.push('/account/address')}
                  />
                </View>
              ) : (
                <View style={{ gap: t.spacing.md }}>
                  <Text variant="caption" tone="muted">
                    Aucune adresse enregistrée. Ajoutez-en une pour commander en livraison.
                  </Text>
                  <Button
                    label="Ajouter une adresse"
                    icon="add-circle-outline"
                    block
                    onPress={() => router.push('/account/address')}
                  />
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Raccourcis métier */}
        {(isVendor || isCourier) && (
          <View style={{ gap: t.spacing.sm }}>
            <Text variant="subheading">Mon activité</Text>
            {isVendor && (
              <>
                <Button
                  label="Mes produits"
                  icon="pricetags-outline"
                  variant="secondary"
                  block
                  onPress={() => router.push('/products')}
                />
                <Button
                  label="Mes ventes"
                  icon="receipt-outline"
                  variant="secondary"
                  block
                  onPress={() => router.push('/orders')}
                />
              </>
            )}
            {isCourier && courier && (
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ gap: t.spacing.xxs }}>
                    <Text variant="caption" tone="muted">
                      Courses livrées
                    </Text>
                    <Text variant="heading">{courier.deliveryCount}</Text>
                  </View>
                  <View style={{ gap: t.spacing.xxs, alignItems: 'flex-end' }}>
                    <Text variant="caption" tone="muted">
                      Zones desservies
                    </Text>
                    <Text variant="heading">{courier.zones.length}</Text>
                  </View>
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Compte */}
        <View style={{ gap: t.spacing.sm }}>
          <Text variant="subheading">Compte</Text>
          <Card padded={false}>
            <Line icon="call-outline" label="Téléphone" value={user.phone ? formatPhone(user.phone) : 'Non renseigné'} />
            <Line icon="calendar-outline" label="Membre depuis" value={formatRelative(user.createdAt)} last />
          </Card>

          <Button
            label="Se déconnecter"
            variant="ghost"
            icon="log-out-outline"
            block
            onPress={handleSignOut}
          />
        </View>
      </View>
    </Screen>
  );
}

function ApplicationStatusCard({
  status,
  role,
  reason,
  submittedAt,
}: {
  status: 'pending' | 'rejected';
  role: string;
  reason?: string;
  submittedAt: number;
}) {
  const t = useTheme();
  const pending = status === 'pending';

  return (
    <Card level={0}>
      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: t.radius.full,
            backgroundColor: pending ? t.colors.warningSubtle : t.colors.dangerSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons
            name={pending ? 'hourglass-outline' : 'close-circle-outline'}
            size={20}
            color={pending ? t.colors.warning : t.colors.danger}
          />
        </View>

        <View style={{ flex: 1, gap: t.spacing.xxs }}>
          <Text variant="bodyStrong">
            {pending ? `Candidature « ${role} » en examen` : `Candidature « ${role} » refusée`}
          </Text>
          <Text variant="caption" tone="muted">
            {pending
              ? `Déposée ${formatRelative(submittedAt)}. Réponse sous 24 à 48 h.`
              : reason || 'Votre justificatif n’a pas pu être validé.'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function Opportunity({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.md,
          backgroundColor: t.colors.primarySubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name={icon} size={20} color={t.colors.primaryText} />
      </View>
      <View style={{ flex: 1, gap: t.spacing.xxs }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="muted">
          {description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.colors.textSubtle} />
    </View>
  );
}

function Line({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        padding: t.spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.colors.divider,
      }}>
      <Ionicons name={icon} size={18} color={t.colors.textSubtle} />
      <Text variant="body" tone="muted" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}
