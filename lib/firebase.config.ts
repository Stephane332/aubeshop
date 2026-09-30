/**
 * lib/firebase.config.ts
 * ======================
 * Initialisation Firebase — Auth, Firestore, Storage.
 *
 * Deux corrections par rapport à la v1 :
 *
 * 1. **Plus aucun journal de configuration.** La v1 affichait `projectId` et
 *    `authDomain` à chaque démarrage, y compris en production.
 * 2. **La session survit au redémarrage sur mobile.** `getAuth()` conserve
 *    l'état en mémoire seulement sous React Native : l'utilisateur était
 *    déconnecté à chaque relance de l'app. On branche AsyncStorage.
 *
 * Les valeurs viennent toutes de `.env` (préfixe `EXPO_PUBLIC_`). Ces clés
 * sont publiques par nature — c'est aux règles Firestore, pas à leur secret,
 * de protéger les données.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  // @ts-expect-error — non typé dans les définitions web du SDK, mais bien
  // exporté par le paquet et indispensable à la persistance React Native.
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * `true` si l'app dispose d'une configuration exploitable.
 *
 * Permet d'afficher un écran d'aide explicite au lieu de laisser le SDK
 * échouer avec « auth/invalid-api-key » au premier appel.
 */
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE';

// `getApps()` évite la double initialisation lors du rafraîchissement à chaud.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Sur le web, `getAuth` utilise déjà le stockage local du navigateur.
 * Sur mobile, il faut déclarer explicitement la persistance, sinon la session
 * ne vit que le temps du processus.
 */
const auth: Auth = (() => {
  if (Platform.OS === 'web') return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // `initializeAuth` lève si l'instance existe déjà (rafraîchissement à chaud).
    return getAuth(app);
  }
})();

const firestore: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, firestore, storage };
