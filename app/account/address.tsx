/**
 * app/account/address.tsx
 * =======================
 * Gestion des adresses de livraison.
 *
 * La v1 n'en avait aucune : le paiement envoyait `{ method: 'delivery' }`
 * en dur, sans la moindre adresse, et le vendeur ne savait pas où livrer.
 *
 * Le formulaire suit l'adressage burkinabè : secteur ou quartier, point de
 * repère, et une zone tarifaire qui détermine le prix de la course.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  IconButton,
  Input,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { confirm, haptic } from '@/lib/feedback';
import { formatPhone, isValidPhone } from '@/lib/format';
import { DELIVERY_ZONES, formatXOF, type DeliveryZoneId } from '@/lib/money';
import type { Address } from '@/types';

export default function AddressScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user, saveAddress, deleteAddress, busy } = useAuth();

  const [editing, setEditing] = useState<Address | null>(null);
  const [label, setLabel] = useState('');
  const [district, setDistrict] = useState('');
  // Une ville libre, pas un campus : on peut se faire livrer ailleurs que
  // dans la ville où l'on étudie.
  const [city, setCity] = useState<string>(user?.campus ?? 'Ouagadougou');
  const [landmark, setLandmark] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [zone, setZone] = useState<DeliveryZoneId>('campus');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formOpen, setFormOpen] = useState(false);

  const addresses = user?.addresses ?? [];

  const openForm = (address?: Address) => {
    if (address) {
      setEditing(address);
      setLabel(address.label);
      setDistrict(address.district);
      setCity(address.city);
      setLandmark(address.landmark ?? '');
      setPhone(address.phone);
      setZone(address.zone);
    } else {
      setEditing(null);
      setLabel('');
      setDistrict('');
      setCity(user?.campus ?? 'Ouagadougou');
      setLandmark('');
      setPhone(user?.phone ?? '');
      setZone('campus');
    }
    setErrors({});
    setFormOpen(true);
  };

  const submit = async () => {
    const next: Record<string, string | undefined> = {};
    if (label.trim().length < 2) next.label = 'Donnez un nom à cette adresse.';
    if (district.trim().length < 2) next.district = 'Indiquez le secteur ou le quartier.';
    if (!isValidPhone(phone)) next.phone = 'Numéro burkinabè à 8 chiffres.';

    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      haptic('error');
      return;
    }

    try {
      await saveAddress({
        id: editing?.id ?? `addr_${Date.now()}`,
        label: label.trim(),
        district: district.trim(),
        city: city.trim(),
        landmark: landmark.trim() || undefined,
        zone,
        phone: phone.trim(),
        isDefault: editing?.isDefault ?? addresses.length === 0,
      });
      haptic('success');
      toast.success(editing ? 'Adresse mise à jour' : 'Adresse enregistrée');
      setFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enregistrement impossible.');
    }
  };

  const makeDefault = async (address: Address) => {
    try {
      await saveAddress({ ...address, isDefault: true });
      toast.success('Adresse par défaut mise à jour');
    } catch {
      toast.error('Modification impossible.');
    }
  };

  const remove = async (address: Address) => {
    const ok = await confirm({
      title: 'Supprimer cette adresse ?',
      message: address.label,
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteAddress(address.id);
      toast.info('Adresse supprimée');
    } catch {
      toast.error('Suppression impossible.');
    }
  };

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: t.spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <Text variant="title" style={{ flex: 1 }}>
            Mes adresses
          </Text>
        </View>

        {!formOpen && (
          <>
            {addresses.map((address) => {
              const zoneInfo = DELIVERY_ZONES.find((z) => z.id === address.zone);
              return (
                <Card key={address.id}>
                  <View style={{ gap: t.spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                      <Ionicons name="location-outline" size={18} color={t.colors.primaryText} />
                      <Text variant="bodyStrong" style={{ flex: 1 }}>
                        {address.label}
                      </Text>
                      {address.isDefault && <Badge label="Par défaut" tone="primary" />}
                    </View>

                    <Text variant="caption" tone="muted">
                      {address.district}, {address.city}
                      {address.landmark ? ` — ${address.landmark}` : ''}
                    </Text>
                    <Text variant="caption" tone="subtle">
                      {formatPhone(address.phone)}
                    </Text>

                    {zoneInfo && (
                      <Badge
                        label={`${zoneInfo.label} · ${formatXOF(zoneInfo.fee)}`}
                        tone="info"
                        icon="bicycle-outline"
                      />
                    )}

                    <View style={{ flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.xs }}>
                      <Button
                        label="Modifier"
                        variant="secondary"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => openForm(address)}
                      />
                      {!address.isDefault && (
                        <Button
                          label="Par défaut"
                          variant="ghost"
                          size="sm"
                          style={{ flex: 1 }}
                          onPress={() => makeDefault(address)}
                        />
                      )}
                      <IconButton
                        icon="trash-outline"
                        label={`Supprimer ${address.label}`}
                        tone="danger"
                        size={36}
                        onPress={() => remove(address)}
                      />
                    </View>
                  </View>
                </Card>
              );
            })}

            <Button
              label="Ajouter une adresse"
              icon="add-circle-outline"
              block
              onPress={() => openForm()}
            />
          </>
        )}

        {formOpen && (
          <View style={{ gap: t.spacing.md }}>
            <Input
              label="Nom de l'adresse"
              placeholder="Cité U, Maison, Bureau…"
              icon="bookmark-outline"
              value={label}
              onChangeText={(v) => {
                setLabel(v);
                setErrors((e) => ({ ...e, label: undefined }));
              }}
              error={errors.label}
            />

            <Input
              label="Secteur ou quartier"
              placeholder="Secteur 15, Gounghin"
              icon="map-outline"
              value={district}
              onChangeText={(v) => {
                setDistrict(v);
                setErrors((e) => ({ ...e, district: undefined }));
              }}
              error={errors.district}
            />

            <Input
              label="Ville"
              placeholder="Ouagadougou"
              icon="business-outline"
              value={city}
              onChangeText={setCity}
            />

            <Input
              label="Point de repère"
              placeholder="En face de la pharmacie du Nord"
              icon="flag-outline"
              hint="C'est souvent ce qui permet vraiment au livreur de vous trouver."
              value={landmark}
              onChangeText={setLandmark}
            />

            <Input
              label="Téléphone"
              placeholder="70 12 34 56"
              icon="call-outline"
              suffix="+226"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                setErrors((e) => ({ ...e, phone: undefined }));
              }}
              error={errors.phone}
            />

            <View style={{ gap: t.spacing.xs }}>
              <Text variant="captionStrong" tone="muted">
                Distance depuis le campus
              </Text>
              <Text variant="caption" tone="subtle">
                Détermine le prix de la livraison. Le livreur le vérifie sur place.
              </Text>

              <View style={{ gap: t.spacing.sm, marginTop: t.spacing.xs }}>
                {DELIVERY_ZONES.map((z) => {
                  const active = zone === z.id;
                  return (
                    <Pressable
                      key={z.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${z.label}, ${z.hint}, ${z.fee} francs`}
                      onPress={() => {
                        haptic('select');
                        setZone(z.id);
                      }}
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
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={active ? t.colors.primary : t.colors.textSubtle}
                      />
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text variant="bodyStrong">{z.label}</Text>
                        <Text variant="caption" tone="subtle">
                          {z.hint}
                        </Text>
                      </View>
                      <Text variant="bodyStrong" tone="primary">
                        {formatXOF(z.fee)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
              <Button label="Enregistrer" block loading={busy} onPress={submit} />
              <Button
                label="Annuler"
                variant="ghost"
                block
                onPress={() => setFormOpen(false)}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
