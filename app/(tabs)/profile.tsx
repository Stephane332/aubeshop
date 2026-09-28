import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Déconnexion',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnected}>
          <Text style={styles.notConnectedText}>Vous n&apos;êtes pas connecté</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>{currentUser.displayName || 'Utilisateur'}</Text>
        <Text style={styles.email}>{currentUser.email}</Text>
        <Text style={styles.role}>Rôle: {currentUser.role}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Informations</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{currentUser.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Rôle:</Text>
          <Text style={styles.value}>
            {currentUser.role === 'vendor'
              ? '🏪 Vendeur'
              : currentUser.role === 'admin'
              ? '👨‍💼 Admin'
              : '🛒 Client'}
          </Text>
        </View>
        {currentUser.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Téléphone:</Text>
            <Text style={styles.value}>{currentUser.phone}</Text>
          </View>
        )}
      </View>

      {currentUser.role === 'vendor' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏪 Tableau de bord vendeur</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/vendor/dashboard')}
          >
            <Text style={styles.menuButtonText}>Voir mes ventes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/vendor/products')}
          >
            <Text style={styles.menuButtonText}>Gérer mes produits</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentUser.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💼 Panneau admin</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/admin')}
          >
            <Text style={styles.menuButtonText}>Approuver vendeurs</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.tertiary },
  content: { paddingBottom: 30 },
  notConnected: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notConnectedText: { fontSize: 16, color: COLORS.secondary, marginBottom: 20, textAlign: 'center' },
  loginButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  loginButtonText: { color: COLORS.tertiary, fontWeight: '700' },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  avatar: { fontSize: 48, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.secondary, marginBottom: 6 },
  email: { fontSize: 14, color: COLORS.grayDark, marginBottom: 4 },
  role: { fontSize: 12, color: COLORS.grayDark, fontStyle: 'italic' },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 12, color: COLORS.grayDark },
  value: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },
  menuButton: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  menuButtonText: { color: COLORS.tertiary, fontWeight: '600' },
  logoutButton: { backgroundColor: COLORS.error, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  logoutButtonText: { color: COLORS.tertiary, fontWeight: '700' },
});


