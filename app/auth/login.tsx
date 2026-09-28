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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Email invalide', 'Vérifiez votre adresse email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe court', 'Minimum 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      Alert.alert('✅ Connexion réussie');
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de se connecter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>AubeShop</Text>
        <Text style={styles.subtitle}>Connexion</Text>
      </View>

      <View style={styles.form}>
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

        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Connexion...' : '✓ Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas encore inscrit ? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={styles.link}>Créer un compte</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vendorFooter}>
        <Text style={styles.footerText}>Vendeur ? </Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/vendor-signup')}
        >
          <Text style={styles.link}>Inscription vendeur</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  content: { paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
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
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.tertiary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  vendorFooter: {
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
