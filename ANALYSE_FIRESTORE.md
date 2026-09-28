# AubeShop — ANALYSE : Schéma Firestore & Architecture Backend

## 1. Vue d'ensemble du schéma Firestore

AubeShop utilise Firestore pour stocker tous les données (utilisateurs, produits, commandes, approbations). Voici la structure complète :

```
Firebase Firestore (Base de données NoSQL)
├── users/ (collection)
├── vendors/ (collection)
├── products/ (collection)
├── orders/ (collection)
├── cart/ (collection)
├── notifications/ (collection)
├── verificationDomains/ (collection)
├── adminApprovals/ (collection)
└── commissions/ (collection)
```

---

## 2. Détail des Collections

### 2.1 Collection : `users`

Stocke les données de tous les clients et vendeurs.

**Chemin** : `users/{userId}`  
**Document ID** : `uid` généré par Firebase Auth

**Schéma du document** :

```json
{
  "uid": "user_001_abcd1234",
  "email": "marc@example.com",
  "phone": "+33612345678",
  "displayName": "Marc Dupont",
  "avatar": "https://firebasestorage.../users/uid/avatar.jpg",
  "role": "client",  // "client" | "vendor" | "admin"
  "createdAt": 1700212800000,
  "updatedAt": 1700212800000,
  "isActive": true,
  "address": {
    "street": "123 Rue Main",
    "city": "Paris",
    "postal": "75001",
    "country": "FR"
  },
  "metadata": {
    "lastLogin": 1700300000000,
    "totalOrders": 5,
    "totalSpent": 125.50,
    "deviceTokens": ["token_1", "token_2"]  // Pour notifications push
  }
}
```

**Index requis** :

- Email (unique via Auth)
- Role (pour filtrer par type utilisateur)
- createdAt (pour tri temporel)

---

### 2.2 Collection : `vendors`

Données spécifiques aux vendeurs vérifiés (étudiants).

**Chemin** : `vendors/{vendorId}`  
**Document ID** : Même que l'`uid` du user

**Schéma du document** :

```json
{
  "vendorId": "user_001_abcd1234",
  "userId": "user_001_abcd1234",  // Référence à users/{userId}
  "universityId": "ETU-2024-12345",
  "universityEmail": "marc.dupont@aube.edu.fr",
  "verificationMethod": "email",  // "email" | "badge"
  "verificationStatus": "approved",  // "pending" | "approved" | "rejected"
  "verificationDate": 1700212800000,
  "approvedBy": "admin_xyz",  // UID de l'admin qui a approuvé
  "bio": "Vendeur de livres académiques",
  "storeName": "Marc's Books",
  "rating": 4.8,
  "totalReviews": 47,
  "totalSales": 1250.50,
  "commissionBalance": 125.05,  // Commission accumulée à payer au vendeur
  "bankAccount": {
    "accountHolder": "Marc Dupont",
    "iban": "FR1420041010050500013M02606",  // Encrypté en production
    "verifiedAt": 1700212800000
  },
  "location": {
    "campus": "Aube - Bâtiment C",
    "pickupHours": "10:00-18:00",
    "pickupDays": ["MON", "TUE", "WED", "THU", "FRI"]
  },
  "badgeUpload": {
    "storageUrl": "gs://aubeshop.../badges/vendorId/badge.jpg",
    "uploadedAt": 1700212800000,
    "status": "verified"  // "pending" | "verified" | "rejected"
  },
  "createdAt": 1700212800000,
  "updatedAt": 1700212800000
}
```

**Index requis** :

- verificationStatus (pour filtrer vendeurs en attente)
- totalSales (pour tri popularité)
- rating (pour tri notes)

---

### 2.3 Collection : `products`

Tous les produits disponibles à la vente.

**Chemin** : `products/{productId}`  
**Document ID** : Auto-généré par Firestore

**Schéma du document** :

```json
{
  "productId": "prod_12345",
  "vendorId": "user_001_abcd1234",  // Référence à vendors/{vendorId}
  "title": "Python Crash Course 2e Edition",
  "description": "Un guide pratique pour apprendre Python rapidement...",
  "category": "Livres",  // "Livres" | "Électronique" | "Mode" | "Objets" | "Services"
  "price": 45.99,
  "currency": "EUR",
  "stock": {
    "total": 10,
    "available": 7,
    "reserved": 3
  },
  "images": [
    {
      "url": "gs://aubeshop.../products/prodId/image_1.jpg",
      "order": 1,
      "uploadedAt": 1700212800000
    },
    {
      "url": "gs://aubeshop.../products/prodId/image_2.jpg",
      "order": 2,
      "uploadedAt": 1700212800000
    }
  ],
  "rating": 4.5,
  "reviews": 12,
  "tags": ["Python", "Programmation", "Étudiant"],
  "isActive": true,
  "isFeatured": false,
  "createdAt": 1700212800000,
  "updatedAt": 1700212800000,
  "lastModifiedBy": "user_001_abcd1234"
}
```

**Index requis** :

- category + isActive (pour filtrage catalogue)
- vendorId + isActive (pour voir produits d'un vendeur)
- createdAt DESC (pour "nouveautés")
- price ASC/DESC (pour tri prix)
- rating DESC (pour tri popularité)

---

### 2.4 Collection : `orders`

Toutes les commandes (créées par clients).

**Chemin** : `orders/{orderId}`  
**Document ID** : Auto-généré par Firestore

**Schéma du document** :

```json
{
  "orderId": "order_567890",
  "clientId": "user_002_efgh5678",  // Référence à users/{clientId}
  "vendorId": "user_001_abcd1234",  // Référence à vendors/{vendorId}
  "items": [
    {
      "productId": "prod_12345",
      "title": "Python Crash Course 2e",
      "price": 45.99,
      "quantity": 1,
      "subtotal": 45.99,
      "image": "gs://aubeshop.../products/prodId/image_1.jpg"
    }
  ],
  "pricing": {
    "subtotal": 45.99,
    "shipping": 5.00,
    "commission": 4.60,  // Commission AubeShop (10%)
    "tax": 0.00,
    "total": 50.99
  },
  "status": "pending",  // "pending" | "accepted" | "in-progress" | "ready" | "delivered" | "cancelled"
  "paymentStatus": "pending",  // "pending" | "paid" | "failed" | "refunded"
  "shippingInfo": {
    "method": "pickup",  // "pickup" | "delivery"
    "address": {
      "street": "123 Rue Main",
      "city": "Paris",
      "postal": "75001"
    },
    "pickupLocation": "Campus Aube - Bâtiment C",
    "estimatedDeliveryDate": 1700385600000
  },
  "timeline": {
    "createdAt": 1700212800000,
    "acceptedAt": null,
    "inProgressAt": null,
    "readyAt": null,
    "deliveredAt": null,
    "cancelledAt": null
  },
  "notes": {
    "clientNote": "Livrer de préférence l'après-midi",
    "vendorNote": "Produit emballé avec soin"
  },
  "rating": null,  // Noté après livraison
  "ratingDetails": {
    "vendorRating": null,
    "comment": null,
    "ratedAt": null
  }
}
```

**Index requis** :

- clientId + status (pour voir commandes d'un client)
- vendorId + status (pour voir commandes d'un vendeur)
- status + createdAt DESC (pour filtres admin)
- paymentStatus (pour suivi paiements)

---

### 2.5 Collection : `cart` (Panier utilisateur - Optionnel, peut être en localStorage)

Paniers temporaires (optionnel si vous préférez localStorage).

**Chemin** : `cart/{userId}`  
**Document ID** : `userId`

**Schéma du document** :

```json
{
  "userId": "user_002_efgh5678",
  "items": [
    {
      "productId": "prod_12345",
      "quantity": 1,
      "addedAt": 1700212800000
    },
    {
      "productId": "prod_67890",
      "quantity": 2,
      "addedAt": 1700212900000
    }
  ],
  "updatedAt": 1700212900000
}
```

**Note** : Pour simplifier et réduire coûts Firestore, le panier peut être stocké **localement** (AsyncStorage) et n'être envoyé à Firestore que lors de la création de commande.

---

### 2.6 Collection : `notifications`

Historique des notifications (push/in-app).

**Chemin** : `notifications/{notificationId}`  
**Document ID** : Auto-généré

**Schéma du document** :

```json
{
  "notificationId": "notif_001",
  "userId": "user_002_efgh5678",
  "type": "order_accepted",  // "order_accepted" | "order_ready" | "vendor_approved" | "new_product"
  "title": "Commande #order_567890 acceptée",
  "message": "Votre vendeur a accepté votre commande",
  "orderId": "order_567890",  // Référence si applicable
  "vendorId": "user_001_abcd1234",  // Référence si applicable
  "data": {
    "deepLink": "/orders/order_567890"
  },
  "isRead": false,
  "createdAt": 1700212800000,
  "expiresAt": 1702804800000  // Suppression auto après 30 jours
}
```

**TTL (Time-To-Live)** : Activer expiration à 30 jours pour ne pas surcharger la BD.

---

### 2.7 Collection : `verificationDomains`

Configuration des domaines email universitaires acceptés.

**Chemin** : `verificationDomains/{domainId}`  
**Document ID** : Domaine (ex: "aube.edu.fr")

**Schéma du document** :

```json
{
  "domain": "aube.edu.fr",
  "isActive": true,
  "autoVerify": true,  // Si true, email suffit pour auto-vérification
  "createdAt": 1700212800000,
  "createdBy": "admin_xyz",
  "lastUpdated": 1700212800000,
  "notes": "Domaine officiel Université Aube Nouvelle"
}
```

**Données initiales** :

```json
[
  { "domain": "aube.edu.fr", "isActive": true, "autoVerify": true },
  { "domain": "etudiant.aube.fr", "isActive": true, "autoVerify": true },
  { "domain": "mail.aube-nouvelle.fr", "isActive": false, "autoVerify": false }
]
```

---

### 2.8 Collection : `adminApprovals`

Workflow d'approbation pour vendeurs (badge upload).

**Chemin** : `adminApprovals/{approvalId}`  
**Document ID** : Auto-généré

**Schéma du document** :

```json
{
  "approvalId": "approval_001",
  "vendorId": "user_001_abcd1234",
  "vendorName": "Bob Martin",
  "vendorEmail": "bob@example.com",
  "universityId": "ETU-2024-67890",
  "verificationMethod": "badge",
  "badgeUrl": "gs://aubeshop.../badges/vendorId/badge_001.jpg",
  "status": "pending",  // "pending" | "approved" | "rejected"
  "submittedAt": 1700212800000,
  "reviewedAt": null,
  "reviewedBy": null,
  "rejectionReason": null,
  "notes": "Badge très net, identité claire"
}
```

---

### 2.9 Collection : `commissions`

Tracking des commissions prélevées et paiements vendeurs.

**Chemin** : `commissions/{commissionId}`  
**Document ID** : Auto-généré

**Schéma du document** :

```json
{
  "commissionId": "comm_001",
  "vendorId": "user_001_abcd1234",
  "orderId": "order_567890",
  "amount": 4.60,  // 10% de la commande
  "status": "pending",  // "pending" | "paid" | "failed"
  "paymentMethod": "bank_transfer",
  "deductedFrom": 50.99,  // Montant total de la commande
  "createdAt": 1700212800000,
  "paidAt": null,
  "transactionId": null,
  "notes": ""
}
```

---

## 3. Règles de Sécurité Firebase (Firestore Rules)

Fichier à créer : `firestore.rules`

```javascript
// ============================================
// RÈGLES DE SÉCURITÉ FIRESTORE - AubeShop
// ============================================
// Authentification : Tous les utilisateurs doivent être authentifiés (sauf lecture catalogue)
// Autorisation : Basée sur le rôle (client, vendor, admin)
// 
// Activer dans Firebase Console :
// 1. Firestore Database > Rules
// 2. Copier/coller ce contenu
// 3. Publish
// ============================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // FONCTION UTILITAIRES
    // ============================================

    // Vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }

    // Vérifier si l'utilisateur est propriétaire du document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Vérifier le rôle utilisateur
    function getUserRole(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role;
    }

    // Vérifier si c'est un vendeur vérifié
    function isVerifiedVendor(vendorId) {
      let vendorDoc = get(/databases/$(database)/documents/vendors/$(vendorId));
      return vendorDoc.data.verificationStatus == 'approved';
    }

    // Vérifier si c'est un admin
    function isAdmin() {
      return getUserRole(request.auth.uid) == 'admin';
    }

    // ============================================
    // COLLECTION : users
    // ============================================
    match /users/{userId} {
      // Lecture : Propriétaire peut lire son profil, admin peut tout lire
      allow read: if isOwner(userId) || isAdmin();
      
      // Écriture création : Authenticated user crée son propre compte
      allow create: if isAuthenticated() && request.auth.uid == userId 
                    && request.resource.data.role in ['client', 'vendor'];
      
      // Écriture mise à jour : Propriétaire peut modifier son profil (sauf le rôle)
      allow update: if isOwner(userId) && 
                    (!('role' in request.resource.data) || 
                     request.resource.data.role == resource.data.role);
      
      // Suppression : Admin seulement
      allow delete: if isAdmin();
    }

    // ============================================
    // COLLECTION : vendors
    // ============================================
    match /vendors/{vendorId} {
      // Lecture : Tous les vendeurs approuvés sont lisibles (catalogue)
      allow read: if resource.data.verificationStatus == 'approved' || 
                  isOwner(vendorId) || 
                  isAdmin();
      
      // Écriture création : Étudiant crée sa candidature vendeur
      allow create: if isAuthenticated() && request.auth.uid == vendorId &&
                    request.resource.data.verificationStatus == 'pending';
      
      // Écriture mise à jour : Vendeur modifie son profil (sauf verificationStatus)
      allow update: if isOwner(vendorId) &&
                    (!('verificationStatus' in request.resource.data) ||
                     request.resource.data.verificationStatus == resource.data.verificationStatus) &&
                    (!('approvedBy' in request.resource.data) ||
                     request.resource.data.approvedBy == resource.data.approvedBy);
      
      // Mise à jour du statut de vérification : Admin seulement
      allow update: if isAdmin() && 
                    ('verificationStatus' in request.resource.data.diff.delta || 
                     'approvedBy' in request.resource.data.diff.delta);
      
      // Suppression : Admin seulement
      allow delete: if isAdmin();
    }

    // ============================================
    // COLLECTION : products
    // ============================================
    match /products/{productId} {
      // Lecture : Tous lisent les produits actifs (catalogue public)
      allow read: if resource.data.isActive == true;
      
      // Lecture privée : Vendeur lit tous ses produits
      allow read: if isAuthenticated() && 
                  request.auth.uid == resource.data.vendorId;
      
      // Écriture création : Vendeur vérifié crée ses produits
      allow create: if isAuthenticated() && 
                    request.auth.uid == request.resource.data.vendorId &&
                    isVerifiedVendor(request.auth.uid);
      
      // Écriture mise à jour : Vendeur modifie ses produits
      allow update: if isAuthenticated() && 
                    request.auth.uid == resource.data.vendorId &&
                    request.auth.uid == request.resource.data.vendorId;
      
      // Suppression : Vendeur supprime ses produits
      allow delete: if isAuthenticated() && 
                    request.auth.uid == resource.data.vendorId;
    }

    // ============================================
    // COLLECTION : orders
    // ============================================
    match /orders/{orderId} {
      // Lecture : Client ou Vendeur peuvent voir leurs commandes
      allow read: if isAuthenticated() && 
                  (request.auth.uid == resource.data.clientId || 
                   request.auth.uid == resource.data.vendorId ||
                   isAdmin());
      
      // Écriture création : Client crée une commande
      allow create: if isAuthenticated() && 
                    request.auth.uid == request.resource.data.clientId &&
                    request.resource.data.status == 'pending' &&
                    request.resource.data.paymentStatus == 'pending';
      
      // Mise à jour par vendeur : Marquer acceptée/livrée
      allow update: if isAuthenticated() && 
                    request.auth.uid == resource.data.vendorId &&
                    (request.resource.data.status in ['accepted', 'in-progress', 'ready', 'delivered'] ||
                     'timeline' in request.resource.data.diff.delta);
      
      // Mise à jour par client : Annulation ou rating
      allow update: if isAuthenticated() && 
                    request.auth.uid == resource.data.clientId &&
                    (request.resource.data.status == 'cancelled' ||
                     'rating' in request.resource.data.diff.delta);
      
      // Suppression : Admin seulement
      allow delete: if isAdmin();
    }

    // ============================================
    // COLLECTION : cart (Panier - Optionnel)
    // ============================================
    match /cart/{userId} {
      // Lecture/Écriture : Propriétaire du panier
      allow read, write: if isAuthenticated() && isOwner(userId);
      
      // Suppression : Propriétaire après checkout
      allow delete: if isAuthenticated() && isOwner(userId);
    }

    // ============================================
    // COLLECTION : notifications
    // ============================================
    match /notifications/{notificationId} {
      // Lecture : Propriétaire voit ses notifications
      allow read: if isAuthenticated() && 
                  request.auth.uid == resource.data.userId;
      
      // Écriture création : Cloud Function (serveur) seulement
      allow create: if request.auth == null;  // Serveur n'a pas d'auth
      
      // Mise à jour : Propriétaire marque comme lu
      allow update: if isAuthenticated() && 
                    request.auth.uid == resource.data.userId &&
                    request.resource.data.isRead != resource.data.isRead;
      
      // Suppression : Cloud Function (serveur)
      allow delete: if request.auth == null;
    }

    // ============================================
    // COLLECTION : verificationDomains
    // ============================================
    match /verificationDomains/{domain} {
      // Lecture : Tous lisent (publique, config d'app)
      allow read: if true;
      
      // Écriture : Admin seulement
      allow write: if isAdmin();
    }

    // ============================================
    // COLLECTION : adminApprovals
    // ============================================
    match /adminApprovals/{approvalId} {
      // Lecture : Admin + vendeur en attente voit sa demande
      allow read: if isAdmin() || 
                  (isAuthenticated() && 
                   request.auth.uid == resource.data.vendorId);
      
      // Écriture création : Vendeur crée sa demande (via Cloud Function)
      allow create: if isAuthenticated() && 
                    request.auth.uid == request.resource.data.vendorId &&
                    request.resource.data.status == 'pending';
      
      // Mise à jour : Admin approuve/rejette
      allow update: if isAdmin() &&
                    ('status' in request.resource.data.diff.delta ||
                     'reviewedAt' in request.resource.data.diff.delta ||
                     'rejectionReason' in request.resource.data.diff.delta);
      
      // Suppression : Admin archive
      allow delete: if isAdmin();
    }

    // ============================================
    // COLLECTION : commissions
    // ============================================
    match /commissions/{commissionId} {
      // Lecture : Vendeur voit ses commissions, admin voit tout
      allow read: if isAuthenticated() && 
                  (request.auth.uid == resource.data.vendorId || isAdmin());
      
      // Écriture création : Cloud Function à la finalisation de commande
      allow create: if request.auth == null;  // Serveur
      
      // Mise à jour statut paiement : Cloud Function
      allow update: if request.auth == null;  // Serveur
      
      // Suppression : Admin
      allow delete: if isAdmin();
    }

    // ============================================
    // CATCH-ALL : Refuse tout le reste
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 4. Index Firestore Recommandés

**À créer dans Firebase Console** → Firestore > Indexes

| Collection | Champs | Ordre |
|-----------|--------|-------|
| `products` | `category`, `isActive`, `createdAt` | DESC |
| `products` | `vendorId`, `isActive` | ASC, DESC |
| `products` | `price`, `isActive` | ASC/DESC |
| `products` | `rating`, `isActive` | DESC |
| `orders` | `clientId`, `status`, `createdAt` | ASC, ASC, DESC |
| `orders` | `vendorId`, `status`, `createdAt` | ASC, ASC, DESC |
| `orders` | `status`, `createdAt` | ASC, DESC |
| `vendors` | `verificationStatus`, `createdAt` | ASC, DESC |
| `vendors` | `rating` | DESC |
| `vendors` | `totalSales` | DESC |
| `notifications` | `userId`, `createdAt` | ASC, DESC |
| `commissions` | `vendorId`, `status` | ASC, ASC |

---

## 5. Liste des Dépendances NPM

Toutes les dépendances requises pour AubeShop.

### Installation (copier/coller dans terminal)

```bash
# Créer le projet Expo
npx create-expo-app aubeshop --template expo-template-blank-typescript

# Installer toutes les dépendances
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

### Tableau récapitulatif des dépendances

| Package | Version | Utilité | Taille |
|---------|---------|---------|--------|
| `firebase` | ^10.0.0 | Auth, Firestore, Storage | ~3 MB |
| `expo-image-picker` | ^14.0.0 | Sélectionner photos | ~1 MB |
| `expo-notifications` | ^0.20.0 | Push/Local notifications | ~0.5 MB |
| `lottie-react-native` | ^6.0.0 | Animations Lottie | ~0.3 MB |
| `react-native-reanimated` | ^3.0.0 | Animations fluides | ~2 MB |
| `react-native-gesture-handler` | ^2.0.0 | Gestes tactiles | ~0.5 MB |
| `expo-router` | ^3.0.0 | Navigation file-based | ~1 MB |
| `@react-navigation/*` | ^6.0.0 | Navigation complète | ~2 MB |
| `@react-native-async-storage` | ^1.21.0 | Stockage local | ~0.1 MB |
| `axios` | ^1.6.0 | HTTP client | ~0.5 MB |
| `date-fns` | ^2.30.0 | Manipulation dates | ~1 MB |
| `zustand` | ^4.4.0 | État global (optionnel) | ~0.2 MB |

**Total approx. : ~15 MB**

### DevDependencies (Pour développement & tests)

```bash
npm install --save-dev \
  @types/react-native \
  @testing-library/react-native \
  jest \
  jest-expo \
  @babel/core
```

---

## 6. Coûts Firebase Estimés (Forfait "Spark" Gratuit)

### 6.1 Forfait Gratuit Firebase (Limites Mensuelles)

| Service | Quota Gratuit | Limite |
|---------|---------------|--------|
| **Firestore Reads** | 50,000 | lectures/mois |
| **Firestore Writes** | 20,000 | écritures/mois |
| **Firestore Deletes** | 20,000 | suppressions/mois |
| **Firestore Storage** | 1 GB | stockage |
| **Cloud Storage** | 5 GB | stockage total |
| **Cloud Storage Download** | 1 GB/jour | bande passante |
| **Firebase Auth** | 10,000 utilisateurs | quota/mois |
| **Cloud Functions** | 2 millions | invocations/mois |

---

### 6.2 Simulation Réaliste (500 utilisateurs actifs, 20 vendeurs)

#### 📖 **Lectures Firestore**

**Scenario SANS optimisation** :

- 500 utilisateurs ouvrent l'app **2×/jour**
- Chaque ouverture charge **30 produits** du catalogue
- Calcul : 500 × 2 × 30 = **30,000 lectures/jour**
- ⚠️ **Dépassement quotidien du quota !**

**Optimisations appliquées** :

1. ✅ **Cache local (AsyncStorage)**
   - Sauvegarder catalogue après 1ère charge
   - Invalider après 24h
   - **Réduction : -70%** (ne charger que si changement)

2. ✅ **Pagination des listes**
   - Charger 20 produits au lieu de 30
   - Charger plus seulement au scroll
   - **Réduction : -33%**

3. ✅ **Requêtes intelligentes**
   - Indexer sur `category`, `isActive`
   - Paginer : 20 produits/page
   - **Réduction : -50%**

**Calcul révisé** :

- 500 utilisateurs × 2/jour × 20 produits (pagés) × 0.3 (avec cache) = **6,000 lectures/jour**
- **~180,000 lectures/mois (majorité depuis cache local)** ✅

#### ✍️ **Écritures Firestore**

| Opération | Fréquence | Écritures | Notes |
|-----------|-----------|-----------|-------|
| Nouvelles commandes | 10/jour | 50 | Création + mise à jour stock |
| Nouveaux produits | 20/semaine | 20 | ~3/jour |
| Nouveaux vendeurs | 5/semaine | 5 | ~1/jour |
| Mises à jour statut commandes | 30/jour | 30 | Acceptée, livrée, etc. |
| Notifications créées | 40/jour | 40 | Log notifications |
| Commissions créées | 10/jour | 10 | Tracking paiements |
| **TOTAL/JOUR** | | **~155** |  |
| **TOTAL/MOIS** | | **~4,650** | ✅ **Bien sous 20K** |

#### 💾 **Storage Firebase (Stockage)**

| Élément | Quantité | Taille/unité | Total | % du quota 1GB |
|--------|----------|-------------|-------|----------------|
| **Photos produits** | 1,000 produits × 2 images | 300 KB | 600 MB | 60% |
| **Badges étudiants** | 100 vendeurs | 500 KB | 50 MB | 5% |
| **Avatars users** | 500 utilisateurs | 200 KB | 100 MB | 10% |
| **Autres (metadata, backups)** | - | - | 50 MB | 5% |
| **TOTAL** | | | **~800 MB** | **80%** ✅ |

**Conclusion Storage** : Bien sous le 1 GB gratuit.

#### 🌐 **Cloud Storage (Fichiers Images)**

| Ressource | Utilisation | Quota | % du quota |
|-----------|-------------|-------|-----------|
| **Stockage total** | 800 MB | 5 GB | 16% ✅ |
| **Téléchargements/jour** | ~50 MB | 1 GB/jour | 5% ✅ |

---

### 6.3 Résumé Utilisation Gratuite

```
╔════════════════════════════════════════════╗
║ ESTIMATION MENSUELLE - 500 UTILISATEURS   ║
╠════════════════════════════════════════════╣
║ Firestore Reads      :  ~6,000-8,000     ║  ✅ Quota: 50,000
║ Firestore Writes     :  ~4,650           ║  ✅ Quota: 20,000
║ Firestore Storage    :  ~800 MB          ║  ✅ Quota: 1 GB
║ Cloud Storage        :  ~800 MB          ║  ✅ Quota: 5 GB
║ Authentication       :  ~500 users       ║  ✅ Quota: 10,000
║                                          ║
║ COÛT MENSUEL         :  $0 (GRATUIT)    ║
║ DÉPASSEMENT RISQUE   :  ❌ NON           ║
╚════════════════════════════════════════════╝
```

---

### 6.4 Stratégies d'Optimisation

#### 🚀 Pour rester DANS les limites gratuites

1. **Cache local agressif**

   ```typescript
   // Sauvegarder catalogue en local après 1ère charge
   const catalogCache = await AsyncStorage.getItem('catalog');
   if (catalogCache && isCacheValid()) {
     return JSON.parse(catalogCache); // 0 lectures Firestore !
   }
   ```

2. **Pagination stricte**

   ```typescript
   // Charger 20 produits max par requête
   const products = await getDocs(query(
     collection(firestore, 'products'),
     where('isActive', '==', true),
     limit(20) // Pas 1000 !
   ));
   ```

3. **Batch operations**

   ```typescript
   // Regrouper écritures dans 1 transaction (= 1 écriture)
   const batch = writeBatch(firestore);
   batch.update(doc1, data1);
   batch.update(doc2, data2);
   await batch.commit(); // 1 écriture = 2 opérations
   ```

4. **Indexes efficaces**
   - Créer indexes UNIQUEMENT sur les champs utilisés
   - Éviter indexes sur champs non requêtés

5. **TTL (Time-To-Live) Firestore**
   - Supprimer automatiquement notifications après 30 jours
   - Supprimer brouillons commandes après 7 jours

---

### 6.5 Quand Passer à Blaze (Pay-as-You-Go)

| Seuil | Action |
|-------|--------|
| **500 users** | Rester en Spark (gratuit) |
| **2,000 users** | Moniter lectures/jour, optimiser cache |
| **5,000+ users** | Envisager Blaze si lectures > 50K/jour |
| **10,000+ users** | Blaze presque obligatoire |

**Coût estimé Blaze** (10,000 utilisateurs) :

- Lectures : $1.00/100K → ~$15/mois
- Écritures : $5.00/100K → ~$2/mois
- Storage : $0.18/GB → ~$5/mois
- **Total ≈ $22/mois** (acceptable pour scale)

---

### 💡 Conclusion

✅ **AubeShop MVP reste ENTIÈREMENT GRATUIT** avec :

- Firebase Spark tier (forfait gratuit)
- 500 utilisateurs actifs
- Optimisations simples (cache + pagination)
- Zéro coût initial

🎯 **Stratégie recommandée** :

1. Lancer sur Spark gratuit (0€)
2. Implémenter cache + pagination dès le départ
3. Monitorer quotidiennement les quotas
4. Passer à Blaze si > 5K utilisateurs actifs

---

## 7. Optimisations Coûts Firebase

### 7.1 Réduire les lectures

1. ✅ **Cache local** (AsyncStorage)
   - Sauvegarder catalogue en local après 1ère load
   - Invalider cache après 24h

2. ✅ **Pagination** pour listes longues
   - Charger 20 produits par page, non pas 1000

3. ✅ **Indéxation** (Firestore gère automatiquement)

### 7.2 Réduire les écritures

1. ✅ **Batch operations**
   - Regrouper écritures dans une transaction

2. ✅ **Panier local**
   - Stocker en `AsyncStorage`, écrire à Firestore que lors du checkout

3. ✅ **Marquer comme lus** : Batch mise à jour notifications

### 7.3 Réduire le stockage

1. ✅ **Compression images**
   - Réduire à 800x600px, JPEG 85%

2. ✅ **Suppression images obsolètes**
   - Cloud Function pour nettoyer produits supprimés

3. ✅ **CDN** (Optionnel) : Cloudinary intégration

### 7.4 TTL & Nettoyage auto

1. ✅ **Notifications** : Expirer après 30 jours (TTL)
2. ✅ **Brouillons commandes** : Supprimer après 7 jours
3. ✅ **Badges rejetés** : Supprimer après 60 jours

---

## 8. Checklist Firestore Setup

- [ ] Créer projet Firebase dans Console
- [ ] Activer Firebase Auth (Email/Password)
- [ ] Créer Firestore Database (Production mode)
- [ ] Copier/coller les règles Firestore
- [ ] Créer les indexes recommandés
- [ ] Initialiser collections avec données test
- [ ] Configurer verificationDomains avec domaine @aube.edu.fr
- [ ] Configurer Cloud Storage (pour images)
- [ ] Activer Firestore Backups (console)
- [ ] Configurer Cloud Functions (futur)
- [ ] Tester règles de sécurité (Firestore emulator)

---

## 9. Summary Architecture Backend

```
┌────────────────────────────────────────────────┐
│          Firebase (Backend-as-a-Service)       │
├────────────────────────────────────────────────┤
│ • Firebase Auth : Authentification            │
│ • Firestore : Base données (9 collections)    │
│ • Storage : Stockage images                    │
│ • Cloud Functions : Logique serveur (futur)   │
│ • Realtime Notifications (Firestore Listeners)│
└────────────────────────────────────────────────┘
        ↑
        │ API REST
        │
┌────────────────────────────────────────────────┐
│     App Expo (React Native + TypeScript)       │
├────────────────────────────────────────────────┤
│ • Screens : Auth, Home, Product, Orders...    │
│ • Context API : État utilisateur + panier     │
│ • AsyncStorage : Cache local                   │
│ • Notifications : Push/Local via Expo         │
└────────────────────────────────────────────────┘
```

---

**Document Version** : 1.0  
**Date** : 17 novembre 2024  
**Étape** : B - Analyse ✅
