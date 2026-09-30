/**
 * context/CartContext.tsx
 * =======================
 * Panier, persisté localement.
 *
 * Trois défauts de la v1 sont corrigés :
 *
 * 1. **Le panier était partagé entre comptes.** Une seule clé de stockage
 *    globale : si deux personnes utilisaient le même téléphone, la seconde
 *    héritait du panier de la première. La clé dépend désormais de l'`uid`.
 * 2. **Mutation directe de l'état.** `[...items]` est une copie de surface ;
 *    la v1 faisait `copie[i].quantity += n`, modifiant l'objet d'origine.
 *    Avec le compilateur React activé, le rendu pouvait ne pas se déclencher.
 * 3. **Total désynchronisé.** Il était stocké dans un `useState` alimenté à
 *    la main. Il est maintenant dérivé, donc toujours juste.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
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

import { useAuth } from '@/context/AuthContext';
import type { CartContextValue, CartGroup, CartLine } from '@/types';

/** Clé de stockage propre à un compte (ou à la session anonyme). */
function storageKey(uid: string | undefined): string {
  return `aubeshop.cart.${uid ?? 'guest'}`;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrating, setHydrating] = useState(true);

  /**
   * Clé réellement utilisée pour la dernière écriture. Évite d'enregistrer
   * le panier d'un compte sous la clé d'un autre pendant la bascule.
   */
  const activeKey = useRef(storageKey(undefined));

  // --- Chargement ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    const key = storageKey(uid);
    activeKey.current = key;
    setHydrating(true);

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (cancelled) return;
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        setLines(Array.isArray(parsed) ? parsed.filter(isCartLine) : []);
      } catch {
        // Données illisibles : on repart d'un panier vide plutôt que de
        // planter au démarrage.
        if (!cancelled) setLines([]);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // --- Persistance --------------------------------------------------------

  /** Applique un changement et l'enregistre dans la foulée. */
  const commit = useCallback(async (next: CartLine[]) => {
    setLines(next);
    try {
      await AsyncStorage.setItem(activeKey.current, JSON.stringify(next));
    } catch {
      // Le stockage peut être plein ou indisponible ; l'état en mémoire
      // reste correct pour la session en cours.
    }
  }, []);

  // --- Actions ------------------------------------------------------------

  const add = useCallback(
    async (line: Omit<CartLine, 'quantity'>, quantity = 1) => {
      const existing = lines.find((l) => l.productId === line.productId);
      const wanted = (existing?.quantity ?? 0) + Math.max(1, Math.trunc(quantity));
      // On ne dépasse jamais le stock connu ; il est revalidé au paiement.
      const capped = Math.min(wanted, Math.max(1, line.maxStock));

      const next = existing
        ? lines.map((l) =>
            l.productId === line.productId ? { ...l, ...line, quantity: capped } : l
          )
        : [...lines, { ...line, quantity: capped }];

      await commit(next);
    },
    [lines, commit]
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const target = Math.trunc(quantity);
      if (target <= 0) {
        await commit(lines.filter((l) => l.productId !== productId));
        return;
      }
      await commit(
        lines.map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.min(target, Math.max(1, l.maxStock)) }
            : l
        )
      );
    },
    [lines, commit]
  );

  const remove = useCallback(
    async (productId: string) => {
      await commit(lines.filter((l) => l.productId !== productId));
    },
    [lines, commit]
  );

  const clear = useCallback(async () => {
    setLines([]);
    try {
      await AsyncStorage.removeItem(activeKey.current);
    } catch {
      // Sans conséquence : l'état en mémoire est déjà vide.
    }
  }, []);

  const quantityOf = useCallback(
    (productId: string) => lines.find((l) => l.productId === productId)?.quantity ?? 0,
    [lines]
  );

  // --- Valeurs dérivées ---------------------------------------------------

  /**
   * Regroupement par vendeur : chaque groupe donnera une commande distincte,
   * et l'écran de paiement peut annoncer « 2 commandes, 2 vendeurs ».
   */
  const groups = useMemo<CartGroup[]>(() => {
    const byVendor = new Map<string, CartGroup>();

    for (const line of lines) {
      const group = byVendor.get(line.vendorId);
      if (group) {
        group.lines.push(line);
        group.subtotal += line.unitPrice * line.quantity;
      } else {
        byVendor.set(line.vendorId, {
          vendorId: line.vendorId,
          vendorName: line.vendorName,
          lines: [line],
          subtotal: line.unitPrice * line.quantity,
        });
      }
    }

    return Array.from(byVendor.values());
  }, [lines]);

  /** Somme des quantités — la v1 affichait le nombre de lignes. */
  const itemCount = useMemo(
    () => lines.reduce((total, line) => total + line.quantity, 0),
    [lines]
  );

  const subtotal = useMemo(
    () => lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    [lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      groups,
      itemCount,
      subtotal,
      hydrating,
      add,
      setQuantity,
      remove,
      clear,
      quantityOf,
    }),
    [lines, groups, itemCount, subtotal, hydrating, add, setQuantity, remove, clear, quantityOf]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart doit être utilisé dans CartProvider');
  return context;
}

/**
 * Filtre les entrées corrompues relues depuis le stockage : le format a pu
 * changer entre deux versions de l'app.
 */
function isCartLine(value: unknown): value is CartLine {
  const line = value as Partial<CartLine>;
  return (
    !!line &&
    typeof line.productId === 'string' &&
    typeof line.title === 'string' &&
    typeof line.unitPrice === 'number' &&
    typeof line.quantity === 'number' &&
    typeof line.vendorId === 'string'
  );
}
