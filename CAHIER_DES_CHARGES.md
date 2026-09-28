# AubeShop — Cahier des Charges Complet

## 1. Vue d'ensemble du produit

**Nom** : AubeShop  
**Type** : Application mobile de e-commerce pour l'Université Aube Nouvelle  
**Plateforme** : Expo (React Native) — Compatible Expo Go (Android/iOS)  
**Langage** : TypeScript  
**Backend** : Firebase (Auth, Firestore, Storage, Cloud Functions optionnel)  
**Design** : Moderne, flottant, animations, palette **rouge/noir/blanc**

### 2. Positionnement & objectif principal

AubeShop permet aux **étudiants de l'Université Aube Nouvelle** de devenir **vendeurs vérifiés**, tandis que **tout le monde** peut s'inscrire comme **client**. L'app facilite la vente de produits entre étudiants et la communauté universitaire.

**Tagline** : *"Achetez et vendez facilement sur le campus."*

---

## 3. Rôles utilisateurs & permissions

### 3.1 Rôle : **Client** (Acheteur)
- **Inscription** : Email + mot de passe OU numéro de téléphone + SMS
- **Authentification** : Connexion standard (email/téléphone)
- **Permissions** :
  - Consulter catalogue de produits (tous les vendeurs)
  - Filtrer par catégorie, campus, prix
  - Ajouter/retirer produits du panier
  - Passer commandes (ajouter adresse livraison, validé)
  - Consulter historique commandes et statut en temps réel
  - Recevoir notifications sur statut commande
  - Évaluer vendeur (optionnel v1)

### 3.2 Rôle : **Vendeur-Étudiant** (Seller - Verified)
- **Inscription** : Email + mot de passe + **WORKFLOW DE VÉRIFICATION ÉTUDIANT**
- **Authentification** : Email + mot de passe (après vérification)
- **Permissions** (après approbation) :
  - Ajouter/modifier/supprimer produits
  - Upload photos produits (Firebase Storage)
  - Consulter commandes entrantes
  - Marquer commandes (acceptée, en cours, livrée)
  - Consulter historique ventes et revenus
  - Voir commission prélevée automatiquement
  - Gérer profil vendeur (bio, contact, localisation)

### 3.3 Rôle : **Admin** (Gestionnaire AubeShop)
- **Accès** : Via panel web minimal OU mobile (screens spécifique)
- **Permissions** :
  - Approuver/rejeter vendeurs en attente
  - Consulter statistics (ventes totales, revenus commission, utilisateurs actifs)
  - Bloquer/débloquer comptes (vendeur/client)
  - Gérer catégories produits
  - Consulter rapports (fraude, non-livraison, etc.)

---

## 4. Écrans & Flux utilisateur

### 4.1 Authentification

#### Écran 1a : **Login / Connexion** (Initial)
```
┌─────────────────────┐
│  🔐 AubeShop         │
│  Connectez-vous      │
├─────────────────────┤
│ Email : [_________]  │
│ Mot de passe: [___]  │
│ [Connexion]          │
│ Pas de compte ? [S'inscrire]
│ [Connexion rapide téléphone]
└─────────────────────┘
```

#### Écran 1b : **Signup Client**
```
┌─────────────────────┐
│  Créer compte Client │
├─────────────────────┤
│ Nom : [___________]  │
│ Email : [________]   │
│ Mot de passe: [__]   │
│ Confirmer: [_____]   │
│ Ou : [Téléphone SMS] │
│ [Créer]              │
│ [Retour]             │
└─────────────────────┘
```

#### Écran 1c : **Signup Vendeur — Étape 1 (Choix méthode vérification)**
```
┌──────────────────────────┐
│ Devenir Vendeur          │
├──────────────────────────┤
│ Méthode de vérification: │
│                          │
│ [x] Email universitaire  │
│     (auto-vérif)         │
│                          │
│ [x] Numéro étudiant      │
│     + Upload badge       │
│     (approbation manuelle)
│                          │
│ [Suivant]                │
└──────────────────────────┘
```

#### Écran 1d : **Signup Vendeur — Étape 2a (Email universitaire)**
```
┌──────────────────────────┐
│ Vérification Étudiant    │
├──────────────────────────┤
│ Email universitaire :    │
│ [_____@aube.edu.xxx_]    │
│                          │
│ [Vérifier & Créer]       │
│ (lien mag + clique)      │
│ Pas reçu ? [Renvoyer]    │
│ [Annuler]                │
└──────────────────────────┘
```

#### Écran 1d-alt : **Signup Vendeur — Étape 2b (Upload Badge)**
```
┌──────────────────────────┐
│ Vérification par Badge   │
├──────────────────────────┤
│ Numéro Étudiant: [_____] │
│ Prénom + Nom: [________] │
│                          │
│ [Télécharger badge JPG]  │
│ Photo chargée: [✓]       │
│                          │
│ Statut : ⏳ En attente   │
│ (approbation manuelle)   │
│                          │
│ [Confirmer]              │
└──────────────────────────┘
```

### 4.2 Flux Principal (Client)

#### Écran 2a : **Home - Catalogue Produits**
```
┌────────────────────────────┐
│ 🏠 Accueil        🔍 [S____]│
├────────────────────────────┤
│ Catégories rapides:        │
│ [Livres] [Électro] [Mode]  │
│ [Objets] [Services]        │
├────────────────────────────┤
│ Produits populaires:       │
│                            │
│ ┌──────────┐ ┌──────────┐ │
│ │ Photo    │ │ Photo    │ │
│ │Titre 1   │ │Titre 2   │ │
│ │45€   ⭐4.5
│ │[Ajouter] │ │[Ajouter] │ │
│ └──────────┘ └──────────┘ │
│                            │
│ [Charger plus]             │
├────────────────────────────┤
│ 🏠 Accueil 🛒 [1] 👤 Compte│
└────────────────────────────┘
```

#### Écran 2b : **Détail Produit**
```
┌────────────────────────────┐
│ ← Livres > Python Crash    │
├────────────────────────────┤
│ [Grande photo produit]     │
│                            │
│ Titre : Python Crash 2ed   │
│ Prix : 45€                 │
│ Stock : 3/10               │
│ Vendeur : @Alice           │
│ Avis : ⭐ 4.5/5 (12)       │
│                            │
│ Description:               │
│ Livre pratique Python...   │
│                            │
│ [- 1 +]  [Ajouter panier]  │
│ [❤️ Favori]                │
│                            │
│ Avis clients:              │
│ ⭐⭐⭐⭐⭐ Super ! -Julie    │
└────────────────────────────┘
```

#### Écran 2c : **Panier**
```
┌────────────────────────────┐
│ 🛒 Panier (2 produits)      │
├────────────────────────────┤
│ [Produit 1]                │
│ Python Crash... x1  45€    │
│ [- 1 +] [❌]               │
│                            │
│ [Produit 2]                │
│ T-shirt AUB x2  @ 15€ = 30€
│ [- 1 +] [❌]               │
├────────────────────────────┤
│ Sous-total:        75€     │
│ Livraison:         5€      │
│ Commission admin: -5€      │
│ ─────────────────────      │
│ Total:             75€     │
│                            │
│ [Procéder au paiement]     │
│ [Continuer shopping]       │
└────────────────────────────┘
```

#### Écran 2d : **Checkout & Adresse Livraison**
```
┌────────────────────────────┐
│ 📦 Livraison & Paiement    │
├────────────────────────────┤
│ 📍 Adresse de livraison:   │
│ [Nom] Marc                 │
│ [Rue] 123 Rue Main         │
│ [Ville] Paris 75001        │
│ [Téléphone] +33612...      │
│                            │
│ Retrait au point:  [x]     │
│  🏪 Campus Aube (Bâtiment C)
│                            │
│ Méthode de paiement:       │
│ [o] Carte credit (Stripe)  │
│ [ ] Flutterwave (future)   │
│ [ ] Virement (future)      │
│                            │
│ Conditions: [✓] Lire T&C   │
│                            │
│ Total : 75€                │
│ [Valider commande]         │
│ [Annuler]                  │
└────────────────────────────┘
```

#### Écran 2e : **Historique Commandes**
```
┌────────────────────────────┐
│ 📋 Mes commandes           │
├────────────────────────────┤
│ Commande #1234             │
│ 3 produits | 75€           │
│ 📅 2024-11-10              │
│ 🟢 Livrée (17 nov 2024)    │
│ [Détails] [Réévaluer]      │
│                            │
│ Commande #1235             │
│ 1 produit | 45€            │
│ 📅 2024-11-15              │
│ 🟡 En cours (depuis vendeur)
│ [Détails] [Contacter]      │
│                            │
│ Commande #1236             │
│ 2 produits | 60€           │
│ 📅 2024-11-16              │
│ 🔴 En attente (vendeur)    │
│ [Détails]                  │
├────────────────────────────┤
│ 🏠 Accueil 🛒 [1] 👤 Compte│
└────────────────────────────┘
```

#### Écran 2f : **Suivi Commande (Real-time)**
```
┌────────────────────────────┐
│ ← Commande #1235           │
├────────────────────────────┤
│ Vendeur: @Alice            │
│ Produit: Python Crash      │
│ Prix: 45€                  │
│                            │
│ Statut:                    │
│ ✓ Commande reçue           │
│ ✓ Vendeur acceptée         │
│ ⏳ Préparation en cours    │
│   En cours depuis 2h       │
│ ○ Prête pour retrait       │
│ ○ Livrée                   │
│                            │
│ Lieu retrait :             │
│ 🏪 Campus Aube (Bâtiment C)
│ Horaires: 10h-18h L-V      │
│                            │
│ [Contacter vendeur]        │
│ [Signaler problème]        │
└────────────────────────────┘
```

### 4.3 Flux Vendeur

#### Écran 3a : **Ajouter Produit**
```
┌────────────────────────────┐
│ ➕ Ajouter un produit      │
├────────────────────────────┤
│ Titre: [Python Crash_____] │
│ Catégorie: [Livres ↓]      │
│ Prix (€): [45___________]  │
│ Stock: [10____________]    │
│                            │
│ Description:               │
│ [Livre pratique Python...] │
│ [                       ]  │
│                            │
│ [📷 Ajouter photo]         │
│ (max 3 photos)             │
│ [Photo 1 ✓]                │
│                            │
│ [Annuler] [Enregistrer]    │
└────────────────────────────┘
```

#### Écran 3b : **Commandes Reçues (Vendeur)**
```
┌────────────────────────────┐
│ 📦 Commandes              │
├────────────────────────────┤
│ [1 NEW] Commande #1236     │
│ Client: @Marc              │
│ 2 produits | 60€           │
│ 🔴 Statut: En attente      │
│ [Accepter] [Refuser]       │
│                            │
│ Commande #1235             │
│ Client: @Julie             │
│ 1 produit | 45€            │
│ 🟡 Statut: Acceptée        │
│ [Marquer livrée]           │
│ [Retrait confirmé]         │
│                            │
│ Commande #1234             │
│ Client: @Marc              │
│ 1 produit | 30€            │
│ 🟢 Statut: Livrée          │
│ Paiement reçu: 28.50€      │
│                            │
└────────────────────────────┘
```

#### Écran 3c : **Profil Vendeur**
```
┌────────────────────────────┐
│ 👤 Profil Vendeur          │
├────────────────────────────┤
│ @Alice                     │
│ ⭐ 4.8 (47 avis)           │
│ 💰 Revenus: 1,250€         │
│ 📦 Articles: 12            │
│ ✓ Vérifié étudiant         │
│                            │
│ Bio:                       │
│ [Étudiante L3 Physique...] │
│                            │
│ Horaires retrait:          │
│ Campus Aube, Bâtiment C    │
│ Du Lundi au Vendredi       │
│ 10h - 18h                  │
│                            │
│ Email: alice@aube.edu      │
│ Tél: +33612345678 (caché)  │
│                            │
│ [Modifier profil]          │
│ [Paramètres]               │
└────────────────────────────┘
```

### 4.4 Flux Admin

#### Écran 4a : **Approbation Vendeurs**
```
┌────────────────────────────┐
│ ✅ Approbation Vendeurs    │
├────────────────────────────┤
│ [2 en attente]             │
│                            │
│ 🔴 Bob - Badge Upload      │
│ ID: BOB-123456             │
│ Email: bob@mail.com        │
│ Soumis: 2024-11-15         │
│ Badge: [Voir image]        │
│ [Approuver] [Rejeter]      │
│                            │
│ 🔴 Charlie - Badge Upload  │
│ ID: CHARLIE-789            │
│ Email: charlie@mail.com    │
│ Soumis: 2024-11-16         │
│ Badge: [Voir image]        │
│ [Approuver] [Rejeter]      │
│                            │
│ ✅ Approuvés (14):         │
│ Alice, Diana, Eve...       │
└────────────────────────────┘
```

#### Écran 4b : **Dashboard Admin (Stats)**
```
┌────────────────────────────┐
│ 📊 Dashboard Admin         │
├────────────────────────────┤
│ Utilisateurs actifs: 127   │
│ Vendeurs vérifiés: 14      │
│ Commandes cette semaine: 45│
│ Revenus commission: 2,250€ │
│ Taux de satisfaction: 4.6/5│
│                            │
│ Problèmes à modérer:       │
│ [2] Signalements produits  │
│ [1] Non-livraison          │
│ [0] Fraude                 │
│                            │
│ [Voir rapports complets]   │
└────────────────────────────┘
```

---

## 5. Cas d'usage (User Stories)

### UC-1 : S'inscrire comme Client
**Acteur** : Utilisateur non authentifié  
**Précondition** : App ouverte, écran Login  
**Flux nominal** :
1. Utilisateur clique "S'inscrire"
2. Remplit (Nom, Email, Mot de passe) OU (Téléphone)
3. Clique "Créer"
4. Email de confirmation envoyé (ou SMS)
5. Valide l'email (lien) ou le SMS
6. Redirigé vers Home / Catalogue
**Flux alternatif** :
- Email déjà existant → Erreur affichée
- Connexion interrompue → Brouillon sauvegardé (localStorage)

### UC-2 : S'inscrire comme Vendeur (Vérification Email Universitaire)
**Acteur** : Étudiant Aube Nouvelle  
**Précondition** : App ouverte, écran Login  
**Flux nominal** :
1. Clique "Devenir Vendeur"
2. Choisit méthode "Email universitaire"
3. Remplit Nom, Email, Mot de passe + **Email universitaire** (@aube.edu.xx)
4. Clique "Vérifier"
5. Email de vérification envoyé
6. Clique lien → Compte vendeur auto-activé
7. Redirigé vers page "Profil Vendeur" / "Ajouter produit"
**Flux alternatif** :
- Email universitaire invalide → Erreur
- Domaine non autorisé → Erreur
- Trop de tentatives → Compte temporairement bloqué

### UC-3 : S'inscrire comme Vendeur (Vérification Badge)
**Acteur** : Étudiant Aube Nouvelle  
**Précondition** : App ouverte, écran Login  
**Flux nominal** :
1. Clique "Devenir Vendeur"
2. Choisit méthode "Numéro étudiant + Badge"
3. Remplit Nom, Email, Mot de passe, Numéro étudiant
4. Upload photo badge (JPG/PNG)
5. Clique "Soumettre"
6. Statut : ⏳ **En attente d'approbation admin**
7. Admin reçoit notification
8. Admin valide identité → Compte vendeur activé (notification push)
**Flux alternatif** :
- Photo floue/illisible → Admin rejette + demande renvoi
- Numéro invalide → Erreur client-side
- Compte déjà vendeur → Erreur

### UC-4 : Consulter Catalogue & Filtrer
**Acteur** : Client  
**Précondition** : Connecté, Home ouverte  
**Flux nominal** :
1. Voit liste produits (pagination/scroll)
2. Clique catégorie [Livres] → Filtre appliqué
3. Remplit barre de recherche "Python" → Résultats
4. Clique produit → Détail complet
**Post-condition** : Produits visibles, pas d'authentification requise pour consulter

### UC-5 : Ajouter Produit au Panier & Passer Commande
**Acteur** : Client (authentifié)  
**Précondition** : Connecté, produit consulté  
**Flux nominal** :
1. Vue détail produit, ajuste quantité [+1]
2. Clique "Ajouter au panier"
3. Panier mis à jour (+1 badge)
4. Poursuit shopping ou va au panier
5. Panier : voir résumé (produits, sous-total, frais livraison)
6. Clique "Procéder au paiement"
7. Remplit adresse livraison (ou retrait au point)
8. Valide conditions & clique "Valider commande"
9. Paiement simulé (endpoint Stripe/Flutterwave futur)
10. Confirmation : Commande créée, notification envoyée
**Post-condition** :
- Commande insérée Firestore (statut = En attente)
- Stock produit décrémenté
- Commission (10%) prélevée automatiquement
- Vendeur reçoit notification

### UC-6 : Vendeur Accepte & Marque Commande Livrée
**Acteur** : Vendeur  
**Précondition** : Connecté, commande reçue  
**Flux nominal** :
1. Notification : "Nouvelle commande #1236"
2. Ouvre app → Écran "Commandes" avec statut 🔴 En attente
3. Clique "Accepter" → Statut 🟡 Acceptée (client notifié)
4. Préparation, puis clique "Prête pour retrait" / "Marquer livrée"
5. Statut 🟢 Livrée
6. Paiement transféré au vendeur (minus commission)
**Flux alternatif** :
- Vendeur clique "Refuser" → Commande 🔴 Annulée, client remboursé

### UC-7 : Admin Approuve Vendeur (Badge)
**Acteur** : Admin  
**Précondition** : Vendeur en attente d'approbation (badge uploadé)  
**Flux nominal** :
1. Admin ouvre app (accès tab Admin réservé)
2. Voir liste vendeurs en attente
3. Clique vendeur "Bob"
4. Voit photo badge, numéro ID, email
5. Valide identité → Clique "Approuver"
6. Statut vendeur → ✅ Vérifié
7. Push notification au vendeur : "Compte activé !"
**Flux alternatif** :
- Badge illisible → Clique "Rejeter" + message : "Badge flou, réessayez"

### UC-8 : Notifications Temps Réel
**Acteur** : Client & Vendeur  
**Précondition** : App ouverte OU en background  
**Événements** :
- Commande reçue (vendeur)
- Commande acceptée (client)
- Commande livrée (client)
- Compte vendeur approuvé (vendeur)
- Nouveau produit du vendeur favorisé (client, opt.)

---

## 6. Flux de Vérification d'Étudiant (Analyse Comparative)

### Option A : Email Universitaire (Recommandé)
**Avantages** :
- ✅ Auto-vérification instantanée
- ✅ Aucun upload requis (coût storage minimal)
- ✅ Standard académique fiable
- ✅ Intégration simple (regex domaine)

**Inconvénients** :
- ❌ Nécessite domaine email connu (exemple: @aube.edu.fr)
- ❌ Problème si université utilise domaine générique

**Coût** : Minimal (~1 read Firestore par vérif)

**Implémentation** :
```
1. Admin configure domaine(s) autorisés en Firestore
2. Lors signup vendeur, extraction domaine email
3. Si domaine autorisé → Auto-activation
4. Sinon → Rejeté (message d'erreur)
```

---

### Option B : Numéro Étudiant + Upload Badge (Alternative)
**Avantages** :
- ✅ Vérification manuelle fiable (détection fraude)
- ✅ Fonctionne si email université non accessible
- ✅ Proof-of-identity robuste

**Inconvénients** :
- ❌ Coût storage Firebase (photos badges)
- ❌ Approbation manuelle → latence (heures/jours)
- ❌ UX moins fluide

**Coût** : Modéré (~5 MB par upload × nb vendeurs)

**Implémentation** :
```
1. Vendeur upload photo badge JPG
2. Firebase Storage → path: badges/{userId}/{timestamp}.jpg
3. Admin panel → liste "Vendeurs en attente"
4. Admin valide visuellement → Click "Approuver"
5. Flag Firestore: vendorVerified = true
```

---

### Option C : Hybride (Recommandé pour Robustesse)
**Flux** :
1. Si email universitaire → Auto-vérification immédiate
2. Sinon, propose upload badge (approbation manuelle)

**Avantages** : Meilleur des deux mondes
- ✅ 90% des cas instantanés (email)
- ✅ 10% des cas couverts (badge)
- ✅ Flexibilité

**Implémentation** : Dans UC-3 écran, proposer un switch radio :
```
[ ] Email universitaire (auto) → [Vérifier]
[x] Badge (approbation) → [Télécharger] → [Soumettre]
```

---

## 7. Recommandation Finale (Approche Conseillée)

Pour **l'Université Aube Nouvelle**, je recommande :

### **Étape 1 : Lancer avec Option C (Hybride)**
- **Raison** : Flexibilité totale, aucune dépendance API externe, sécurité maximum
- **Coût Firebase** : Minimal (emails) + modéré (quelques photos)
- **Maintenance admin** : 5-10 min/jour pour approbations manuelles

### **Implémentation Détaillée**

**Fichier Firestore** : `config/verificationDomains`
```json
{
  "domain": "aube.edu.fr",
  "autoVerify": true,
  "createdAt": "2024-11-17"
}
```

**Fonction Cloud** (Cloud Function) : Vérifier email automatiquement
```typescript
// verification.function.ts
export const verifyVendorEmail = (email: string): boolean => {
  const allowedDomains = ["aube.edu.fr", "etudiant.aube.fr"];
  const domain = email.split("@")[1];
  return allowedDomains.includes(domain);
};
```

**Workflow UI** :
```
1. Signup Vendeur → Choix [Email Auto / Badge Manuel]
2. Si Email → Vérif immédiate, activation auto
3. Si Badge → Upload + Attente admin (0-24h)
```

### **Admin Panel (Simple)** :
Une simple liste "Vendeurs en attente" dans l'app mobile avec boutons "Approuver / Rejeter".

---

## 8. Spécifications Techniques

### 8.1 Stack Technologique
| Couche | Technologie |
|--------|-------------|
| Frontend | Expo (React Native), TypeScript |
| Navigation | Expo Router (file-based) |
| UI/UX | React Native UI, Lottie, Reanimated |
| Backend | Firebase (Auth, Firestore, Storage) |
| Cloud Logic | Cloud Functions (optionnel) |
| Paiement | Stripe (futur) / Flutterwave (futur) |
| État | React Context + AsyncStorage |
| Build | EAS Build (Expo) |

### 8.2 Dépendances NPM Principales (À Installer)
```
firebase
@react-native-async-storage/async-storage
expo-image-picker
expo-camera
lottie-react-native
react-native-reanimated
react-native-gesture-handler
@react-navigation/native @react-navigation/bottom-tabs
expo-router
axios (optionnel, pour API futures)
```

### 8.3 Permissions Android/iOS
- **Caméra** (photo badge)
- **Galerie** (télécharger images produits)
- **Notifications Push** (statut commandes)

---

## 9. Calendrier & Phases

### Phase 1 : MVP Core (Semaines 1-2)
- ✅ Auth (client + vendeur hybride)
- ✅ Catalogue + Panier
- ✅ Commandes (création + statut)
- ✅ Admin simple (approbation)

### Phase 2 : Optimisation (Semaine 3)
- Notifications push
- Profil vendeur
- Reviews/Avis
- Cache local

### Phase 3 : Paiement & Scale (Semaine 4+)
- Intégration Stripe/Flutterwave
- Livraison (intégration avec API)
- Analytics
- Performance optimisation

---

## 10. Contraintes de Coût Firebase (Estimation)

### Pour 500 utilisateurs actifs/mois :

| Ressource | Estimation | Coût |
|-----------|-----------|------|
| **Reads** (catalogue, commandes) | 50K | 0,18 $ |
| **Writes** (commandes, profils) | 10K | 0,06 $ |
| **Storage** (photos produits/badges) | 1 GB | 0,18 $ |
| **Bandwidth** | 10 GB | 1 $ |
| **TOTAL/MOIS** | | ~1,42 $ |

**→ Quasi gratuit avec le tier Firebase free (quota quotidien suffisant pour MVP)**

---

## 11. Sécurité & Règles Firestore (Draft)

### Principes
- ✅ Clients ne lisent QUE les produits publiés
- ✅ Vendeurs lisent LEURS commandes uniquement
- ✅ Admin a accès complet
- ✅ Pas de lecture de mots de passe (Firebase Auth gère)

### Exemple Règle (détails en phase Analyse)
```
match /products/{document=**} {
  allow read: if true; // Tous lisent
  allow write: if request.auth.uid == resource.data.vendorId && request.auth.token.customClaims.vendor == true;
}

match /orders/{orderId} {
  allow read: if request.auth.uid == resource.data.clientId || request.auth.uid == resource.data.vendorId;
  allow write: if /* vendeur ou admin */;
}
```

---

## 12. Structure Dossiers Projet (Preview)
```
aubeshop/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup-client.tsx
│   │   ├── signup-vendor-email.tsx
│   │   ├── signup-vendor-badge.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx (home/catalogue)
│   │   ├── product/[id].tsx
│   │   ├── cart.tsx
│   │   ├── orders.tsx
│   ├── (vendor)/
│   │   ├── add-product.tsx
│   │   ├── vendor-orders.tsx
│   │   ├── vendor-profile.tsx
│   ├── (admin)/
│   │   ├── approve-vendors.tsx
│   │   ├── dashboard.tsx
├── components/
│   ├── ProductCard.tsx
│   ├── OrderCard.tsx
│   ├── VendorCard.tsx
│   ├── ... (UI réutilisables)
├── lib/
│   ├── firebase.config.ts
│   ├── firebaseService.ts
│   ├── authService.ts
│   ├── productService.ts
│   ├── orderService.ts
├── context/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
├── constants/
│   ├── colors.ts
│   ├── strings.ts
├── app.json
├── package.json
```

---

## 13. Cas d'Erreurs & Gestion

| Erreur | Gestion |
|--------|---------|
| Email déjà inscrit | Afficher message, proposer login/reset password |
| Photo badge > 5 MB | Rejeter, demander compression |
| Pas de connexion internet | Sauvegarder brouillon, sync quand connexion OK |
| Vendeur hors ligne lors commande | Notification queued, attente 24h avant annulation auto |
| Produit en rupture de stock | Retirer du catalogue, client notifié |

---

## 14. Success Criteria (KPIs)

- ✅ **Temps inscription** : < 2 min (client), < 5 min (vendeur auto), < 24h (vendeur badge)
- ✅ **Performance** : Catalogue charge en < 2 sec
- ✅ **Fiabilité** : 99.5% uptime Firebase
- ✅ **Adoption** : 50+ vendeurs vérifiés en 1 mois
- ✅ **Satisfaction** : Rating moyen 4.5/5

---

## 15. Next Steps

1. **Stéphane valide** cette spécification ✅
2. **Passage à phase Analyse** : Schéma Firestore détaillé + Règles de sécurité
3. **Passage à phase Conception** : Pseudo-code + Maquettes détaillées
4. **Passage à phase Codification** : Génération du code complet
5. **Passage à phase Traduction** : Build & Deploy

---

**Document Version** : 1.0  
**Date** : 17 novembre 2024  
**Auteur** : GitHub Copilot (Claude Haiku 4.5)  
**Statut** : ⏳ En attente de validation Stéphane
