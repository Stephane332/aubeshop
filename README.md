# AubeShop

> Marketplace du campus de l'Université Aube Nouvelle — *« Achetez et vendez facilement sur le campus. »*

Application mobile et PWA permettant aux **étudiants** de vendre en tant que vendeurs vérifiés, aux **commerces partenaires** d'ouvrir une boutique, aux **livreurs** de prendre des courses, et à **tout le monde** d'acheter et de se faire livrer à Ouagadougou et Bobo-Dioulasso.

---

## Les cinq rôles

Chaque rôle a son propre tableau de bord et ses propres fonctions. Le rôle porte le droit : un candidat reste **client** tant que sa candidature n'est pas validée par un administrateur.

| Rôle | Vérification | Son tableau de bord |
|---|---|---|
| **Client** | Aucune | Catalogue, panier, commandes, suivi de livraison |
| **Vendeur étudiant** | Carte d'étudiant | Produits, commandes entrantes, revenus nets |
| **Vendeur partenaire** | Justificatif d'activité | Idem + fiche de son stand (emplacement, horaires) |
| **Livreur** | Pièce d'identité | Vivier de courses, parcours, gains |
| **Admin** | — | Validation des candidatures, statistiques, commissions |

## Modèle économique

- **Commission de 10 %** sur chaque vente, prélevée sur la part du vendeur (elle n'est pas ajoutée au prix payé par le client).
- **Livraison de 500 à 2 000 FCFA** selon la zone. Le livreur en perçoit 80 %.
- Devise : **XOF (franc CFA)**, en montants entiers — le franc CFA n'a pas de centimes en circulation.

## Stack

| | |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 · React Native 0.81 · expo-router |
| Langage | TypeScript (strict, 0 erreur) |
| Backend | Firebase — Auth, Firestore, Storage |
| Cibles | Android (APK), iOS, PWA installable |

---

## Démarrage

```bash
npm install
```

Copiez le modèle de configuration et renseignez vos clés Firebase :

```bash
cp .env.example .env
```

Les valeurs se trouvent dans **Firebase Console → Paramètres du projet → Vos applications (Web)**. Sans elles, l'application démarre et affiche un écran expliquant ce qui manque.

```bash
npm start
```

### Configuration Firebase

1. Créez un projet sur [console.firebase.google.com](https://console.firebase.google.com) et ajoutez-y une application Web.
2. Activez **Authentication** (Email/Mot de passe), **Firestore Database** et **Storage**.
3. Déployez les règles de sécurité et les index :

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Les index sont indispensables : sans eux, toute requête filtrée du catalogue échoue.

4. Pour créer le premier administrateur, passez manuellement `role` à `"admin"` sur son document dans `users` depuis la console Firebase.

### Essayer les cinq rôles sans rien saisir

Les émulateurs Firebase permettent de faire tourner l'application complète en local, sans projet ni données réelles :

```bash
npm run emulators
```

Puis, dans un second terminal :

```bash
npm run seed
```

Cela crée un compte par rôle, deux boutiques, huit produits, une candidature à valider et une commande en cours.

| Rôle | Email |
|---|---|
| Client | `client@aubeshop.test` |
| Vendeur étudiant | `etudiant@aubeshop.test` |
| Vendeur partenaire | `partenaire@aubeshop.test` |
| Livreur | `livreur@aubeshop.test` |
| Admin | `admin@aubeshop.test` |

Mot de passe commun : `aubeshop2026`. Ces comptes n'existent que dans l'émulateur.

---

## Scripts

```bash
npm start           # serveur de développement
npm run android     # ouvrir sur Android
npm run ios         # ouvrir sur iOS
npm run web         # ouvrir dans le navigateur
npm run build:web   # export statique de la PWA dans dist/
npm run serve:web   # servir la PWA construite sur localhost:8080
npm run apk         # construire un APK Android installable
npm run icons       # régénérer les icônes de marque
npm run emulators   # émulateurs Firebase (Auth, Firestore, Storage)
npm run seed        # jeu de données de démonstration dans les émulateurs
npm run typecheck   # vérification TypeScript
npm run lint        # linter
```

> Les scripts relèvent le tas de Node à 4 Go. Le bundle dépasse 2 200 modules et la limite de 2 Go par défaut provoque un `heap out of memory` sur une machine modeste.

## PWA

`npm run build:web` produit un site statique installable dans `dist/` : manifeste, service worker, icônes et icône *maskable*.

Le service worker sert le réseau en premier pour la navigation et le cache en premier pour les ressources statiques. **Les appels Firebase ne sont jamais mis en cache** : servir un stock périmé ferait commander un article déjà vendu.

Déployez `dist/` sur n'importe quel hébergeur statique (Firebase Hosting, Netlify, Vercel).

## APK Android

```bash
npm run apk
```

Le script génère le projet natif, écrit des réglages Gradle adaptés à la mémoire de la machine, compile, et dépose l'APK dans `build/`.

L'APK est signé avec la clé de débogage : il s'installe partout mais ne peut pas être publié sur le Play Store. Pour une publication, générez une clé de production :

```bash
keytool -genkeypair -v -keystore aubeshop.keystore -alias aubeshop -keyalg RSA -keysize 2048 -validity 10000
```

---

## Structure

```
app/                  Écrans (routage par fichiers)
  (tabs)/             Onglets, dont le contenu dépend du rôle
  auth/               Connexion, inscription, mot de passe oublié
  become/[kind]       Candidature vendeur ou livreur
  product/[id]        Fiche produit
  order/[id]          Détail et suivi d'une commande
  checkout.tsx        Tunnel de commande
  vendor/             Formulaire produit
  account/            Adresses de livraison
  +html.tsx           Enveloppe HTML et déclaration PWA

components/
  ui/                 Bibliothèque de composants (Screen, Button, Card…)
  home/               Tableaux de bord, un par rôle

context/              AuthContext, CartContext
lib/                  Services Firebase, monnaie, formatage
constants/theme.ts    Système de design — source de vérité unique
types/index.ts        Modèle de données
firestore.rules       Règles de sécurité Firestore
storage.rules         Règles de sécurité Storage
firestore.indexes.json
```

## Conventions

- **Aucune valeur visuelle en dur.** Couleurs, espacements, typographie et rayons viennent de `constants/theme.ts` via `useTheme()`.
- **Aucun montant formaté à la main.** Tout passe par `lib/money.ts`.
- **Toast pour informer, `confirm()` pour les actions irréversibles.** Jamais d'`Alert` pour une simple confirmation.
- **Les erreurs remontent.** Un service ne renvoie pas un tableau vide en cas d'échec : l'écran doit pouvoir distinguer « vide » de « cassé ».

## Documentation

| Document | Contenu |
|---|---|
| [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) | Périmètre fonctionnel initial |
| [CONCEPTION.md](CONCEPTION.md) | Architecture et choix de conception |
| [ANALYSE_FIRESTORE.md](ANALYSE_FIRESTORE.md) | Modèle de données Firestore |
| [GUIDE_DEMARRAGE.md](GUIDE_DEMARRAGE.md) | Installation détaillée |
| [DEPENDENCIES.md](DEPENDENCIES.md) | Rôle de chaque dépendance |

> Ces documents décrivent la conception d'origine. Le code a depuis évolué : cinq rôles au lieu de trois, devise XOF, et une commande par vendeur.

## État

Le socle est complet, compile sans erreur et passe le linter. Restent à faire :

- **Cloud Functions** — c'est la limite principale de l'architecture actuelle. Le stock est décrémenté par le client au moment de la commande ; les règles Firestore imposent que toute unité retirée du stock apparaisse dans `soldCount`, mais elles ne peuvent pas vérifier qu'une commande correspondante existe. Déplacer la création de commande dans une fonction serveur fermerait ce point et permettrait la validation automatique des emails universitaires.
- **Paiement en ligne** — Mobile Money et carte via Flutterwave. Seul le paiement à la livraison est actif.
- **Notifications push** — les notifications sont pour l'instant internes à l'application.
- **Reversement des commissions** — les écritures sont enregistrées, le règlement aux vendeurs est manuel.
- **Tests** — aucun pour le moment.
