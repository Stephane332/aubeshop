/**
 * components/BadgeVerification.tsx
 * =================================
 * Composant pour vérification du badge étudiant
 * Upload photo + affichage statut
 */

import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../constants/colors';

interface BadgeVerificationProps {
  onPhotoSelected: (photoUri: string) => void;
  isLoading?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | null;
}

/**
 * BadgeVerification - Interface upload badge étudiant
 * Permet sélection photo + affichage statut approbation
 */
export const BadgeVerification: React.FC<BadgeVerificationProps> = ({
  onPhotoSelected,
  isLoading = false,
  status = null,
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Demander permissions caméra
  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraStatus === 'granted' && libraryStatus === 'granted';
  };

  // Sélectionner photo depuis galerie
  const handlePickPhoto = async () => {
    const permitted = await requestPermissions();
    if (!permitted) {
      Alert.alert(
        '❌ Permission refusée',
        'Accès à la galerie photo requis'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      onPhotoSelected(uri);
    }
  };

  // Prendre photo avec caméra
  const handleTakePhoto = async () => {
    const permitted = await requestPermissions();
    if (!permitted) {
      Alert.alert(
        '❌ Permission refusée',
        'Accès à la caméra requis'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      onPhotoSelected(uri);
    }
  };

  // Couleur badge statut
  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'pending':
        return COLORS.warning;
      default:
        return COLORS.grayMedium;
    }
  };

  // Texte statut
  const getStatusLabel = () => {
    switch (status) {
      case 'approved':
        return '✅ Approuvé';
      case 'rejected':
        return '❌ Rejeté';
      case 'pending':
        return '⏳ En attente';
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        📸 Vérification Badge Étudiant
      </Text>

      {/* Zone affichage photo ou placeholder */}
      <View style={styles.photoZone}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>
              Pas de photo
            </Text>
          </View>
        )}
      </View>

      {/* Boutons upload */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.buttonCamera]}
          onPress={handleTakePhoto}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>📷 Caméra</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonGallery]}
          onPress={handlePickPhoto}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>🖼️ Galerie</Text>
        </TouchableOpacity>
      </View>

      {/* Affichage statut */}
      {status && (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusLabel()}
          </Text>
          {status === 'pending' && (
            <Text style={styles.statusSubtext}>
              Vérification en cours par admin
            </Text>
          )}
          {status === 'rejected' && (
            <Text style={styles.statusSubtext}>
              Merci de retenter avec une meilleure photo
            </Text>
          )}
        </View>
      )}

      {/* Message info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Informations:</Text>
        <Text style={styles.infoText}>
          • Photo claire du badge étudiant{'\n'}
          • Format JPG ou PNG{'\n'}
          • Vérification par admin{'\n'}
          • Approvisionnement généralement &lt; 24h
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  photoZone: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.grayDark,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCamera: {
    backgroundColor: COLORS.info,
  },
  buttonGallery: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.tertiary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    color: COLORS.tertiary,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  statusSubtext: {
    color: COLORS.tertiary,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  infoBox: {
    backgroundColor: COLORS.grayLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.grayDark,
    lineHeight: 18,
  },
});

export default BadgeVerification;
