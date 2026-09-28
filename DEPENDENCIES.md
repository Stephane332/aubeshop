# AubeShop — Dépendances & Installation

## 1. Liste Complète des Dépendances NPM

### Core Dependencies

```json
{
  "dependencies": {
    "firebase": "^10.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo-image-picker": "^14.0.0",
    "expo-camera": "^13.0.0",
    "expo-file-system": "^15.0.0",
    "expo-notifications": "^0.20.0",
    "lottie-react-native": "^6.0.0",
    "react-native-reanimated": "^3.3.0",
    "react-native-gesture-handler": "^2.14.0",
    "expo-router": "^3.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "react-native-screens": "^3.26.0",
    "react-native-safe-area-context": "^4.7.0",
    "react-native-tab-view": "^3.5.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "zustand": "^4.4.0",
    "expo": "^50.0.0",
    "react": "^18.2.0",
    "react-native": "0.73.0"
  }
}
```

### Dev Dependencies

```json
{
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.3.0",
    "@testing-library/react-native": "^12.2.0",
    "jest": "^29.7.0",
    "jest-expo": "^50.0.0",
    "@babel/core": "^7.23.0",
    "babel-jest": "^29.7.0",
    "eslint": "^8.54.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0"
  }
}
```

---

## 2. Justification de Chaque Dépendance

| Package | Version | Utilité | Alternative |
|---------|---------|---------|-------------|
| **firebase** | ^10.0.0 | SDK Firebase officiel (Auth, Firestore, Storage) | ❌ Aucune |
| **expo-image-picker** | ^14.0.0 | Sélectionner/prendre photos (galerie, caméra) | react-native-image-picker |
| **expo-camera** | ^13.0.0 | Accès caméra, capture badge étudiant | ❌ Spécifique Expo |
| **expo-file-system** | ^15.0.0 | Gérer fichiers locaux avant upload | ❌ Spécifique Expo |
| **expo-notifications** | ^0.20.0 | Notifications push & local | react-native-push-notification |
| **lottie-react-native** | ^6.0.0 | Animations Lottie JSON (UI moderne) | react-native-svg |
| **react-native-reanimated** | ^3.3.0 | Animations fluides, 60 FPS | react-native-animated |
| **react-native-gesture-handler** | ^2.14.0 | Gestes tactiles (swipe, pan) | ❌ Natif ❌ complexe |
| **expo-router** | ^3.0.0 | Navigation file-based (comme Next.js) | @react-navigation/native (manuel) |
| **@react-navigation/** | ^6.x | Navigation tabs, stack | ❌ Standard React Native |
| **axios** | ^1.6.0 | HTTP client pour API futures | fetch (natif) |
| **date-fns** | ^2.30.0 | Manipulation dates (timestamps, formatage) | moment.js (lourd) |
| **zustand** | ^4.4.0 | État global léger (panier, user) | Redux, Context API (plus complexe) |

---

## 3. Installation Détaillée (Pas-à-Pas)

### Étape 1 : Créer le projet Expo

```bash
# Dans votre dossier de travail
npx create-expo-app aubeshop --template expo-template-blank-typescript

# Entrer dans le dossier
cd aubeshop
```

**Résultat attendu** :
```
aubeshop/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── app.json
├── package.json
├── tsconfig.json
└── .gitignore
```

---

### Étape 2 : Installer Toutes les Dépendances

**Option A : Installer en une seule commande** (recommandé)

```bash
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

**Option B : Installer par groupes** (si problèmes de mémoire)

```bash
# Groupe 1 : Backend & Auth
npm install firebase @react-native-async-storage/async-storage

# Groupe 2 : Images & Notifications
npm install expo-image-picker expo-camera expo-file-system expo-notifications

# Groupe 3 : Animations
npm install lottie-react-native react-native-reanimated react-native-gesture-handler

# Groupe 4 : Navigation
npm install expo-router @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack react-native-screens react-native-safe-area-context react-native-tab-view

# Groupe 5 : Utilitaires
npm install axios date-fns zustand
```

**Temps d'installation attendu** : 3-5 minutes (dépend connexion internet)

---

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

---

### Étape 4 : Vérifier l'Installation

```bash
# Lister toutes les dépendances
npm list

# Vérifier l'intégrité
npm audit
```

**Output attendu** :
```
aubeshop@1.0.0 /path/to/aubeshop
├── @react-navigation/bottom-tabs@6.5.0
├── @react-navigation/native@6.1.0
├── @react-navigation/stack@6.3.0
├── @react-native-async-storage/async-storage@1.21.0
├── @types/node@20.8.0
├── axios@1.6.0
├── date-fns@2.30.0
├── expo@50.0.0
├── expo-camera@13.0.0
├── expo-file-system@15.0.0
├── expo-image-picker@14.0.0
├── expo-notifications@0.20.0
├── expo-router@3.0.0
├── firebase@10.0.0
├── lottie-react-native@6.0.0
├── react@18.2.0
├── react-native@0.73.0
├── react-native-gesture-handler@2.14.0
├── react-native-reanimated@3.3.0
├── react-native-safe-area-context@4.7.0
├── react-native-screens@3.26.0
├── react-native-tab-view@3.5.0
├── typescript@5.3.0
├── zustand@4.4.0
└── ... (autres dev deps)
```

---

## 4. Fichier package.json Complet (Template)

Remplacez votre `package.json` par ceci :

```json
{
  "name": "aubeshop",
  "version": "1.0.0",
  "description": "Application mobile e-commerce pour l'Université Aube Nouvelle",
  "main": "expo-app.json",
  "scripts": {
    "start": "expo start",
    "start:expo": "expo start --clear",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "eject": "expo eject",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "expo": "^50.0.0",
    "expo-camera": "^13.0.0",
    "expo-file-system": "^15.0.0",
    "expo-image-picker": "^14.0.0",
    "expo-notifications": "^0.20.0",
    "expo-router": "^3.0.0",
    "firebase": "^10.0.0",
    "lottie-react-native": "^6.0.0",
    "react": "^18.2.0",
    "react-native": "0.73.0",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.3.0",
    "react-native-safe-area-context": "^4.7.0",
    "react-native-screens": "^3.26.0",
    "react-native-tab-view": "^3.5.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@testing-library/react-native": "^12.2.0",
    "@types/jest": "^29.5.0",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "babel-jest": "^29.7.0",
    "eslint": "^8.54.0",
    "jest": "^29.7.0",
    "jest-expo": "^50.0.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
```

---

## 5. Configuration TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "jsx": "react-native",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2020",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@lib/*": ["./lib/*"],
      "@context/*": ["./context/*"],
      "@constants/*": ["./constants/*"],
      "@hooks/*": ["./hooks/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "build", ".expo"]
}
```

---

## 6. Configuration Babel (.babelrc)

```json
{
  "presets": [
    "babel-preset-expo",
    ["@babel/preset-typescript", { "allowNamespaces": true }]
  ],
  "plugins": [
    "react-native-reanimated/plugin"
  ]
}
```

---

## 7. Configuration Jest (jest.config.js)

```javascript
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@context/(.*)$': '<rootDir>/context/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

---

## 8. Jest Setup File (jest.setup.js)

```javascript
// Mocking Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mocking AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
}));
```

---

## 9. Scripts NPM Recommandés

Ajoutez à votre `package.json` (scripts) :

```json
{
  "scripts": {
    "start": "expo start",
    "start:expo": "expo start --clear",
    "start:web": "expo start --web",
    "start:android": "expo start --android",
    "start:ios": "expo start --ios",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:web": "expo export --platform web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "prebuild": "expo prebuild",
    "prebuild:clean": "expo prebuild --clean"
  }
}
```

---

## 10. Vérification Finale

Après installation, testez que tout fonctionne :

```bash
# Vérifier TypeScript
npm run type-check

# Vérifier linting
npm run lint

# Démarrer l'app Expo
npm start
```

**Résultat attendu** :
```
Expo CLI ready.

To open your app:
  - Android: Press 'a' to open Android Emulator
  - iOS: Press 'i' to open iOS Simulator
  - Web: Press 'w' to open in browser
  - Scan QR code with Expo Go app

Press q to quit.
```

---

## 11. Troubleshooting Commun

### ❌ Erreur : "Cannot find module 'firebase'"

**Solution** :
```bash
npm install firebase --save
npm audit fix --force
npm start
```

### ❌ Erreur : "react-native-reanimated requires Babel plugin"

**Solution** : Vérifier que `.babelrc` contient :
```json
{
  "plugins": ["react-native-reanimated/plugin"]
}
```

### ❌ Erreur : "ENOSPC: no space left on device"

**Solution** :
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erreur : "port 8081 already in use"

**Solution** :
```bash
# Tuer le processus existant
lsof -i :8081
kill -9 <PID>

# Ou démarrer sur un autre port
expo start --tunnel
```

---

## 12. Checklist Installation

- [ ] Projet Expo créé (`npx create-expo-app`)
- [ ] Toutes les dépendances installées (`npm install`)
- [ ] package.json mis à jour avec tous les scripts
- [ ] tsconfig.json configuré
- [ ] .babelrc configuré (babel plugin reanimated)
- [ ] jest.config.js créé
- [ ] jest.setup.js créé
- [ ] TypeScript compilation OK (`npm run type-check`)
- [ ] Linting OK (`npm run lint`)
- [ ] App démarre (`npm start`)

---

**Document Version** : 1.0  
**Date** : 17 novembre 2024  
**Étape** : B - Analyse (Dépendances) ✅
