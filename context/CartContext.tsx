/**
 * context/CartContext.tsx
 * =======================
 * Contexte global du panier
 * Stocké localement en AsyncStorage (pas Firestore pour économiser)
 * Commentaires en français
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartContextType, CartItem } from '../types/index';

const CART_STORAGE_KEY = 'aubeshop_cart';

/**
 * CartContext - Contexte panier
 */
const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
}

/**
 * CartProvider - Fournisseur de contexte panier
 * À enrouler autour de l'app pour donner accès à useCart()
 */
export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  /**
   * Charger panier depuis AsyncStorage au démarrage
   */
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart) as CartItem[];
          setItems(parsedCart);
          calculateTotal(parsedCart);
          console.log('✅ Panier chargé:', parsedCart.length, 'produits');
        }
      } catch (error) {
        console.error('❌ Erreur chargement panier:', error);
      }
    };

    loadCart();
  }, []);

  /**
   * Calculer le total du panier
   */
  const calculateTotal = (cartItems: CartItem[]) => {
    const sum = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    // Arrondir à 2 décimales
    setTotal(Math.round(sum * 100) / 100);
  };

  /**
   * Persister panier en AsyncStorage
   */
  const persistCart = async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('❌ Erreur sauvegarde panier:', error);
    }
  };

  /**
   * Ajouter produit au panier
   */
  const addItem = async (item: CartItem) => {
    try {
      // Vérifier si produit existe déjà
      const existingIndex = items.findIndex((i) => i.productId === item.productId);

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Augmenter quantité si déjà dans panier
        newItems = [...items];
        newItems[existingIndex].quantity += item.quantity;
      } else {
        // Ajouter nouveau produit
        newItems = [...items, item];
      }

      setItems(newItems);
      calculateTotal(newItems);
      await persistCart(newItems);

      console.log('✅ Produit ajouté au panier');
    } catch (error) {
      console.error('❌ Erreur ajout produit:', error);
    }
  };

  /**
   * Retirer produit du panier
   */
  const removeItem = async (productId: string) => {
    try {
      const newItems = items.filter((i) => i.productId !== productId);
      setItems(newItems);
      calculateTotal(newItems);
      await persistCart(newItems);

      console.log('✅ Produit retiré du panier');
    } catch (error) {
      console.error('❌ Erreur retrait produit:', error);
    }
  };

  /**
   * Mettre à jour la quantité d'un produit
   */
  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        // Si quantité ≤ 0, retirer le produit
        await removeItem(productId);
        return;
      }

      const newItems = items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );

      setItems(newItems);
      calculateTotal(newItems);
      await persistCart(newItems);

      console.log('✅ Quantité mise à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour quantité:', error);
    }
  };

  /**
   * Vider le panier
   */
  const clearCart = async () => {
    try {
      setItems([]);
      setTotal(0);
      await AsyncStorage.removeItem(CART_STORAGE_KEY);

      console.log('✅ Panier vidé');
    } catch (error) {
      console.error('❌ Erreur vidage panier:', error);
    }
  };

  const value: CartContextType = {
    items,
    cartItems: items, // Alias pour compatibilité
    itemCount: items.length,
    total,
    addItem,
    addToCart: (product, quantity) => {
      const item: CartItem = {
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
        image: product.images?.[0]?.url || '',
        vendorId: product.vendorId,
      };
      return addItem(item);
    },
    removeItem,
    removeFromCart: removeItem,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * useCart - Hook pour accéder au contexte panier
 * À utiliser dans n'importe quel composant
 * @returns CartContextType
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé dans CartProvider');
  }
  return context;
}

export default CartContext;
