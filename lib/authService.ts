/**
 * lib/authService.ts
 * ==================
 * Comptes, candidatures et profils métier.
 *
 * Changement de fond par rapport à la v1 : **le rôle n'est accordé qu'après
 * validation**. La v1 écrivait `role: 'vendor'` dès l'inscription, sans
 * attendre la vérification — un vendeur non approuvé disposait donc de tous
 * les droits de vente, ce qui vidait de son sens le contrôle du statut
 * étudiant, c'est-à-dire la raison d'être d'AubeShop.
 *
 * Ici, un candidat reste `client` et possède une `Application` ouverte. Un
 * administrateur la valide, ce qui bascule le rôle et crée le profil métier.
 */

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import type {
  Address,
  Application,
  ApplicationInput,
  Campus,
  CourierProfile,
  SignUpInput,
  User,
  UserRole,
  VendorProfile,
} from '@/types';
import { ROLE_FOR_APPLICATION } from '@/types';
import { auth, firestore } from './firebase.config';
import { uploadImage } from './uploadService';

// ============================================
// ERREURS
// ============================================

/** Traduit les codes Firebase en messages affichables tels quels. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/invalid-email': "Cette adresse email n'est pas valide.",
    'auth/weak-password': 'Le mot de passe doit contenir au moins 8 caractères.',
    'auth/user-not-found': 'Aucun compte ne correspond à cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    // Firebase renvoie ce code générique depuis l'activation de la protection
    // contre l'énumération de comptes : il couvre email inconnu ET mauvais
    // mot de passe, d'où la formulation volontairement vague.
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
    'auth/network-request-failed': 'Connexion impossible. Vérifiez votre réseau.',
    'permission-denied': "Vous n'avez pas les droits pour cette action.",
  };

  if (messages[code]) return messages[code];
  const message = (error as { message?: string })?.message;
  return message && !message.includes('Firebase') ? message : 'Une erreur est survenue.';
}

// ============================================
// LECTURE
// ============================================

export async function fetchUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(firestore, 'users', uid));
  return snap.exists() ? ({ ...snap.data(), uid } as User) : null;
}

export async function fetchVendorProfile(uid: string): Promise<VendorProfile | null> {
  const snap = await getDoc(doc(firestore, 'vendors', uid));
  return snap.exists() ? ({ ...snap.data(), uid } as VendorProfile) : null;
}

export async function fetchCourierProfile(uid: string): Promise<CourierProfile | null> {
  const snap = await getDoc(doc(firestore, 'couriers', uid));
  return snap.exists() ? ({ ...snap.data(), uid } as CourierProfile) : null;
}

export async function fetchApplication(uid: string): Promise<Application | null> {
  const snap = await getDoc(doc(firestore, 'applications', uid));
  return snap.exists() ? ({ ...snap.data(), uid } as Application) : null;
}

// ============================================
// INSCRIPTION & CONNEXION
// ============================================

/**
 * Crée un compte. Tout nouveau venu est `client` : devenir vendeur ou
 * livreur passe ensuite par une candidature.
 */
export async function signUp(input: SignUpInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (input.password.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
  }
  if (!displayName) {
    throw new Error('Votre nom est requis.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, input.password);
  const { uid } = credential.user;

  // Renseigne le nom côté Auth : utile pour les emails transactionnels.
  await fbUpdateProfile(credential.user, { displayName }).catch(() => {});

  const now = Date.now();
  const user: User = {
    uid,
    email,
    displayName,
    phone: input.phone?.trim() || undefined,
    role: 'client',
    campus: input.campus,
    addresses: [],
    isBlocked: false,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(firestore, 'users', uid), stripUndefined(user));

  // La vérification d'email conditionne la validation automatique d'une
  // future candidature étudiante : on la lance dès maintenant. Un échec
  // d'envoi ne doit pas faire échouer l'inscription.
  void sendEmailVerification(credential.user).catch(() => {});
}

export async function signIn(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = await fetchUser(credential.user.uid);
  if (user?.isBlocked) {
    await fbSignOut(auth);
    throw new Error('Ce compte a été suspendu. Contactez le support AubeShop.');
  }
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

// ============================================
// PROFIL
// ============================================

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<User, 'displayName' | 'phone' | 'campus' | 'avatar'>>
): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), {
    ...stripUndefined(patch),
    updatedAt: Date.now(),
  });
}

/**
 * Ajoute ou remplace une adresse.
 *
 * Écrit le tableau complet plutôt qu'un `arrayUnion` : il faut pouvoir
 * modifier une adresse existante et garantir qu'une seule porte `isDefault`.
 */
export async function saveAddress(
  uid: string,
  addresses: Address[],
  address: Address
): Promise<Address[]> {
  const index = addresses.findIndex((a) => a.id === address.id);
  const next = index >= 0
    ? addresses.map((a) => (a.id === address.id ? address : a))
    : [...addresses, address];

  // La toute première adresse devient l'adresse par défaut d'office.
  const normalized = next.map((a) => ({
    ...a,
    isDefault: next.length === 1 ? true : address.isDefault ? a.id === address.id : a.isDefault,
  }));

  await updateDoc(doc(firestore, 'users', uid), {
    addresses: normalized,
    updatedAt: Date.now(),
  });
  return normalized;
}

export async function deleteAddress(
  uid: string,
  addresses: Address[],
  addressId: string
): Promise<Address[]> {
  const next = addresses.filter((a) => a.id !== addressId);
  // Si on vient de supprimer l'adresse par défaut, la première reprend le rôle.
  if (next.length > 0 && !next.some((a) => a.isDefault)) {
    next[0] = { ...next[0], isDefault: true };
  }

  await updateDoc(doc(firestore, 'users', uid), {
    addresses: next,
    updatedAt: Date.now(),
  });
  return next;
}

// ============================================
// CANDIDATURES
// ============================================

/**
 * Dépose une candidature vendeur ou livreur.
 *
 * Le justificatif part vers Storage **avant** l'écriture du document : on
 * n'enregistre jamais une URI locale, contrairement à la v1 où le badge
 * étudiant pointait vers le téléphone du candidat.
 */
export async function submitApplication(
  user: User,
  input: ApplicationInput
): Promise<Application> {
  const existing = await fetchApplication(user.uid);
  if (existing?.status === 'pending') {
    throw new Error('Vous avez déjà une candidature en cours d’examen.');
  }
  if (existing?.status === 'approved') {
    throw new Error('Votre candidature a déjà été acceptée.');
  }

  let documentUrl: string | undefined;
  if (input.documentImage) {
    documentUrl = await uploadImage(input.documentImage, `applications/${user.uid}`);
  }

  if (input.method === 'university_email' && !input.universityEmail) {
    throw new Error('Renseignez votre email universitaire.');
  }
  if (input.method !== 'university_email' && !documentUrl) {
    throw new Error('Un justificatif est requis.');
  }

  const application: Application = {
    uid: user.uid,
    kind: input.kind,
    status: 'pending',
    displayName: user.displayName,
    email: user.email,
    phone: input.phone,
    campus: input.campus,
    method: input.method,
    documentUrl,
    universityEmail: input.universityEmail?.trim().toLowerCase(),
    storeName: input.storeName?.trim(),
    studentId: input.studentId?.trim(),
    businessId: input.businessId?.trim(),
    standLocation: input.standLocation?.trim(),
    vehicle: input.vehicle,
    zones: input.zones,
    submittedAt: Date.now(),
  };

  await setDoc(doc(firestore, 'applications', user.uid), stripUndefined(application));
  return application;
}

/**
 * Valide une candidature : bascule le rôle et crée le profil métier.
 *
 * Réservé aux administrateurs, ce que les règles Firestore imposent — la v1
 * se contentait de masquer le bouton dans l'écran de profil, si bien que
 * n'importe quel client connecté pouvait atteindre `/admin` et approuver
 * des vendeurs.
 */
export async function approveApplication(
  application: Application,
  reviewerUid: string
): Promise<void> {
  const role: UserRole = ROLE_FOR_APPLICATION[application.kind];
  const now = Date.now();

  if (application.kind === 'courier') {
    const profile: CourierProfile = {
      uid: application.uid,
      displayName: application.displayName,
      phone: application.phone,
      campus: application.campus,
      vehicle: application.vehicle ?? 'motorbike',
      zones: application.zones ?? ['campus'],
      isAvailable: false,
      rating: 0,
      reviewCount: 0,
      deliveryCount: 0,
      totalEarnings: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(firestore, 'couriers', application.uid), stripUndefined(profile));
  } else {
    const profile: VendorProfile = {
      uid: application.uid,
      kind: application.kind === 'partner_vendor' ? 'partner' : 'student',
      storeName: application.storeName || application.displayName,
      bio: '',
      campus: application.campus,
      stand:
        application.kind === 'partner_vendor'
          ? {
              location: application.standLocation ?? '',
              openingHours: '',
              businessId: application.businessId,
            }
          : undefined,
      isOpen: true,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      totalEarnings: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(firestore, 'vendors', application.uid), stripUndefined(profile));
  }

  await updateDoc(doc(firestore, 'users', application.uid), { role, updatedAt: now });
  await updateDoc(doc(firestore, 'applications', application.uid), {
    status: 'approved',
    reviewedAt: now,
    reviewedBy: reviewerUid,
  });
}

/** Refuse une candidature. Le motif est communiqué au candidat. */
export async function rejectApplication(
  uid: string,
  reviewerUid: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(firestore, 'applications', uid), {
    status: 'rejected',
    reviewedAt: Date.now(),
    reviewedBy: reviewerUid,
    rejectionReason: reason,
  });
}

// ============================================
// OUTILS
// ============================================

/**
 * Retire les clés `undefined` : Firestore les rejette, là où il accepte
 * `null`. Évite un « Unsupported field value: undefined » à l'écriture d'un
 * champ optionnel non renseigné.
 */
export function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as T;
}

/** Marqueur d'horodatage serveur, pour les champs qui n'ont pas à être devinés. */
export { serverTimestamp };

/** Libellé lisible d'un campus, avec repli. */
export function campusLabel(campus: Campus | undefined): string {
  return campus ?? 'Campus non précisé';
}
