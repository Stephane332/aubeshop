/**
 * context/AuthContext.tsx
 * =======================
 * Contexte global d'authentification
 * Gère l'état utilisateur, connexion, inscription
 * Commentaires en français
 */

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../lib/authService';
import { auth, firestore } from '../lib/firebase.config';
import { AuthContextType, User, VendorSignUpInput } from '../types/index';

/**
 * AuthContext - Contexte d'authentification
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Fournisseur de contexte authentification
 * À enrouler autour de l'app pour donner accès à useAuth()
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Écouter les changements d'authentification Firebase
   * Exécuté au démarrage de l'app et chaque fois que user.uid change
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Récupérer infos utilisateur depuis Firestore
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUser(userDocSnap.data() as User);
          } else {
            console.warn('⚠️ Document utilisateur non trouvé');
            setUser(null);
          }
        } else {
          // Utilisateur déconnecté
          setUser(null);
        }
        setError(null);
      } catch (err: any) {
        console.error('❌ Erreur chargement utilisateur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Inscription client
   */
  const signUpClient = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await AuthService.signUpClient(email, password, name);
      return result;
    } catch (err: any) {
      const message = err.message || 'Erreur inscription';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inscription vendeur
   */
  const signUpVendor = async (data: VendorSignUpInput) => {
    try {
      setLoading(true);
      setError(null);
      const result = await AuthService.signUpVendor(data);
      return result;
    } catch (err: any) {
      const message = err.message || 'Erreur inscription vendeur';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await AuthService.login(email, password);
      return result;
    } catch (err: any) {
      const message = err.message || 'Erreur connexion';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Réinitialiser mot de passe
   */
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.resetPassword(email);
    } catch (err: any) {
      const message = err.message || 'Erreur réinitialisation';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    currentUser: user, // Alias pour compatibilité
    loading,
    error,
    signUpClient,
    signUpVendor,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook pour accéder au contexte authentification
 * À utiliser dans n'importe quel composant
 * @returns AuthContextType
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}

export default AuthContext;
