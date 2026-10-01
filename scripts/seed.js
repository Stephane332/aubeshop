/**
 * scripts/seed.js
 * ===============
 * Remplit la base avec un jeu de données de démonstration : un compte par
 * rôle, des boutiques, des produits et une commande en cours.
 *
 * Cible par défaut les **émulateurs Firebase**, pas la production :
 *
 *   firebase emulators:start      (dans un terminal)
 *   node scripts/seed.js          (dans un autre)
 *
 * On passe par le SDK Admin parce que la graine doit écrire des choses
 * que les règles interdisent justement au client — attribuer le rôle
 * `admin`, par exemple. Contre un émulateur, le SDK Admin n'a besoin
 * d'aucune clé : il suffit des variables FIREBASE_*_EMULATOR_HOST.
 *
 * Pour viser un vrai projet (déconseillé hors développement), exportez
 * GOOGLE_APPLICATION_CREDENTIALS vers une clé de compte de service et
 * lancez avec --production. Cette clé est un secret : ne la commitez pas.
 */

const admin = require('firebase-admin');

const PRODUCTION = process.argv.includes('--production');
const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-aubeshop';

if (!PRODUCTION) {
  // Doit être défini AVANT initializeApp.
  process.env.FIRESTORE_EMULATOR_HOST ??= 'localhost:8082';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= 'localhost:9099';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= 'localhost:9199';
  console.log(`Cible : émulateurs (projet « ${PROJECT_ID} »)\n`);
} else {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      'GOOGLE_APPLICATION_CREDENTIALS doit pointer vers une clé de compte de service.'
    );
    process.exit(1);
  }
  console.log(`Cible : PROJET RÉEL « ${PROJECT_ID} »\n`);
}

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const auth = admin.auth();

const now = Date.now();
/** Décale un horodatage de n jours dans le passé. */
const daysAgo = (n) => now - n * 24 * 60 * 60 * 1000;

const PASSWORD = 'aubeshop2026';

// ============================================
// COMPTES
// ============================================

const ACCOUNTS = [
  {
    uid: 'seed-client',
    email: 'client@aubeshop.test',
    displayName: 'Awa Traoré',
    role: 'client',
    phone: '70112233',
    campus: 'Ouagadougou',
    addresses: [
      {
        id: 'addr-1',
        label: 'Cité U',
        district: 'Secteur 15',
        city: 'Ouagadougou',
        landmark: 'Bâtiment C, en face du restau U',
        zone: 'campus',
        phone: '70112233',
        isDefault: true,
      },
      {
        id: 'addr-2',
        label: 'Maison',
        district: 'Gounghin',
        city: 'Ouagadougou',
        landmark: 'À côté de la pharmacie du Nord',
        zone: 'city',
        phone: '70112233',
        isDefault: false,
      },
    ],
  },
  {
    uid: 'seed-student',
    email: 'etudiant@aubeshop.test',
    displayName: 'Boukary Sawadogo',
    role: 'student_vendor',
    phone: '70445566',
    campus: 'Ouagadougou',
  },
  {
    uid: 'seed-partner',
    email: 'partenaire@aubeshop.test',
    displayName: 'Fatimata Ouédraogo',
    role: 'partner_vendor',
    phone: '70778899',
    campus: 'Ouagadougou',
  },
  {
    uid: 'seed-courier',
    email: 'livreur@aubeshop.test',
    displayName: 'Issa Kaboré',
    role: 'courier',
    phone: '70334455',
    campus: 'Ouagadougou',
  },
  {
    uid: 'seed-admin',
    email: 'admin@aubeshop.test',
    displayName: 'Admin AubeShop',
    role: 'admin',
    phone: '70000000',
    campus: 'Ouagadougou',
  },
];

// ============================================
// BOUTIQUES
// ============================================

const VENDORS = [
  {
    uid: 'seed-student',
    kind: 'student',
    storeName: 'Chez Boukary',
    bio: 'Manuels de droit et d’économie, en bon état. Licence 3.',
    campus: 'Ouagadougou',
    pickupPoint: 'Hall du bâtiment A',
    pickupHours: 'Lun–Ven, 12h–14h',
    isOpen: true,
    rating: 4.6,
    reviewCount: 14,
    salesCount: 23,
    totalEarnings: 71_500,
  },
  {
    uid: 'seed-partner',
    kind: 'partner',
    storeName: 'Alimentation Fatimata',
    bio: 'Snacks, boissons et fournitures, juste à l’entrée du campus.',
    campus: 'Ouagadougou',
    pickupPoint: 'Stand n°4, entrée principale',
    pickupHours: 'Tous les jours, 7h–20h',
    stand: {
      location: 'Entrée principale, stand n°4',
      openingHours: '7h–20h, 7j/7',
      businessId: 'IFU00123456A',
    },
    isOpen: true,
    rating: 4.8,
    reviewCount: 52,
    salesCount: 180,
    totalEarnings: 412_000,
  },
];

// ============================================
// PRODUITS
// ============================================

/** Même découpage en mots-clés que lib/productService.ts. */
function keywords(...parts) {
  const words = parts
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);
  return Array.from(new Set(words)).slice(0, 30);
}

/** Photos libres de droits, pour que le catalogue ne soit pas vide. */
const PHOTO = (id, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format`;

const PRODUCTS = [
  {
    vendor: 'seed-student',
    title: 'Manuel de droit constitutionnel',
    description:
      'Édition 2024, utilisé un semestre. Quelques annotations au crayon, aucune page manquante.',
    price: 4500,
    category: 'books',
    stock: 2,
    images: [PHOTO('1544716278-ca5e3f4abd8c')],
    soldCount: 6,
    rating: 4.5,
    reviewCount: 4,
  },
  {
    vendor: 'seed-student',
    title: 'Calculatrice scientifique Casio',
    description: 'FX-92, fonctionne parfaitement. Housse incluse.',
    price: 8000,
    category: 'electronics',
    stock: 1,
    images: [PHOTO('1587145820266-a5951ee6f620')],
    soldCount: 3,
    rating: 5,
    reviewCount: 3,
  },
  {
    vendor: 'seed-student',
    title: 'Cours particuliers de comptabilité',
    description: 'Une heure, en présentiel sur le campus. Niveau L1 à L3.',
    price: 2500,
    category: 'services',
    stock: 20,
    images: [PHOTO('1434030216411-0b793f4b4173')],
    soldCount: 11,
    rating: 4.8,
    reviewCount: 7,
  },
  {
    vendor: 'seed-partner',
    title: 'Lot de 5 cahiers 200 pages',
    description: 'Grands carreaux, couverture rigide. Prix dégressif à partir de 3 lots.',
    price: 3000,
    category: 'supplies',
    stock: 48,
    images: [PHOTO('1531346878377-a5be20888e57')],
    soldCount: 64,
    rating: 4.7,
    reviewCount: 21,
  },
  {
    vendor: 'seed-partner',
    title: 'Thermos 1 litre',
    description: 'Garde le café chaud toute la matinée. Plusieurs coloris disponibles.',
    price: 6500,
    category: 'other',
    stock: 12,
    images: [PHOTO('1523362628745-0c100150b504')],
    soldCount: 18,
    rating: 4.4,
    reviewCount: 9,
  },
  {
    vendor: 'seed-partner',
    title: 'Clé USB 64 Go',
    description: 'USB 3.0, lecture rapide. Garantie 1 an.',
    price: 5500,
    category: 'electronics',
    stock: 0,
    images: [PHOTO('1618410320928-25228d811631')],
    soldCount: 31,
    rating: 4.6,
    reviewCount: 12,
  },
  {
    vendor: 'seed-partner',
    title: 'Sandwich poulet + boisson',
    description: 'Préparé le matin même. À retirer au stand entre 11h et 14h.',
    price: 1500,
    category: 'food',
    stock: 25,
    images: [PHOTO('1528735602780-2552fd46c7af')],
    soldCount: 142,
    rating: 4.9,
    reviewCount: 48,
  },
  {
    vendor: 'seed-student',
    title: 'Sac à dos étudiant',
    description: 'Compartiment ordinateur 15 pouces. Servi une année, très bon état.',
    price: 7000,
    category: 'fashion',
    stock: 1,
    images: [PHOTO('1553062407-98eeb64c6a62')],
    soldCount: 2,
    rating: 4.2,
    reviewCount: 2,
  },
];

// ============================================
// EXÉCUTION
// ============================================

async function upsertAccount(account) {
  const { uid, email, displayName } = account;

  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, { email, displayName, password: PASSWORD });
  } catch {
    await auth.createUser({ uid, email, displayName, password: PASSWORD, emailVerified: true });
  }

  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        uid,
        email,
        displayName,
        phone: account.phone,
        role: account.role,
        campus: account.campus,
        addresses: account.addresses ?? [],
        isBlocked: false,
        createdAt: daysAgo(30),
        updatedAt: now,
      },
      { merge: true }
    );
}

async function main() {
  console.log('Comptes…');
  for (const account of ACCOUNTS) {
    await upsertAccount(account);
    console.log(`  ${account.email}  (${account.role})`);
  }

  console.log('\nBoutiques…');
  for (const vendor of VENDORS) {
    await db
      .collection('vendors')
      .doc(vendor.uid)
      .set({ ...vendor, createdAt: daysAgo(25), updatedAt: now }, { merge: true });
    console.log(`  ${vendor.storeName}`);
  }

  console.log('\nLivreur…');
  await db.collection('couriers').doc('seed-courier').set(
    {
      uid: 'seed-courier',
      displayName: 'Issa Kaboré',
      phone: '70334455',
      campus: 'Ouagadougou',
      vehicle: 'motorbike',
      zones: ['campus', 'near', 'city'],
      isAvailable: true,
      rating: 4.9,
      reviewCount: 37,
      deliveryCount: 41,
      totalEarnings: 28_400,
      createdAt: daysAgo(20),
      updatedAt: now,
    },
    { merge: true }
  );
  console.log('  Issa Kaboré (moto, 3 zones)');

  console.log('\nProduits…');
  const vendorById = new Map(VENDORS.map((v) => [v.uid, v]));
  // Un lot : une seule aller-retour réseau plutôt qu'une par produit.
  const batch = db.batch();

  PRODUCTS.forEach((product, index) => {
    const vendor = vendorById.get(product.vendor);
    const ref = db.collection('products').doc(`seed-product-${index + 1}`);
    batch.set(ref, {
      vendorId: vendor.uid,
      vendorName: vendor.storeName,
      vendorKind: vendor.kind,
      vendorCampus: vendor.campus,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      images: product.images,
      stock: product.stock,
      status: 'active',
      keywords: keywords(product.title, product.description, vendor.storeName),
      rating: product.rating,
      reviewCount: product.reviewCount,
      soldCount: product.soldCount,
      createdAt: daysAgo(index + 1),
      updatedAt: now,
    });
  });

  await batch.commit();
  PRODUCTS.forEach((p) => console.log(`  ${p.title} — ${p.price} FCFA`));

  console.log('\nCandidature en attente…');
  await db.collection('applications').doc('seed-pending').set({
    uid: 'seed-pending',
    kind: 'student_vendor',
    status: 'pending',
    displayName: 'Salif Compaoré',
    email: 'salif@aubeshop.test',
    phone: '70556677',
    campus: 'Bobo-Dioulasso',
    method: 'student_card',
    documentUrl: PHOTO('1554224155-6726b3ff858f', 600),
    storeName: 'Librairie Salif',
    studentId: 'UAN2025014',
    submittedAt: daysAgo(1),
  });
  console.log('  Salif Compaoré — vendeur étudiant, à valider');

  console.log('\nCommande en cours…');
  const orderRef = db.collection('orders').doc('seed-order-1');
  await orderRef.set({
    groupId: 'seed-group-1',
    clientId: 'seed-client',
    clientName: 'Awa Traoré',
    clientPhone: '70112233',
    vendorId: 'seed-partner',
    vendorName: 'Alimentation Fatimata',
    lines: [
      {
        productId: 'seed-product-4',
        title: 'Lot de 5 cahiers 200 pages',
        image: PRODUCTS[3].images[0],
        unitPrice: 3000,
        quantity: 2,
      },
    ],
    pricing: {
      subtotal: 6000,
      shipping: 500,
      commission: 600,
      vendorPayout: 5400,
      courierPayout: 400,
      total: 6500,
    },
    status: 'preparing',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash_on_delivery',
    shippingMethod: 'delivery',
    address: ACCOUNTS[0].addresses[0],
    createdAt: daysAgo(0.1),
    timeline: { pending: daysAgo(0.1), accepted: daysAgo(0.08), preparing: daysAgo(0.05) },
    clientNote: 'Si possible avant 16h, merci !',
  });
  console.log('  #SEED-1 — en préparation, livraison campus');

  console.log('\n──────────────────────────────────────────');
  console.log('Comptes de démonstration (mot de passe commun) :\n');
  for (const account of ACCOUNTS) {
    console.log(`  ${account.role.padEnd(15)} ${account.email}`);
  }
  console.log(`\n  mot de passe : ${PASSWORD}`);
  console.log('──────────────────────────────────────────');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nÉchec de la graine :', error.message);
    if (!PRODUCTION) {
      console.error(
        '\nLes émulateurs tournent-ils ? Lancez « firebase emulators:start »\n' +
          'dans un autre terminal, puis relancez ce script.'
      );
    }
    process.exit(1);
  });
