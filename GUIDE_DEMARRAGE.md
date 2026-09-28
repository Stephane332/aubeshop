# 🚀 AubeShop — Guide de Démarrage Complet

> Application e-commerce mobile Expo pour l'Université Aube Nouvelle

---

## 📋 Table des matières

1. [Installation & Configuration](#installation--configuration)
2. [Démarrer l'app](#démarrer-lapp)
3. [Structure du projet](#structure-du-projet)
4. [Configuration Firebase](#configuration-firebase)
5. [Tests & Débogage](#tests--débogage)
6. [Déploiement](#déploiement)
7. [Troubleshooting](#troubleshooting)

---

## ⚡ Installation & Configuration

### Prérequis

- ✅ Node.js 16+ (`node --version`)
- ✅ npm 8+ (`npm --version`)
- ✅ Expo CLI (`npm install -g expo-cli`)
- ✅ Android Studio (pour Android) OU Xcode (pour iOS)
- ✅ Compte Firebase (gratuit: https://console.firebase.google.com)

### Étape 1 : Créer le projet Expo

```bash
# Créer nouveau projet Expo avec TypeScript
npx create-expo-app aubeshop --template expo-template-blank-typescript

# Entrer dans le dossier
cd aubeshop
```

### Étape 2 : Installer toutes les dépendances

```bash
# Installer en une commande (recommandé)
npm install \
  firebase \
  @react-native-async-storage/async-storage \
  expo-image-picker \
  expo-camera \
  expo-file-system \
  expo-notifications \
  lottie-react-native \
  react-native-reanimated \
  react-native-gesture-handler \
  expo-router \
  @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/stack \
  react-native-screens \
  react-native-safe-area-context \
  react-native-tab-view \
  axios \
  date-fns \
  zustand
```

**OU** installer par groupes (si problèmes mémoire) :

```bash
# Groupe 1
npm install firebase @react-native-async-storage/async-storage

# Groupe 2
npm install expo-image-picker expo-camera expo-file-system expo-notifications

# Groupe 3
npm install lottie-react-native react-native-reanimated react-native-gesture-handler

# Groupe 4
npm install expo-router @react-navigation/native @react-navigation/bottom-tabs \
  @react-navigation/stack react-native-screens react-native-safe-area-context react-native-tab-view

# Groupe 5
npm install axios date-fns zustand
```

### Étape 3 : Installer Dev Dependencies

```bash
npm install --save-dev \
  @types/react \
  @types/react-native \
  typescript \
  @testing-library/react-native \
  jest \
  jest-expo \
  @babel/core \
  babel-jest \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser
```

### Étape 4 : Vérifier l'installation

```bash
# Vérifier TypeScript
npm run type-check

# Vérifier linting
npm run lint
```

---

## 🔥 Démarrer l'app

### Sur Expo Go (Android/iOS)

```bash
# Démarrer le serveur Expo
npm start

# Options :
npm start          # Démarrage normal
npm start --clear  # Vider cache
npm start --tunnel # Via tunnel (réseau extérieur)

# Dans le terminal Expo :
# Appuyer sur 'a' (Android) ou 'i' (iOS) pour ouvrir
# OU scanner le QR code avec l'app Expo Go
```

### Sur émulateur Android

```bash
npm run start:android

# Ou manuellement:
npm start
# Puis 'a' dans le terminal
```

### Sur simulateur iOS (macOS uniquement)

```bash
npm run start:ios

# Ou manuellement:
npm start
# Puis 'i' dans le terminal
```

### Sur web (débogage rapide)

```bash
npm run start:web
```

---

## 📁 Structure du Projet

```
aubeshop/
├── app/                          # Expo Router (navigation file-based)
│   ├── _layout.tsx               # Root layout
│   ├── (auth)/                   # Auth screens
│   │   ├── login.tsx
│   │   ├── signup-client.tsx
│   │   └── signup-vendor.tsx
│   ├── (app)/                    # App screens (client)
│   │   ├── index.tsx             # Home/Catalogue
│   │   ├── product/[id].tsx      # Détail produit
│   │   ├── cart.tsx              # Panier
│   │   ├── checkout.tsx          # Checkout
│   │   └── orders.tsx            # Historique
│   ├── (vendor)/                 # Vendor screens
│   │   ├── add-product.tsx
│   │   ├── products.tsx
│   │   └── orders-vendor.tsx
│   ├── (admin)/                  # Admin screens
│   │   ├── approve-vendors.tsx
│   │   └── dashboard.tsx
│   └── not-found.tsx
│
├── components/                   # Composants réutilisables
│   ├── ProductCard.tsx
│   ├── OrderCard.tsx
│   ├── LoadingSpinner.tsx
│   └── ...
│
├── lib/                          # Services & utilitaires
│   ├── firebase.config.ts        # Config Firebase
│   ├── authService.ts            # Auth logic
│   ├── productService.ts         # Product logic
│   ├── orderService.ts           # Order logic
│   └── utils.ts                  # Helpers
│
├── context/                      # Contextes globaux
│   ├── AuthContext.tsx           # Auth state
│   ├── CartContext.tsx           # Cart state
│   └── NotificationContext.tsx   # Notifications
│
├── types/                        # Types TypeScript
│   └── index.ts
│
├── constants/                    # Constantes
│   ├── colors.ts
│   └── strings.ts
│
├── __tests__/                    # Tests Jest
│   ├── auth.test.ts
│   └── product.test.ts
│
├── app.json                      # Config Expo
├── package.json                  # Dépendances
├── tsconfig.json                 # Config TypeScript
├── .babelrc                      # Config Babel
├── .env                          # Variables env (🔒 ne pas commiter)
├── .env.example                  # Template .env
├── .gitignore                    # Git ignore
├── firestore.rules               # Règles Firestore
└── CAHIER_DES_CHARGES.md         # Spécification
```

---

## 🔐 Configuration Firebase

### Étape 1 : Créer projet Firebase

1. Aller sur https://console.firebase.google.com
2. Cliquer "Ajouter un projet"
3. Nom: "aubeshop" (ou votre nom)
4. Région: **Europe** (pour RGPD)
5. Créer projet (attendre ~3 min)

### Étape 2 : Récupérer clés d'API

1. Cliquer </> (Ajouter app web)
2. Nom: "aubeshop-web"
3. Cocher "Aussi configurer l'hébergement"
4. Copier le bloc `firebaseConfig`

### Étape 3 : Configurer variables d'environnement

Créer fichier `.env` à la racine (remplacer par vos valeurs) :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=aubeshop.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=aubeshop-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=aubeshop-12345.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789
```

⚠️ **NE JAMAIS commiter `.env` !** (Ajouter à `.gitignore`)

### Étape 4 : Activer services Firebase

Dans Firebase Console:

**1. Firestore Database**
- Firestore Database > Créer BD
- Mode: **Développement**
- Région: **eu-west-1**
- Créer

**2. Authentication**
- Authentication > Commencer
- Fournisseur: **Email/Mot de passe**
- Sauvegarder

**3. Cloud Storage**
- Storage > Commencer
- Accepter conditions
- Région: **eu-west-1**
- Créer

### Étape 5 : Déployer règles Firestore

1. Firestore Database > Rules
2. Copier le contenu de `firestore.rules`
3. Coller et **Publier**

### Étape 6 : Initialiser domaines universitaires

1. Firestore > Données > Créer collection `verificationDomains`
2. Ajouter documents :

```json
{
  "domain": "aube.edu.fr",
  "isActive": true,
  "autoVerify": true,
  "createdAt": 1700212800000
}
```

---

## 🧪 Tests & Débogage

### Exécuter tests

```bash
# Tous les tests
npm test

# En mode watch (re-run au changement)
npm run test:watch

# Avec couverture
npm run test:coverage
```

### Logs Firestore

```bash
# Activer logs Firebase
npm start -- --verbose
```

### Emulator Firestore (Optionnel)

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Démarrer emulator
firebase emulators:start

# Configurer dans firebase.config.ts:
import { connectFirestoreEmulator } from 'firebase/firestore';
connectFirestoreEmulator(firestore, 'localhost', 8080);
```

---

## 📦 Déploiement

### Build APK (Android)

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Builder APK
eas build --platform android --local

# Ou APK directement (dev)
npx expo build:android
```

### Build IPA (iOS)

```bash
# Se connecter
eas login

# Builder pour TestFlight
eas build --platform ios

# Après: télécharger IPA et tester en TestFlight
```

### Déployer sur Play Store

```bash
# Après build APK/AAB
eas submit --platform android --latest
```

---

## 🆘 Troubleshooting

### ❌ "Cannot find module 'firebase'"

```bash
npm install firebase --save
npm start
```

### ❌ "react-native-reanimated requires Babel plugin"

Vérifier `.babelrc` contient :
```json
{
  "plugins": ["react-native-reanimated/plugin"]
}
```

### ❌ "Port 8081 already in use"

```bash
# Option A: Tuer le processus
lsof -i :8081
kill -9 <PID>

# Option B: Utiliser tunnel
npm start --tunnel
```

### ❌ Erreur Firebase "permission-denied"

- Vérifier règles Firestore sont déployées
- Vérifier Auth activée
- Vérifier utilisateur est authentifié

### ❌ Images non s'affichent

- Vérifier URL Firebase Storage valide
- Vérifier règles Storage permettent read
- Vérifier taille image < 5MB

### ❌ "Module not found: @react-navigation/..."

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs \
  @react-navigation/stack react-native-screens react-native-safe-area-context
```

---

## 📚 Ressources

- **Expo Docs**: https://docs.expo.dev
- **Firebase Docs**: https://firebase.google.com/docs
- **React Native Docs**: https://reactnative.dev
- **Expo Router**: https://expo.github.io/router

---

## ✅ Checklist démarrage

- [ ] Node.js + npm installés
- [ ] Expo CLI installé
- [ ] Projet Expo créé
- [ ] Dépendances NPM installées
- [ ] Projet Firebase créé
- [ ] Clés Firebase dans `.env`
- [ ] Services Firebase activés (Auth, Firestore, Storage)
- [ ] Règles Firestore déployées
- [ ] Domaines universitaires configurés
- [ ] App démarre sans erreur (`npm start`)
- [ ] Connexion Firebase OK (pas d'erreur dans logs)

---

**Status**: ✅ Prêt pour développement !

Questions ? Consultez `CAHIER_DES_CHARGES.md` et `CONCEPTION.md`
