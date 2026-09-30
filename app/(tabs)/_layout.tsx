/**
 * app/(tabs)/_layout.tsx
 * ======================
 * Barre d'onglets pilotée par le rôle.
 *
 * Un seul groupe d'onglets pour toute l'app : les écrans qui ne concernent
 * pas le rôle courant sont retirés avec `href: null`. C'est plus sûr que de
 * multiplier les groupes de navigation — un onglet masqué n'est pas
 * seulement invisible, il devient inatteignable.
 *
 * La v1 affichait « Home » et « Explore » (l'onglet de démonstration Expo)
 * à côté de « Panier », et son écran `orders.tsx` n'était référencé nulle
 * part, donc inaccessible.
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Text } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/hooks/use-theme';

/** Pastille de comptage sur l'onglet Panier. */
function CartIcon({ color, size }: { color: string; size: number }) {
  const { itemCount } = useCart();
  const t = useTheme();

  return (
    <View>
      <Ionicons name="bag-outline" size={size} color={color} />
      {itemCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -9,
            minWidth: 17,
            height: 17,
            paddingHorizontal: 4,
            borderRadius: t.radius.full,
            backgroundColor: t.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            variant="overline"
            style={{ color: t.colors.onPrimary, fontSize: 10, lineHeight: 13 }}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const t = useTheme();
  const { user, isVendor, isCourier, isAdmin } = useAuth();

  // Un visiteur non connecté ne voit que le catalogue et le profil, où on
  // l'invite à se connecter.
  const isClient = !!user && !isVendor && !isCourier && !isAdmin;
  const isGuest = !user;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textSubtle,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: t.colors.background },
      }}>
      {/* Accueil — le contenu dépend du rôle, pas l'onglet. */}
      <Tabs.Screen
        name="index"
        options={{
          title: isVendor || isAdmin ? 'Tableau de bord' : isCourier ? 'Courses' : 'Boutique',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={
                isVendor || isAdmin
                  ? 'stats-chart-outline'
                  : isCourier
                    ? 'bicycle-outline'
                    : 'storefront-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Client — panier */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          href: isClient || isGuest ? '/cart' : null,
          tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} />,
        }}
      />

      {/* Vendeur — catalogue personnel */}
      <Tabs.Screen
        name="products"
        options={{
          title: 'Mes produits',
          href: isVendor ? '/products' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Livreur — ses courses acceptées */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Mes courses',
          href: isCourier ? '/deliveries' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Admin — files de validation */}
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Candidatures',
          href: isAdmin ? '/applications' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Commandes — vue client ou vue vendeur selon le rôle */}
      <Tabs.Screen
        name="orders"
        options={{
          title: isVendor ? 'Ventes' : 'Commandes',
          href: isClient || isVendor ? '/orders' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
