/**
 * app/become/[kind].tsx
 * =====================
 * Candidature pour devenir vendeur étudiant, vendeur partenaire ou livreur.
 *
 * Un seul écran pour les trois parcours : ils partagent l'essentiel et ne
 * diffèrent que par le justificatif demandé et deux ou trois champs.
 *
 * Le justificatif est réellement envoyé vers Firebase Storage. La v1
 * enregistrait l'URI locale du téléphone, si bien que l'administrateur
 * recevait un chemin de fichier pointant vers l'appareil du candidat.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { haptic } from '@/lib/feedback';
import { isValidEmail, isValidPhone } from '@/lib/format';
import { DELIVERY_ZONES, type DeliveryZoneId } from '@/lib/money';
import {
  CAMPUSES,
  VEHICLE_LABEL,
  type ApplicationKind,
  type Campus,
  type CourierProfile,
  type VerificationMethod,
} from '@/types';

/** Ce qui change d'un parcours à l'autre. */
const PROFILES: Record<
  ApplicationKind,
  {
    title: string;
    intro: string;
    method: VerificationMethod;
    documentLabel: string;
    documentHint: string;
  }
> = {
  student_vendor: {
    title: 'Vendeur étudiant',
    intro:
      'Vendez vos livres, votre matériel ou vos services à la communauté du campus. Nous vérifions votre statut étudiant pour rassurer les acheteurs.',
    method: 'student_card',
    documentLabel: 'Carte d’étudiant',
    documentHint: 'Photo nette recto, nom et numéro lisibles.',
  },
  partner_vendor: {
    title: 'Vendeur partenaire',
    intro:
      'Vous tenez un stand ou un commerce près du campus ? Ouvrez votre boutique en ligne et touchez tous les étudiants.',
    method: 'partnership',
    documentLabel: 'Justificatif d’activité',
    documentHint: 'Registre de commerce, IFU ou convention de partenariat.',
  },
  courier: {
    title: 'Livreur',
    intro:
      'Livrez sur le campus et en ville, à votre rythme. Vous choisissez vos courses et vos zones.',
    method: 'id_card',
    documentLabel: 'Pièce d’identité',
    documentHint: 'CNIB ou passeport, recto lisible.',
  },
};

const VEHICLES = Object.keys(VEHICLE_LABEL) as CourierProfile['vehicle'][];

export default function BecomeScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user, apply, busy, application } = useAuth();
  const { kind } = useLocalSearchParams<{ kind: string }>();

  const applicationKind = (kind ?? '') as ApplicationKind;
  const profile = PROFILES[applicationKind];

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [campus, setCampus] = useState<Campus>(user?.campus ?? 'Ouagadougou');
  const [storeName, setStoreName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [standLocation, setStandLocation] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');
  const [vehicle, setVehicle] = useState<CourierProfile['vehicle']>('motorbike');
  const [zones, setZones] = useState<DeliveryZoneId[]>(['campus']);
  const [document, setDocument] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  if (!profile) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="help-circle-outline"
          title="Candidature inconnue"
          actionLabel="Retour"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (application?.status === 'pending') {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="hourglass-outline"
          title="Candidature déjà déposée"
          message="Votre demande est en cours d'examen. Vous recevrez une réponse sous 24 à 48 h."
          actionLabel="Retour au profil"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const isVendorKind = applicationKind !== 'courier';

  const pickDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Autorisez l’accès aux photos pour joindre votre justificatif.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setDocument(result.assets[0].uri);
      setErrors((e) => ({ ...e, document: undefined }));
      haptic('success');
    }
  };

  const toggleZone = (zone: DeliveryZoneId) => {
    haptic('select');
    setZones((current) =>
      current.includes(zone) ? current.filter((z) => z !== zone) : [...current, zone]
    );
  };

  const submit = async () => {
    const next: Record<string, string | undefined> = {};

    if (!isValidPhone(phone)) next.phone = 'Numéro burkinabè à 8 chiffres.';
    if (!document) next.document = `Ajoutez une photo de votre ${profile.documentLabel.toLowerCase()}.`;

    if (isVendorKind && storeName.trim().length < 2) {
      next.storeName = 'Choisissez un nom de boutique.';
    }
    if (applicationKind === 'student_vendor' && studentId.trim().length < 4) {
      next.studentId = 'Numéro de carte étudiant requis.';
    }
    if (applicationKind === 'partner_vendor' && standLocation.trim().length < 3) {
      next.standLocation = 'Indiquez où se trouve votre stand.';
    }
    if (universityEmail && !isValidEmail(universityEmail)) {
      next.universityEmail = 'Adresse email invalide.';
    }
    if (applicationKind === 'courier' && zones.length === 0) {
      next.zones = 'Sélectionnez au moins une zone.';
    }

    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      haptic('error');
      return;
    }

    try {
      await apply({
        kind: applicationKind,
        method: universityEmail ? 'university_email' : profile.method,
        campus,
        phone: phone.trim(),
        documentImage: document,
        universityEmail: universityEmail.trim() || undefined,
        storeName: isVendorKind ? storeName.trim() : undefined,
        studentId: applicationKind === 'student_vendor' ? studentId.trim() : undefined,
        businessId: applicationKind === 'partner_vendor' ? businessId.trim() || undefined : undefined,
        standLocation: applicationKind === 'partner_vendor' ? standLocation.trim() : undefined,
        vehicle: applicationKind === 'courier' ? vehicle : undefined,
        zones: applicationKind === 'courier' ? zones : undefined,
      });

      haptic('success');
      toast.success('Candidature envoyée — réponse sous 24 à 48 h');
      router.back();
    } catch (error) {
      haptic('error');
      toast.error(error instanceof Error ? error.message : 'Envoi impossible.');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={{ gap: t.spacing.xl, paddingTop: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <Text variant="title" style={{ flex: 1 }}>
            {profile.title}
          </Text>
        </View>

        <Card level={0}>
          <Text variant="body" tone="muted">
            {profile.intro}
          </Text>
        </Card>

        {/* Campus */}
        <View style={{ gap: t.spacing.xs }}>
          <Text variant="captionStrong" tone="muted">
            Campus
          </Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            {CAMPUSES.map((c) => (
              <Option
                key={c}
                label={c}
                active={campus === c}
                onPress={() => setCampus(c)}
              />
            ))}
          </View>
        </View>

        <Input
          label="Téléphone"
          placeholder="70 12 34 56"
          icon="call-outline"
          suffix="+226"
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            setErrors((e) => ({ ...e, phone: undefined }));
          }}
          error={errors.phone}
          keyboardType="phone-pad"
        />

        {/* Champs vendeur */}
        {isVendorKind && (
          <Input
            label="Nom de votre boutique"
            placeholder={applicationKind === 'partner_vendor' ? 'Alimentation Sankara' : 'Chez Awa'}
            icon="storefront-outline"
            value={storeName}
            onChangeText={(v) => {
              setStoreName(v);
              setErrors((e) => ({ ...e, storeName: undefined }));
            }}
            error={errors.storeName}
          />
        )}

        {applicationKind === 'student_vendor' && (
          <>
            <Input
              label="Numéro de carte d'étudiant"
              placeholder="UAN2024001"
              icon="card-outline"
              autoCapitalize="characters"
              value={studentId}
              onChangeText={(v) => {
                setStudentId(v);
                setErrors((e) => ({ ...e, studentId: undefined }));
              }}
              error={errors.studentId}
            />
            <Input
              label="Email universitaire (facultatif)"
              placeholder="prenom.nom@u-auben.bf"
              icon="mail-outline"
              hint="Une adresse universitaire accélère la validation de votre dossier."
              keyboardType="email-address"
              autoCapitalize="none"
              value={universityEmail}
              onChangeText={(v) => {
                setUniversityEmail(v);
                setErrors((e) => ({ ...e, universityEmail: undefined }));
              }}
              error={errors.universityEmail}
            />
          </>
        )}

        {applicationKind === 'partner_vendor' && (
          <>
            <Input
              label="Emplacement du stand"
              placeholder="Face à l'entrée principale, bloc B"
              icon="location-outline"
              value={standLocation}
              onChangeText={(v) => {
                setStandLocation(v);
                setErrors((e) => ({ ...e, standLocation: undefined }));
              }}
              error={errors.standLocation}
            />
            <Input
              label="Numéro IFU (facultatif)"
              placeholder="00012345A"
              icon="document-text-outline"
              autoCapitalize="characters"
              value={businessId}
              onChangeText={setBusinessId}
            />
          </>
        )}

        {/* Champs livreur */}
        {applicationKind === 'courier' && (
          <>
            <View style={{ gap: t.spacing.xs }}>
              <Text variant="captionStrong" tone="muted">
                Votre moyen de transport
              </Text>
              <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
                {VEHICLES.map((v) => (
                  <Option
                    key={v}
                    label={VEHICLE_LABEL[v]}
                    active={vehicle === v}
                    onPress={() => setVehicle(v)}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: t.spacing.xs }}>
              <Text variant="captionStrong" tone="muted">
                Zones que vous acceptez de desservir
              </Text>
              <View style={{ gap: t.spacing.sm }}>
                {DELIVERY_ZONES.map((zone) => {
                  const active = zones.includes(zone.id);
                  return (
                    <Pressable
                      key={zone.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`${zone.label}, ${zone.fee} francs`}
                      onPress={() => toggleZone(zone.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: t.spacing.md,
                        padding: t.spacing.md,
                        borderRadius: t.radius.md,
                        backgroundColor: t.colors.surface,
                        borderWidth: 1,
                        borderColor: active ? t.colors.primary : t.colors.border,
                      }}>
                      <Ionicons
                        name={active ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={active ? t.colors.primary : t.colors.textSubtle}
                      />
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text variant="bodyStrong">{zone.label}</Text>
                        <Text variant="caption" tone="subtle">
                          {zone.hint}
                        </Text>
                      </View>
                      <Badge label={`${zone.fee} F`} tone="info" />
                    </Pressable>
                  );
                })}
              </View>
              {errors.zones && (
                <Text variant="caption" tone="danger">
                  {errors.zones}
                </Text>
              )}
            </View>
          </>
        )}

        {/* Justificatif */}
        <View style={{ gap: t.spacing.xs }}>
          <Text variant="captionStrong" tone="muted">
            {profile.documentLabel}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Choisir une photo de votre ${profile.documentLabel.toLowerCase()}`}
            onPress={pickDocument}
            style={{
              height: document ? 200 : 120,
              borderRadius: t.radius.lg,
              borderWidth: 1,
              borderStyle: document ? 'solid' : 'dashed',
              borderColor: errors.document ? t.colors.danger : t.colors.borderStrong,
              backgroundColor: t.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            {document ? (
              <Image
                source={{ uri: document }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            ) : (
              <View style={{ alignItems: 'center', gap: t.spacing.xs }}>
                <Ionicons name="camera-outline" size={28} color={t.colors.textSubtle} />
                <Text variant="caption" tone="muted">
                  Toucher pour ajouter une photo
                </Text>
              </View>
            )}
          </Pressable>

          <Text variant="caption" tone={errors.document ? 'danger' : 'subtle'}>
            {errors.document ?? profile.documentHint}
          </Text>

          {document && (
            <Button
              label="Changer la photo"
              variant="ghost"
              size="sm"
              icon="refresh-outline"
              onPress={pickDocument}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
        </View>

        <View style={{ gap: t.spacing.sm }}>
          <Button label="Envoyer ma candidature" block loading={busy} onPress={submit} />
          <Text variant="caption" tone="subtle" center>
            Votre justificatif n&apos;est consulté que par l&apos;équipe AubeShop, uniquement pour
            vérifier votre dossier.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function Option({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={({ pressed }) => ({
        paddingHorizontal: t.spacing.lg,
        height: 44,
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
        {label}
      </Text>
    </Pressable>
  );
}
