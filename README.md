# AubeShop

> Application mobile e-commerce pour l'Université Aube Nouvelle — *« Achetez et vendez facilement sur le campus. »*

AubeShop permet aux **étudiants** de l'université de devenir **vendeurs vérifiés**, tandis que **tout le monde** peut s'inscrire comme **client** pour acheter sur le campus.

> ⚠️ **Projet en cours de développement.** Le socle fonctionnel est en place mais la compilation TypeScript n'est pas encore propre (voir [État du projet](#état-du-projet)).

---

## Stack technique

| Élément | Choix |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 (React Native 0.81) |
| Langage | TypeScript |
| Navigation | expo-router (routage par fichiers) |
| Backend | Firebase — Auth, Firestore, Storage |
| Animations | react-native-reanimated, lottie-react-native |

## Démarrage rapide

```bash
npm install
```

Copier le modèle de configuration et y renseigner vos clés Firebase :

```bash
cp .env.example .env
```

Les valeurs se récupèrent dans **Firebase Console → Paramètres du projet → Vos applications (Web)**. Le fichier `.env` est exclu du suivi Git et ne doit jamais être commité.

```bash
npx expo start
```

L'application s'ouvre ensuite dans [Expo Go](https://expo.dev/go), un émulateur Android, un simulateur iOS ou un [development build](https://docs.expo.dev/develop/development-builds/introduction/).

## Structure du projet

```
app/              Écrans (routage par fichiers expo-router)
  (tabs)/         Navigation principale : accueil, panier, commandes, profil
  auth/           Connexion, inscription client, inscription vendeur
  product/[id]    Fiche produit
  order/[id]      Détail d'une commande
  checkout.tsx    Tunnel de commande
  admin/          Validation des vendeurs, statistiques
components/       Composants partagés (ProductCard, CartItem, OrderCard…)
context/          État global : AuthContext, CartContext
lib/              Services Firebase : auth, produits, commandes
types/            Types métier centralisés
constants/        Palette de couleurs et thème
firestore.rules   Règles de sécurité Firestore
```

## Rôles utilisateurs

- **Client** — parcourt le catalogue, gère son panier, commande et suit ses livraisons.
- **Vendeur-étudiant** — après un workflow de vérification du statut étudiant : publie et gère ses produits, traite les commandes entrantes, consulte ses revenus et la commission prélevée.
- **Admin** — approuve ou rejette les vendeurs, consulte les statistiques, modère les comptes.

## Documentation

| Document | Contenu |
|---|---|
| [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) | Périmètre fonctionnel, rôles, écrans et parcours |
| [CONCEPTION.md](CONCEPTION.md) | Architecture technique et choix de conception |
| [ANALYSE_FIRESTORE.md](ANALYSE_FIRESTORE.md) | Modèle de données et collections Firestore |
| [GUIDE_DEMARRAGE.md](GUIDE_DEMARRAGE.md) | Installation détaillée et configuration Firebase |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Rôle de chaque dépendance |

## État du projet

Le socle est implémenté : authentification, catalogue, panier, tunnel de commande, espace profil et écran d'administration.

`npx tsc --noEmit` remonte actuellement **18 erreurs** à corriger, principalement :

- des imports qui ne correspondent pas aux exports de `lib/utils` (`validateEmail` → `isValidEmail`, `formatDate` exporté par défaut) ;
- des divergences entre les composants et les types de `types/index.ts` (`CartItem.product`, `Order.createdAt`, `Order.total`) ;
- des routes référencées mais pas encore créées (`/vendor/dashboard`, `/vendor/products`).

## Scripts

```bash
npm start       # démarrer le serveur de développement Expo
npm run android # ouvrir sur Android
npm run ios     # ouvrir sur iOS
npm run web     # ouvrir dans le navigateur
npm run lint    # linter le projet
```
