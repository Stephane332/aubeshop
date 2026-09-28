/**
 * lib/firebase.config.ts
 * ======================
 * Configuration Firebase pour AubeShop
 * Initialisation des services Firebase (Auth, Firestore, Storage)
 * 
 * ⚠️ SÉCURITÉ : Les clés sont stockées ici, mais en production
 * utilisez des variables d'environnement (fichier .env)
 */

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// ============================================
// CONFIGURATION FIREBASE
// ============================================
// À REMPLACER par vos vraies clés depuis Firebase Console
// https://console.firebase.google.com

const firebaseConfig = {
  // ✅ À récupérer dans Firebase Console > Paramètres Projet > Clés Web
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY_HERE',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'aubeshop-xxx.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'aubeshop-xxx',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'aubeshop-xxx.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123def456ghi789',
};

// ============================================
// INITIALISATION FIREBASE
// ============================================

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

try {
  // Initialiser Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialiser les services
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error);
  throw new Error('Firebase initialization failed - Check your credentials');
}

// ============================================
// EXPORTS DES INSTANCES
// ============================================

export { app, auth, firestore, storage };

// ============================================
// GUIDE D'INSTALLATION DES CLÉS
// ============================================
/*
 * 
 * 📋 ÉTAPES POUR OBTENIR VOS CLÉS FIREBASE :
 * 
 * 1️⃣ CRÉER UN PROJET FIREBASE
 *    → Aller sur https://console.firebase.google.com
 *    → Cliquer "Ajouter un projet"
 *    → Nom: "aubeshop" (ou votre nom)
 *    → Région: Europe (pour RGPD)
 *    → Créer projet (attendre ~3 min)
 * 
 * 2️⃣ AJOUTER UNE APP WEB
 *    → Dans le projet, cliquer </> (Ajouter app web)
 *    → Nom: "aubeshop-web"
 *    → Cocher "Aussi configurer l'hébergement"
 *    → Continuer
 * 
 * 3️⃣ COPIER LES CLÉS
 *    → Copier le bloc "const firebaseConfig = { ... }"
 *    → Remplacer les valeurs ci-dessus ⬆️
 * 
 * 4️⃣ ACTIVER FIRESTORE
 *    → Firestore Database > Créer une BD
 *    → Mode développement (pour test)
 *    → Région: Europe (eu-west-1)
 *    → Créer
 * 
 * 5️⃣ ACTIVER AUTHENTICATION
 *    → Authentication > Commencer
 *    → Fournisseurs: Email/Mot de passe
 *    → Sauvegarder
 * 
 * 6️⃣ CONFIGURER CLOUD STORAGE
 *    → Storage > Commencer
 *    → Accepter conditions
 *    → Région: eu-west-1
 *    → Créer
 * 
 * 7️⃣ RÉCUPÉRER LES CLÉS
 *    → Paramètres Projet (⚙️) > Général
 *    → Descendre jusqu'à "firebaseConfig"
 *    → Copier/coller les valeurs ci-dessous:
 * 
 *    Example (À ADAPTER) :
 *    {
 *      "apiKey": "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6",
 *      "authDomain": "aubeshop.firebaseapp.com",
 *      "projectId": "aubeshop-12345",
 *      "storageBucket": "aubeshop-12345.appspot.com",
 *      "messagingSenderId": "123456789012",
 *      "appId": "1:123456789012:web:abc123def456ghi789jkl012"
 *    }
 * 
 * 8️⃣ STOCKER DE MANIÈRE SÉCURISÉE (RECOMMANDÉ)
 * 
 *    Option A : Variables d'environnement (.env)
 *    ─────────────────────────────────────────
 *    Créer fichier .env à la racine du projet :
 * 
 *    EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7...
 *    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=aubeshop.firebaseapp.com
 *    EXPO_PUBLIC_FIREBASE_PROJECT_ID=aubeshop-12345
 *    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=aubeshop-12345.appspot.com
 *    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
 *    EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456...
 * 
 *    ⚠️ NE JAMAIS commiter .env sur GitHub !
 *    Ajouter à .gitignore :
 *    .env
 *    .env.local
 * 
 *    Option B : Fichier .env.example
 *    ────────────────────────────────
 *    Créer .env.example avec valeurs factices :
 * 
 *    EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
 *    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN_HERE
 *    ... (etc)
 * 
 *    Puis copier/adapter pour chaque développeur/environnement
 * 
 * 
 * 9️⃣ CONFIGURER LES RÈGLES DE SÉCURITÉ
 * 
 *    a) Firestore Rules
 *       → Firestore Database > Rules
 *       → Copier le contenu de firestore.rules
 *       → Coller et Publier
 * 
 *    b) Cloud Storage Rules
 *       → Storage > Rules
 *       → Remplacer par :
 * 
 *       rules_version = '2';
 *       service firebase.storage {
 *         match /b/{bucket}/o {
 *           match /products/{allPaths=**} {
 *             allow read: if true;  // Public
 *             allow write: if request.auth != null;  // Authenfié
 *           }
 *           match /badges/{allPaths=**} {
 *             allow read: if request.auth.uid == uid;  // Propriétaire
 *             allow write: if request.auth != null;
 *           }
 *           match /{allPaths=**} {
 *             allow read, write: if request.auth != null;
 *           }
 *         }
 *       }
 * 
 * 
 * 🔟 TESTER LA CONNEXION
 * 
 *    Dans l'app Expo :
 *    1. npm start
 *    2. Appuyer sur 'a' (Android) ou 'i' (iOS)
 *    3. Ouvrir Expo Go
 *    4. Si pas d'erreur Firebase ✅ = Succès !
 * 
 */

// ============================================
// DÉBOGAGE (À COMMENTER EN PRODUCTION)
// ============================================

// Enable Debug Logging (optionnel)
// if (process.env.NODE_ENV === 'development') {
//   enableLogging(true);
// }

console.log('🔐 Firebase Config Loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasBucket: !!firebaseConfig.storageBucket,
});
