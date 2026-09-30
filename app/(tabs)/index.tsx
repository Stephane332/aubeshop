/**
 * app/(tabs)/index.tsx
 * ====================
 * Accueil — aiguillage vers le tableau de bord du rôle.
 *
 * Chaque rôle a des fonctions distinctes, donc un écran d'accueil distinct.
 * L'onglet reste le même pour que la navigation ne change pas de forme d'un
 * profil à l'autre.
 */

import { AdminHome } from '@/components/home/AdminHome';
import { CatalogueHome } from '@/components/home/CatalogueHome';
import { CourierHome } from '@/components/home/CourierHome';
import { VendorHome } from '@/components/home/VendorHome';
import { EmptyState, Screen, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { View } from 'react-native';

export default function HomeScreen() {
  const { user, vendor, courier, isVendor, isCourier, isAdmin, initializing } = useAuth();
  const t = useTheme();

  if (initializing) return <HomeSkeleton />;

  if (isAdmin) return <AdminHome />;

  if (isVendor) {
    // Le rôle est accordé mais la vitrine n'est pas encore chargée : on
    // patiente plutôt que d'afficher un tableau de bord vide.
    return vendor ? <VendorHome vendor={vendor} /> : <HomeSkeleton />;
  }

  if (isCourier) {
    return courier ? (
      <CourierHome courier={courier} />
    ) : (
      <Screen>
        <EmptyState
          icon="bicycle-outline"
          title="Profil livreur introuvable"
          message="Votre compte est marqué comme livreur mais son profil est manquant. Contactez l'administration."
        />
      </Screen>
    );
  }

  // Client et visiteur non connecté : le catalogue.
  void user;
  void t;
  return <CatalogueHome />;
}

function HomeSkeleton() {
  const t = useTheme();
  return (
    <Screen>
      <View style={{ gap: t.spacing.lg, paddingTop: t.spacing.xl }}>
        <Skeleton width="55%" height={26} />
        <Skeleton width="80%" height={16} />
        <Skeleton height={48} radius={t.radius.md} />
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          <Skeleton height={110} style={{ flex: 1 }} radius={t.radius.lg} />
          <Skeleton height={110} style={{ flex: 1 }} radius={t.radius.lg} />
        </View>
      </View>
    </Screen>
  );
}
