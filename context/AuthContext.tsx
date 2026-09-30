/**
 * context/AuthContext.tsx
 * =======================
 * État d'authentification et profils métier.
 *
 * Deux apports par rapport à la v1 :
 *
 * - **Le document utilisateur est écouté en continu.** La v1 le lisait une
 *   fois à la connexion : quand un administrateur validait une candidature,
 *   le nouveau rôle n'apparaissait qu'au prochain démarrage. Ici le tableau
 *   de bord bascule immédiatement.
 * - **Les droits sont exposés sous forme de booléens dérivés** (`isVendor`,
 *   `isCourier`, `isAdmin`) plutôt que recalculés dans chaque écran.
 */

import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import * as AuthService from '@/lib/authService';
import { auth, firestore } from '@/lib/firebase.config';
import type {
  Address,
  Application,
  ApplicationInput,
  AuthContextValue,
  CourierProfile,
  SignUpInput,
  User,
  VendorProfile,
} from '@/types';
import { isVendorRole } from '@/types';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [courier, setCourier] = useState<CourierProfile | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);

  /** Désabonnement du document utilisateur, remplacé à chaque connexion. */
  const unsubscribeUser = useRef<(() => void) | null>(null);

  // --- Session ------------------------------------------------------------

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      unsubscribeUser.current?.();
      unsubscribeUser.current = null;

      if (!firebaseUser) {
        setUser(null);
        setVendor(null);
        setCourier(null);
        setApplication(null);
        setInitializing(false);
        return;
      }

      // Écoute continue : un changement de rôle décidé par un administrateur
      // se propage sans redémarrage de l'app.
      unsubscribeUser.current = onSnapshot(
        doc(firestore, 'users', firebaseUser.uid),
        (snap) => {
          setUser(snap.exists() ? ({ ...snap.data(), uid: snap.id } as User) : null);
          setInitializing(false);
        },
        () => {
          // Lecture refusée ou hors ligne : on ne bloque pas l'app sur un
          // écran de chargement infini.
          setUser(null);
          setInitializing(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser.current?.();
    };
  }, []);

  // --- Profils métier -----------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setVendor(null);
      setCourier(null);
      setApplication(null);
      return;
    }

    // Chaque profil n'est chargé que pour le rôle qui l'utilise.
    void (async () => {
      const [v, c, a] = await Promise.all([
        isVendorRole(user.role) ? AuthService.fetchVendorProfile(user.uid) : null,
        user.role === 'courier' ? AuthService.fetchCourierProfile(user.uid) : null,
        // La candidature intéresse aussi ceux qui n'ont pas encore de rôle :
        // c'est ce qui permet d'afficher « en attente d'examen ».
        AuthService.fetchApplication(user.uid).catch(() => null),
      ]);

      if (cancelled) return;
      setVendor(v);
      setCourier(c);
      setApplication(a);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- Actions ------------------------------------------------------------

  /** Enveloppe commune : drapeau `busy` et remontée d'erreur lisible. */
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      return await action();
    } catch (error) {
      throw new Error(AuthService.authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const signUp = useCallback(
    (input: SignUpInput) => run(() => AuthService.signUp(input)),
    [run]
  );

  const signIn = useCallback(
    (email: string, password: string) => run(() => AuthService.signIn(email, password)),
    [run]
  );

  const signOut = useCallback(() => run(() => AuthService.signOut()), [run]);

  const resetPassword = useCallback(
    (email: string) => run(() => AuthService.resetPassword(email)),
    [run]
  );

  const apply = useCallback(
    (input: ApplicationInput) =>
      run(async () => {
        if (!user) throw new Error('Connectez-vous pour candidater.');
        const created = await AuthService.submitApplication(user, input);
        setApplication(created);
      }),
    [run, user]
  );

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'displayName' | 'phone' | 'campus' | 'avatar'>>) =>
      run(async () => {
        if (!user) throw new Error('Non connecté.');
        // L'écoute du document reflétera la modification ; pas de setState ici.
        await AuthService.updateUserProfile(user.uid, patch);
      }),
    [run, user]
  );

  const saveAddress = useCallback(
    (address: Address) =>
      run(async () => {
        if (!user) throw new Error('Non connecté.');
        await AuthService.saveAddress(user.uid, user.addresses ?? [], address);
      }),
    [run, user]
  );

  const deleteAddress = useCallback(
    (addressId: string) =>
      run(async () => {
        if (!user) throw new Error('Non connecté.');
        await AuthService.deleteAddress(user.uid, user.addresses ?? [], addressId);
      }),
    [run, user]
  );

  // --- Valeur -------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      vendor,
      courier,
      application,
      initializing,
      busy,
      isAuthenticated: !!user,
      isVendor: isVendorRole(user?.role),
      isCourier: user?.role === 'courier',
      isAdmin: user?.role === 'admin',
      signUp,
      signIn,
      signOut,
      resetPassword,
      apply,
      updateProfile,
      saveAddress,
      deleteAddress,
    }),
    [
      user,
      vendor,
      courier,
      application,
      initializing,
      busy,
      signUp,
      signIn,
      signOut,
      resetPassword,
      apply,
      updateProfile,
      saveAddress,
      deleteAddress,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return context;
}
