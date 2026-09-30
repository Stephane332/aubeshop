/**
 * app/vendor/product-form.tsx
 * ===========================
 * Création et modification d'un produit.
 *
 * Écran absent de la v1 : un vendeur n'avait aucun moyen de publier quoi
 * que ce soit depuis l'application, et les photos n'étaient jamais
 * envoyées vers Storage.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  Button,
  EmptyState,
  IconButton,
  Input,
  Screen,
  Text,
  useToast,
} from '@/components/ui';
import { CATEGORIES } from '@/constants/catalog';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { confirm, haptic } from '@/lib/feedback';
import { formatXOF, parseXOF } from '@/lib/money';
import { createProduct, fetchProduct, updateProduct } from '@/lib/productService';
import type { CategoryId } from '@/types';

const MAX_IMAGES = 5;

export default function ProductFormScreen() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { vendor } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [stockText, setStockText] = useState('1');
  const [category, setCategory] = useState<CategoryId>('other');
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  // Préremplissage en modification.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    void fetchProduct(id)
      .then((product) => {
        if (cancelled) return;
        setTitle(product.title);
        setDescription(product.description);
        setPriceText(String(product.price));
        setStockText(String(product.stock));
        setCategory(product.category);
        setImages(product.images);
      })
      .catch(() => toast.error('Produit introuvable.'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  if (!vendor) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="storefront-outline"
          title="Réservé aux vendeurs"
          message="Vous devez être vendeur vérifié pour publier un produit."
          actionLabel="Retour"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const addImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Autorisez l’accès aux photos pour illustrer votre produit.');
      return;
    }

    const remaining = MAX_IMAGES - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
    });

    if (!result.canceled) {
      setImages((current) => [...current, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
      setErrors((e) => ({ ...e, images: undefined }));
      haptic('success');
    }
  };

  const removeImage = (uri: string) => setImages((current) => current.filter((i) => i !== uri));

  const submit = async () => {
    const price = parseXOF(priceText) ?? 0;
    const stock = Number(stockText.replace(/[^\d]/g, '')) || 0;

    const next: Record<string, string | undefined> = {};
    if (title.trim().length < 3) next.title = 'Titre trop court.';
    if (price <= 0) next.price = 'Indiquez un prix en FCFA.';
    if (images.length === 0) next.images = 'Ajoutez au moins une photo.';

    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      haptic('error');
      return;
    }

    setSaving(true);
    try {
      const draft = { title, description, price, category, stock, images };

      if (editing && id) {
        await updateProduct(vendor.uid, id, draft);
        toast.success('Produit mis à jour');
      } else {
        await createProduct(vendor, draft);
        toast.success('Produit publié au catalogue');
      }
      haptic('success');
      router.back();
    } catch (error) {
      haptic('error');
      toast.error(error instanceof Error ? error.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    const dirty = title || description || priceText || images.length > 0;
    if (dirty && !editing) {
      const ok = await confirm({
        title: 'Abandonner ce produit ?',
        message: 'Les informations saisies seront perdues.',
        confirmLabel: 'Abandonner',
        destructive: true,
      });
      if (!ok) return;
    }
    router.back();
  };

  const price = parseXOF(priceText) ?? 0;

  return (
    <Screen
      padded={false}
      edges={['top']}
      footer={
        <Button
          label={editing ? 'Enregistrer les modifications' : 'Publier le produit'}
          icon="checkmark-circle-outline"
          block
          loading={saving}
          disabled={loading}
          onPress={submit}
        />
      }>
      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg, paddingBottom: t.spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <IconButton icon="close" label="Fermer" onPress={discard} />
          <Text variant="title" style={{ flex: 1 }}>
            {editing ? 'Modifier' : 'Nouveau produit'}
          </Text>
        </View>

        {/* Photos */}
        <View style={{ gap: t.spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="captionStrong" tone="muted">
              Photos
            </Text>
            <Text variant="caption" tone="subtle">
              {images.length}/{MAX_IMAGES}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: t.spacing.sm }}>
            {images.map((uri, index) => (
              <View key={uri} style={{ width: 96, height: 96 }}>
                <Image
                  source={{ uri }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: t.radius.md,
                    backgroundColor: t.colors.surfaceAlt,
                  }}
                  contentFit="cover"
                />
                {index === 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: t.radius.sm,
                      backgroundColor: t.colors.primary,
                    }}>
                    <Text variant="overline" style={{ color: t.colors.onPrimary, fontSize: 9 }}>
                      COUVERTURE
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer la photo ${index + 1}`}
                  onPress={() => removeImage(uri)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: t.colors.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}

            {images.length < MAX_IMAGES && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajouter des photos"
                onPress={addImages}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: t.radius.md,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: errors.images ? t.colors.danger : t.colors.borderStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: t.spacing.xxs,
                }}>
                <Ionicons name="add" size={24} color={t.colors.textSubtle} />
                <Text variant="caption" tone="subtle">
                  Ajouter
                </Text>
              </Pressable>
            )}
          </ScrollView>

          {errors.images && (
            <Text variant="caption" tone="danger">
              {errors.images}
            </Text>
          )}
        </View>

        <Input
          label="Titre"
          placeholder="Manuel de mathématiques L1"
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            setErrors((e) => ({ ...e, title: undefined }));
          }}
          error={errors.title}
          maxLength={80}
        />

        <Input
          label="Description"
          placeholder="État, année, ce qui est inclus…"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={600}
        />

        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Input
            containerStyle={{ flex: 2 }}
            label="Prix"
            placeholder="2500"
            suffix="FCFA"
            keyboardType="number-pad"
            value={priceText}
            onChangeText={(v) => {
              setPriceText(v);
              setErrors((e) => ({ ...e, price: undefined }));
            }}
            error={errors.price}
            // Le franc CFA n'a pas de centimes : on rappelle le montant lu.
            hint={price > 0 ? formatXOF(price) : undefined}
          />
          <Input
            containerStyle={{ flex: 1 }}
            label="Stock"
            placeholder="1"
            keyboardType="number-pad"
            value={stockText}
            onChangeText={setStockText}
          />
        </View>

        <View style={{ gap: t.spacing.xs }}>
          <Text variant="captionStrong" tone="muted">
            Catégorie
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={c.label}
                  onPress={() => {
                    haptic('select');
                    setCategory(c.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing.xs,
                    paddingHorizontal: t.spacing.md,
                    height: 38,
                    borderRadius: t.radius.full,
                    backgroundColor: active ? t.colors.primarySubtle : t.colors.surface,
                    borderWidth: 1,
                    borderColor: active ? t.colors.primary : t.colors.border,
                  }}>
                  <Ionicons
                    name={c.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={active ? t.colors.primaryText : t.colors.textSubtle}
                  />
                  <Text
                    variant="captionStrong"
                    style={{ color: active ? t.colors.primaryText : t.colors.textMuted }}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
