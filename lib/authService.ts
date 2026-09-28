/**
 * lib/authService.ts
 * ==================
 * Service d'authentification - Gère inscription, connexion, et vérification
 * Commentaires en français
 */

import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { User, Vendor, VendorSignUpInput } from '../types/index';
import { auth, firestore } from './firebase.config';

/**
 * AuthService - Service centralisé pour l'authentification
 * Classe contenant toutes les opérations d'auth
 */
export class AuthService {
  /**
   * Inscription Client
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe (min 8 caractères)
   * @param displayName - Nom complet
   * @returns { uid } - UID de l'utilisateur créé
   */
  static async signUpClient(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ uid: string }> {
    try {
      // 1. Valider entrées
      if (!email || !password || !displayName) {
        throw new Error('Email, mot de passe et nom requis');
      }
      if (password.length < 8) {
        throw new Error('Le mot de passe doit avoir au moins 8 caractères');
      }

      // 2. Créer utilisateur Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // 3. Créer document utilisateur dans Firestore
      const userDocRef = doc(firestore, 'users', uid);
      const newUser: User = {
        uid,
        email,
        displayName,
        role: 'client',
        avatar: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      };

      await setDoc(userDocRef, newUser);

      // 4. Envoyer email de confirmation (optionnel)
      try {
        await sendEmailVerification(userCredential.user);
        console.log('✅ Email de confirmation envoyé');
      } catch (err) {
        console.warn('⚠️ Erreur envoi email confirmation:', err);
      }

      return { uid };
    } catch (error: any) {
      console.error('❌ Erreur inscription client:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Inscription Vendeur avec vérification
   * @param data - Données du vendeur
   * @returns { vendorId, status, message }
   */
  static async signUpVendor(
    data: VendorSignUpInput
  ): Promise<{ vendorId: string; status: string; message: string }> {
    try {
      // 1. Valider données
      if (!data.email || !data.password || !data.displayName) {
        throw new Error('Email, mot de passe et nom requis');
      }

      // 2. Créer utilisateur Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const uid = userCredential.user.uid;

      // 3. Déterminer méthode de vérification et statut initial
      let verificationStatus: 'pending' | 'approved' = 'pending';
      let approvedAt: number | undefined;

      if (data.verificationMethod === 'email' && data.universityEmail) {
        // Vérifier si email universitaire est autorisé
        const isValidEmail = await this.isValidUniversityEmail(
          data.universityEmail
        );
        if (isValidEmail) {
          verificationStatus = 'approved';
          approvedAt = Date.now();
        }
      }

      // 4. Créer document utilisateur
      const newUser: User = {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: 'vendor',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      };

      await setDoc(doc(firestore, 'users', uid), newUser);

      // 5. Créer document vendeur
      const vendorData: Vendor = {
        ...newUser,
        vendorId: uid,
        universityId: data.universityId,
        universityEmail: data.universityEmail || '',
        verificationMethod: data.verificationMethod,
        verificationStatus,
        verificationDate: approvedAt,
        bio: '',
        storeName: data.storeName,
        rating: 0,
        totalReviews: 0,
        totalSales: 0,
        commissionBalance: 0,
      };

      await setDoc(doc(firestore, 'vendors', uid), vendorData);

      // 6. Si badge upload, créer AdminApproval
      if (data.verificationMethod === 'badge' && data.badgeImage) {
        await addDoc(collection(firestore, 'adminApprovals'), {
          vendorId: uid,
          vendorName: data.displayName,
          vendorEmail: data.email,
          universityId: data.universityId,
          verificationMethod: 'badge',
          badgeUrl: data.badgeImage, // À adapter après upload Storage
          status: 'pending',
          submittedAt: Date.now(),
        });
      }

      const message =
        verificationStatus === 'approved'
          ? '✅ Bienvenue ! Votre compte vendeur est activé'
          : '⏳ Votre demande est en attente d\'approbation (24-48h)';

      return { vendorId: uid, status: verificationStatus, message };
    } catch (error: any) {
      console.error('❌ Erreur inscription vendeur:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Connexion utilisateur
   * @param email - Email
   * @param password - Mot de passe
   * @returns { uid, role }
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ uid: string; role: string }> {
    try {
      // 1. Authentifier avec Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // 2. Récupérer le rôle depuis Firestore
      const userDocRef = doc(firestore, 'users', uid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        throw new Error('Document utilisateur non trouvé');
      }

      const role = userSnapshot.data()?.role || 'client';

      // 3. Mettre à jour lastLogin
      await updateDoc(userDocRef, {
        updatedAt: Date.now(),
        'metadata.lastLogin': Date.now(),
      });

      return { uid, role };
    } catch (error: any) {
      console.error('❌ Erreur connexion:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Déconnexion utilisateur
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ Déconnexion réussie');
    } catch (error: any) {
      console.error('❌ Erreur déconnexion:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Réinitialiser mot de passe (envoi email)
   * @param email - Email de l'utilisateur
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Email de réinitialisation envoyé');
    } catch (error: any) {
      console.error('❌ Erreur réinitialisation:', error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Récupérer utilisateur actuel
   * @returns FirebaseUser ou null
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Vérifier si email universitaire est valide
   * @param universityEmail - Email université
   * @returns true si domaine autorisé
   */
  static async isValidUniversityEmail(universityEmail: string): Promise<boolean> {
    try {
      // Extraire domaine
      const domain = universityEmail.split('@')[1];
      if (!domain) return false;

      // Vérifier dans Firestore
      const domainsRef = collection(firestore, 'verificationDomains');
      const q = query(
        domainsRef,
        where('domain', '==', domain),
        where('isActive', '==', true),
        where('autoVerify', '==', true)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0;
    } catch (error) {
      console.error('❌ Erreur validation email:', error);
      return false;
    }
  }

  /**
   * Gérer les erreurs Firebase
   * @param error - Erreur Firebase
   * @returns Message d'erreur lisible
   */
  private static handleFirebaseError(error: any): Error {
    let message = 'Erreur inconnue';

    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Cet email est déjà utilisé';
          break;
        case 'auth/weak-password':
          message = 'Le mot de passe doit avoir au moins 8 caractères';
          break;
        case 'auth/invalid-email':
          message = 'Email invalide';
          break;
        case 'auth/user-not-found':
          message = 'Utilisateur non trouvé';
          break;
        case 'auth/wrong-password':
          message = 'Mot de passe incorrect';
          break;
        case 'auth/too-many-requests':
          message = 'Trop de tentatives. Réessayez plus tard';
          break;
        default:
          message = error.message || 'Erreur authentification';
      }
    }

    return new Error(message);
  }
}

export default AuthService;
