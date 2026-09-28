import { BadgeVerification } from '@/components/BadgeVerification';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { validateEmail } from '@/lib/utils';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function VendorSignupScreen() {
  const router = useRouter();
  const { signUpVendor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [badgePhotoUri, setBadgePhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Entrez votre nom');
      return;
    }
    if (!storeName.trim()) {
      Alert.alert('Nom magasin requis', 'Entrez le nom de votre boutique');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Email invalide', 'Vérifiez votre adresse email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe court', 'Minimum 6 caractères');
      return;
    }
    if (!studentId.trim()) {
      Alert.alert('ID étudiant requis', 'Entrez votre numéro d\'étudiant');
      return;
    }
    if (!badgePhotoUri) {
      Alert.alert('Badge requis', 'Téléchargez une photo de votre badge étudiant');
      return;
    }

    setLoading(true);
    try {
      await signUpVendor({
        email,
        password,
        displayName: name,
        storeName,
        studentId,
        badgePhotoUri,
        verificationMethod: 'badge',
      });
      Alert.alert(
        '✅ Inscription en attente',
        'Votre badge a été téléchargé. Approbation admin en cours (généralement < 24h)'
      );
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de créer le compte vendeur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>AubeShop</Text>
        <Text style={styles.subtitle}>Inscription Vendeur</Text>
      </View>

      <BadgeVerification
        onPhotoSelected={setBadgePhotoUri}
        status={badgePhotoUri ? 'pending' : null}
      />

      <View style={styles.form}>
        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          placeholder="Votre nom"
          value={name}
          onChangeText={setName}
          editable={!loading}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Nom de la boutique</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Bouquinerie de Steph"
          value={storeName}
          onChangeText={setStoreName}
          editable={!loading}
        />

        <Text style={styles.label}>Numéro étudiant</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2024001234"
          value={studentId}
          onChangeText={setStudentId}
          editable={!loading}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ À savoir:</Text>
          <Text style={styles.infoText}>
            • Approbation admin requise{'\n'}
            • Commission: 10%{'\n'}
            • Paiement hebdomadaire{'\n'}
            • Support client 24/7
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Inscription...' : '✓ S\'inscrire comme vendeur'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas vendeur ? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={styles.link}>Inscription client</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  content: { paddingHorizontal: 16, paddingVertical: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.grayDark,
  },
  form: { marginBottom: 30 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: COLORS.tertiaryLight,
  },
  infoBox: {
    backgroundColor: COLORS.grayLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 20,
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
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.tertiary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.grayDark,
  },
  link: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
