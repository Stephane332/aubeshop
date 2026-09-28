# AubeShop — CONCEPTION : Pseudo-Code & Architecture

## 1. Architecture Dossiers Projet

```
aubeshop/
├── app/
│   ├── _layout.tsx                    # Root layout navigation
│   ├── (auth)/
│   │   ├── _layout.tsx                # Auth stack layout
│   │   ├── login.tsx                  # Écran connexion
│   │   ├── signup-client.tsx          # Inscription client
│   │   ├── signup-vendor.tsx          # Inscription vendeur (avec vérif)
│   │   ├── verify-email.tsx           # Vérification email (confirmation)
│   │   └── verify-badge.tsx           # Vérification badge (attente admin)
│   ├── (app)/
│   │   ├── _layout.tsx                # App tabs layout
│   │   ├── index.tsx                  # Home / Catalogue
│   │   ├── product/
│   │   │   └── [id].tsx               # Détail produit
│   │   ├── cart.tsx                   # Panier
│   │   ├── checkout.tsx               # Checkout & paiement
│   │   └── orders.tsx                 # Historique commandes
│   ├── (vendor)/
│   │   ├── _layout.tsx                # Vendor tabs
│   │   ├── add-product.tsx            # Ajouter produit
│   │   ├── products.tsx               # Liste ses produits
│   │   ├── orders-vendor.tsx          # Commandes reçues
│   │   └── profile-vendor.tsx         # Profil vendeur
│   ├── (admin)/
│   │   ├── _layout.tsx                # Admin tabs
│   │   ├── approve-vendors.tsx        # Approbation vendeurs
│   │   ├── dashboard.tsx              # Stats admin
│   │   └── manage-content.tsx         # Gestion catégories
│   └── not-found.tsx                  # 404 screen
├── components/
│   ├── ProductCard.tsx                # Composant carte produit
│   ├── OrderCard.tsx                  # Composant carte commande
│   ├── VendorCard.tsx                 # Composant carte vendeur
│   ├── CartItem.tsx                   # Composant item panier
│   ├── NotificationBadge.tsx          # Badge notifications
│   ├── LoadingSpinner.tsx             # Spinner chargement
│   ├── ErrorMessage.tsx               # Composant erreur
│   └── BottomSheet.tsx                # Bottom sheet modal
├── lib/
│   ├── firebase.config.ts             # Configuration Firebase
│   ├── firebaseService.ts             # Service Firestore
│   ├── authService.ts                 # Service authentification
│   ├── productService.ts              # Service produits
│   ├── orderService.ts                # Service commandes
│   ├── storageService.ts              # Service Firebase Storage
│   ├── notificationService.ts         # Service notifications
│   ├── utils.ts                       # Utilitaires (dates, format, etc.)
│   └── constants.ts                   # Constantes globales
├── context/
│   ├── AuthContext.tsx                # Contexte authentification
│   ├── CartContext.tsx                # Contexte panier
│   ├── NotificationContext.tsx        # Contexte notifications
│   └── UserContext.tsx                # Contexte utilisateur global
├── hooks/
│   ├── useAuth.ts                     # Hook authentification
│   ├── useCart.ts                     # Hook panier
│   ├── useNotifications.ts            # Hook notifications
│   ├── useUser.ts                     # Hook user data
│   └── usePagination.ts               # Hook pagination
├── types/
│   ├── index.ts                       # TypeScript types globaux
│   ├── auth.ts                        # Types authentification
│   ├── product.ts                     # Types produits
│   ├── order.ts                       # Types commandes
│   ├── user.ts                        # Types utilisateur
│   └── api.ts                         # Types API responses
├── constants/
│   ├── colors.ts                      # Palette couleurs (rouge/noir/blanc)
│   ├── strings.ts                     # Strings UI (i18n ready)
│   ├── theme.ts                       # Thème global
│   ├── routes.ts                      # Routes constantes
│   └── config.ts                      # Configuration app
├── __tests__/
│   ├── auth.test.ts
│   ├── product.test.ts
│   ├── order.test.ts
│   └── utils.test.ts
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── placeholder.png
│   │   └── ...
│   ├── animations/
│   │   ├── loading.json
│   │   ├── success.json
│   │   └── error.json
│   └── fonts/
│       ├── Roboto-Regular.ttf
│       └── Roboto-Bold.ttf
├── app.json                           # Config Expo
├── package.json                       # Dépendances
├── tsconfig.json                      # Config TypeScript
├── .babelrc                           # Config Babel
├── jest.config.js                     # Config Jest
├── jest.setup.js                      # Jest setup
├── .env.example                       # Template variables env
├── .env                               # Variables env (Firebase keys)
├── .gitignore                         # Git ignore
├── README.md                          # Documentation projet
└── CAHIER_DES_CHARGES.md             # Spécification (ce fichier)
```

---

## 2. Pseudo-Code Fonctions Principales

### 2.1 Service d'Authentification (authService.ts)

```typescript
// ============================================
// AUTH SERVICE - Pseudo-code
// ============================================

class AuthService {
  
  /**
   * Inscription Client
   * Entrée : email, password, displayName
   * Sortie : { success, uid, error }
   * Logique :
   *   1. Valider email + password (regex)
   *   2. Créer user Firebase Auth
   *   3. Créer document users/{uid} en Firestore (role: 'client')
   *   4. Envoyer email de confirmation
   *   5. Retourner uid
   */
  async signUpClient(email: string, password: string, name: string) {
    // 1. Validation
    if (!isValidEmail(email)) throw Error("Email invalide");
    if (password.length < 8) throw Error("Password trop court");
    
    // 2. Créer user Auth
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    
    // 3. Créer document Firestore
    await setDoc(doc(firestore, 'users', uid), {
      uid,
      email,
      displayName: name,
      role: 'client',
      avatar: null,
      createdAt: Date.now(),
      isActive: true
    });
    
    // 4. Envoyer email confirmation
    await sendEmailVerification(userCred.user);
    
    return { success: true, uid };
  }

  /**
   * Inscription Vendeur avec Vérification Email Université
   * Entrée : email, password, name, universityEmail
   * Sortie : { success, verificationStatus, message }
   * Logique :
   *   1. Vérifier email universitaire (domaine @aube.edu.fr)
   *   2. Créer user Auth
   *   3. Créer doc vendors/{uid} avec status 'pending' si email auto-vérif, 'approved' si OK
   *   4. Envoyer notification
   */
  async signUpVendor(
    email: string, 
    password: string, 
    name: string, 
    universityEmail: string
  ) {
    // 1. Vérifier domaine email
    const isUniversityEmail = await validateUniversityEmail(universityEmail);
    if (!isUniversityEmail) throw Error("Email universitaire non autorisé");
    
    // 2. Créer user Auth
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    
    // 3. Créer doc vendeur
    const verificationStatus = isUniversityEmail ? 'approved' : 'pending';
    await setDoc(doc(firestore, 'vendors', uid), {
      vendorId: uid,
      userId: uid,
      universityEmail,
      verificationStatus,
      verificationMethod: 'email',
      approvedAt: isUniversityEmail ? Date.now() : null,
      bio: '',
      storeName: name,
      rating: 0,
      totalReviews: 0,
      totalSales: 0,
      commissionBalance: 0,
      createdAt: Date.now()
    });
    
    // 4. Aussi créer user document
    await setDoc(doc(firestore, 'users', uid), {
      uid,
      email,
      displayName: name,
      role: 'vendor',
      createdAt: Date.now()
    });
    
    return { 
      success: true, 
      verificationStatus,
      message: verificationStatus === 'approved' 
        ? "Bienvenue vendeur !" 
        : "Demande en attente d'approbation"
    };
  }

  /**
   * Inscription Vendeur avec Badge (Approbation Manuelle)
   * Entrée : email, password, name, universityId, badgeImageUri
   * Sortie : { success, approvalId }
   * Logique :
   *   1. Upload badge photo → Firebase Storage
   *   2. Créer AdminApprovals/{approvalId}
   *   3. Statut vendeur = 'pending_approval'
   *   4. Notifier admin
   */
  async signUpVendorWithBadge(
    email: string,
    password: string,
    name: string,
    universityId: string,
    badgeImageUri: string
  ) {
    // 1. Upload badge
    const badgeUrl = await uploadBadgeImage(uid, badgeImageUri);
    
    // 2. Créer user + vendeur doc
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    
    await setDoc(doc(firestore, 'users', uid), {
      uid, email, displayName: name, role: 'vendor', createdAt: Date.now()
    });
    
    await setDoc(doc(firestore, 'vendors', uid), {
      vendorId: uid, universityId, verificationStatus: 'pending',
      verificationMethod: 'badge', badgeUpload: { storageUrl: badgeUrl },
      createdAt: Date.now()
    });
    
    // 3. Créer AdminApprovals
    const approvalRef = await addDoc(collection(firestore, 'adminApprovals'), {
      vendorId: uid,
      badgeUrl,
      status: 'pending',
      submittedAt: Date.now()
    });
    
    // 4. Notifier admin (via notification ou email)
    console.log("Admin notifié de la demande", approvalRef.id);
    
    return { success: true, approvalId: approvalRef.id };
  }

  /**
   * Connexion
   * Entrée : email, password
   * Sortie : { success, uid, role }
   */
  async login(email: string, password: string) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    const role = userDoc.data()?.role || 'client';
    
    return { success: true, uid, role };
  }

  /**
   * Déconnexion
   */
  async logout() {
    await signOut(auth);
    return { success: true };
  }

  /**
   * Obtenir utilisateur actuel
   */
  getCurrentUser() {
    return auth.currentUser; // Firebase Auth hook
  }
}
```

---

### 2.2 Service Produits (productService.ts)

```typescript
// ============================================
// PRODUCT SERVICE - Pseudo-code
// ============================================

class ProductService {
  
  /**
   * Créer Produit (Vendeur)
   * Entrée : vendorId, { title, description, price, stock, category, images[] }
   * Sortie : { success, productId }
   * Logique :
   *   1. Vérifier vendeur vérifié
   *   2. Upload images → Firebase Storage
   *   3. Créer doc products/{productId} en Firestore
   *   4. Retourner productId
   */
  async createProduct(vendorId: string, productData: ProductInput) {
    // 1. Vérifier vendeur
    const vendorDoc = await getDoc(doc(firestore, 'vendors', vendorId));
    if (vendorDoc.data().verificationStatus !== 'approved') {
      throw Error("Vendeur non vérifié");
    }
    
    // 2. Upload images
    const imageUrls = [];
    for (let i = 0; i < productData.images.length; i++) {
      const url = await uploadProductImage(vendorId, productData.images[i], i);
      imageUrls.push({ url, order: i + 1 });
    }
    
    // 3. Créer doc produit
    const productRef = await addDoc(collection(firestore, 'products'), {
      vendorId,
      title: productData.title,
      description: productData.description,
      price: productData.price,
      currency: 'EUR',
      category: productData.category,
      stock: { total: productData.stock, available: productData.stock, reserved: 0 },
      images: imageUrls,
      rating: 0,
      reviews: 0,
      isActive: true,
      createdAt: Date.now(),
      lastModifiedBy: vendorId
    });
    
    return { success: true, productId: productRef.id };
  }

  /**
   * Récupérer catalogue (avec pagination)
   * Entrée : category?, sortBy?, pageSize = 20
   * Sortie : { products[], hasMore, lastDoc }
   * Logique :
   *   1. Construire query Firestore (category + isActive filter)
   *   2. Limiter à pageSize
   *   3. Retourner produits + lastDoc pour pagination
   */
  async getCatalog(options: CatalogOptions = {}) {
    let q = query(
      collection(firestore, 'products'),
      where('isActive', '==', true)
    );
    
    if (options.category) {
      q = query(q, where('category', '==', options.category));
    }
    
    if (options.sortBy === 'price-asc') {
      q = query(q, orderBy('price', 'asc'));
    } else if (options.sortBy === 'price-desc') {
      q = query(q, orderBy('price', 'desc'));
    } else if (options.sortBy === 'rating') {
      q = query(q, orderBy('rating', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    
    q = query(q, limit(options.pageSize || 20));
    
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const hasMore = snapshot.docs.length === (options.pageSize || 20);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { products, hasMore, lastDoc };
  }

  /**
   * Récupérer détail produit
   * Entrée : productId
   * Sortie : Product
   */
  async getProduct(productId: string) {
    const productDoc = await getDoc(doc(firestore, 'products', productId));
    if (!productDoc.exists()) throw Error("Produit non trouvé");
    return { id: productDoc.id, ...productDoc.data() };
  }

  /**
   * Mettre à jour produit (Vendeur)
   * Entrée : vendorId, productId, updatedData
   * Sortie : { success }
   */
  async updateProduct(vendorId: string, productId: string, updates: Partial<ProductInput>) {
    const productRef = doc(firestore, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.data().vendorId !== vendorId) {
      throw Error("Non autorisé");
    }
    
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Date.now(),
      lastModifiedBy: vendorId
    });
    
    return { success: true };
  }

  /**
   * Supprimer produit (Vendeur)
   * Entrée : vendorId, productId
   * Sortie : { success }
   * Logique :
   *   1. Vérifier propriété (vendorId)
   *   2. Supprimer images → Storage
   *   3. Supprimer doc produit
   */
  async deleteProduct(vendorId: string, productId: string) {
    const productDoc = await getDoc(doc(firestore, 'products', productId));
    
    if (productDoc.data().vendorId !== vendorId) {
      throw Error("Non autorisé");
    }
    
    // Supprimer images
    for (let img of productDoc.data().images) {
      await deleteFile(img.url);
    }
    
    // Supprimer doc
    await deleteDoc(doc(firestore, 'products', productId));
    
    return { success: true };
  }
}
```

---

### 2.3 Service Commandes (orderService.ts)

```typescript
// ============================================
// ORDER SERVICE - Pseudo-code
// ============================================

class OrderService {
  
  /**
   * Créer Commande (Checkout)
   * Entrée : clientId, { items[], shippingInfo, paymentMethod }
   * Sortie : { success, orderId, paymentUrl }
   * Logique :
   *   1. Valider panier (produits existent, stock suffisant)
   *   2. Calculer prix total + commission (10%)
   *   3. Créer doc orders/{orderId}
   *   4. Décrémenter stock produits
   *   5. Retourner orderId + URL paiement
   */
  async createOrder(clientId: string, orderInput: OrderInput) {
    // 1. Valider items
    let total = 0, commission = 0;
    for (let item of orderInput.items) {
      const prod = await this.getProduct(item.productId);
      
      if (prod.stock.available < item.quantity) {
        throw Error(`Stock insuffisant pour ${prod.title}`);
      }
      
      total += prod.price * item.quantity;
    }
    
    commission = Math.round(total * 0.1 * 100) / 100; // 10%
    
    // 2. Créer ordre
    const orderRef = await addDoc(collection(firestore, 'orders'), {
      clientId,
      vendorId: orderInput.items[0].vendorId, // Supposé 1 vendeur par commande
      items: orderInput.items,
      pricing: {
        subtotal: total,
        shipping: orderInput.shippingInfo?.method === 'delivery' ? 5 : 0,
        commission,
        total: total + (orderInput.shippingInfo?.method === 'delivery' ? 5 : 0)
      },
      status: 'pending',
      paymentStatus: 'pending',
      shippingInfo: orderInput.shippingInfo,
      createdAt: Date.now()
    });
    
    // 3. Décrémenter stocks
    for (let item of orderInput.items) {
      const prodRef = doc(firestore, 'products', item.productId);
      await updateDoc(prodRef, {
        'stock.available': increment(-item.quantity),
        'stock.reserved': increment(item.quantity)
      });
    }
    
    // 4. Créer commission doc
    await addDoc(collection(firestore, 'commissions'), {
      vendorId: orderInput.items[0].vendorId,
      orderId: orderRef.id,
      amount: commission,
      status: 'pending',
      createdAt: Date.now()
    });
    
    return { 
      success: true, 
      orderId: orderRef.id,
      paymentUrl: await this.generatePaymentLink(orderRef.id, total) // Futur Stripe/Flutterwave
    };
  }

  /**
   * Mettre à jour statut commande
   * Entrée : orderId, newStatus, actorId (vendeur ou client)
   * Sortie : { success }
   * Logique :
   *   1. Vérifier autorisation (vendeur accepte, client peut annuler)
   *   2. Mettre à jour status
   *   3. Mettre à jour timeline
   *   4. Notifier l'autre partie
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, actorId: string) {
    const orderRef = doc(firestore, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    const order = orderDoc.data();
    
    // Vérifier autorisation
    if (newStatus === 'accepted' && order.vendorId !== actorId) {
      throw Error("Seul le vendeur peut accepter");
    }
    if (newStatus === 'cancelled' && order.clientId !== actorId) {
      throw Error("Seul le client peut annuler");
    }
    
    // Mettre à jour
    const updateData: any = { status: newStatus };
    if (newStatus === 'accepted') updateData['timeline.acceptedAt'] = Date.now();
    if (newStatus === 'in-progress') updateData['timeline.inProgressAt'] = Date.now();
    if (newStatus === 'delivered') {
      updateData['timeline.deliveredAt'] = Date.now();
      updateData['paymentStatus'] = 'paid'; // Paiement simulé OK
    }
    
    await updateDoc(orderRef, updateData);
    
    // Notifier l'autre partie
    const recipient = newStatus === 'accepted' ? order.clientId : order.vendorId;
    await this.createNotification(recipient, 'order_' + newStatus, orderId);
    
    return { success: true };
  }

  /**
   * Récupérer commandes utilisateur
   * Entrée : userId, role ('client' | 'vendor')
   * Sortie : Order[]
   */
  async getUserOrders(userId: string, role: 'client' | 'vendor') {
    const field = role === 'client' ? 'clientId' : 'vendorId';
    
    const q = query(
      collection(firestore, 'orders'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Créer Notification
   * Entrée : userId, type, relatedId (orderId, etc)
   * Sortie : { notificationId }
   */
  async createNotification(userId: string, type: string, relatedId: string) {
    const notifRef = await addDoc(collection(firestore, 'notifications'), {
      userId,
      type,
      relatedId,
      isRead: false,
      createdAt: Date.now()
    });
    
    return { notificationId: notifRef.id };
  }
}
```

---

### 2.4 Service Panier (CartContext)

```typescript
// ============================================
// CART CONTEXT - Pseudo-code (État Global)
// ============================================

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  title: string;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
}

/**
 * Logique Panier :
 * 1. Stocker localement en AsyncStorage (persistance)
 * 2. Syncer avec Firestore seulement au checkout
 * 3. Chaque ajout/suppression met à jour localStorage
 */
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  
  // Charger panier au démarrage
  useEffect(() => {
    const loadCart = async () => {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setItems(parsed);
        calculateTotal(parsed);
      }
    };
    loadCart();
  }, []);
  
  // Calculer total
  const calculateTotal = (cartItems: CartItem[]) => {
    const sum = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  };
  
  // Ajouter item
  const addItem = async (item: CartItem) => {
    const existing = items.find(i => i.productId === item.productId);
    let newItems;
    
    if (existing) {
      newItems = items.map(i => 
        i.productId === item.productId 
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      newItems = [...items, item];
    }
    
    setItems(newItems);
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    calculateTotal(newItems);
  };
  
  // Retirer item
  const removeItem = async (productId: string) => {
    const newItems = items.filter(i => i.productId !== productId);
    setItems(newItems);
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    calculateTotal(newItems);
  };
  
  // Mettre à jour quantité
  const updateQuantity = async (productId: string, qty: number) => {
    if (qty <= 0) {
      await removeItem(productId);
      return;
    }
    
    const newItems = items.map(i =>
      i.productId === productId ? { ...i, quantity: qty } : i
    );
    setItems(newItems);
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    calculateTotal(newItems);
  };
  
  // Vider panier
  const clearCart = async () => {
    setItems([]);
    setTotal(0);
    await AsyncStorage.removeItem('cart');
  };
  
  return (
    <CartContext.Provider value={{ items, total, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw Error("useCart must be inside CartProvider");
  return ctx;
};
```

---

### 2.5 Service Admin (Approbation Vendeurs)

```typescript
// ============================================
// ADMIN SERVICE - Pseudo-code
// ============================================

class AdminService {
  
  /**
   * Récupérer vendeurs en attente d'approbation
   * Entrée : aucune
   * Sortie : Vendor[] (status 'pending')
   * Logique :
   *   1. Query AdminApprovals où status = 'pending'
   *   2. Joindre avec vendors et users
   *   3. Retourner liste
   */
  async getPendingVendors() {
    const q = query(
      collection(firestore, 'adminApprovals'),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      approvalId: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Approuver Vendeur
   * Entrée : approvalId, adminId
   * Sortie : { success }
   * Logique :
   *   1. Mettre à jour AdminApprovals status = 'approved'
   *   2. Mettre à jour vendors verificationStatus = 'approved'
   *   3. Créer notification "Compte approuvé"
   */
  async approveVendor(approvalId: string, adminId: string) {
    const approvalDoc = await getDoc(doc(firestore, 'adminApprovals', approvalId));
    const approval = approvalDoc.data();
    const vendorId = approval.vendorId;
    
    // Mettre à jour AdminApprovals
    await updateDoc(doc(firestore, 'adminApprovals', approvalId), {
      status: 'approved',
      reviewedAt: Date.now(),
      reviewedBy: adminId
    });
    
    // Mettre à jour vendeur
    await updateDoc(doc(firestore, 'vendors', vendorId), {
      verificationStatus: 'approved',
      approvedBy: adminId,
      approvedAt: Date.now()
    });
    
    // Notifier vendeur
    await this.createNotification(vendorId, 'vendor_approved', vendorId);
    
    return { success: true };
  }

  /**
   * Rejeter Vendeur
   * Entrée : approvalId, reason, adminId
   * Sortie : { success }
   */
  async rejectVendor(approvalId: string, reason: string, adminId: string) {
    const approvalDoc = await getDoc(doc(firestore, 'adminApprovals', approvalId));
    const approval = approvalDoc.data();
    
    // Mettre à jour AdminApprovals
    await updateDoc(doc(firestore, 'adminApprovals', approvalId), {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: Date.now(),
      reviewedBy: adminId
    });
    
    // Mettre à jour vendeur
    await updateDoc(doc(firestore, 'vendors', approval.vendorId), {
      verificationStatus: 'rejected'
    });
    
    // Notifier vendeur
    await this.createNotification(
      approval.vendorId, 
      'vendor_rejected', 
      approvalId
    );
    
    return { success: true };
  }

  /**
   * Obtenir statistiques admin
   * Sortie : { totalUsers, totalVendors, totalOrders, revenue }
   */
  async getAdminStats() {
    // Compter utilisateurs
    const usersSnapshot = await getCountFromServer(collection(firestore, 'users'));
    
    // Compter vendeurs approuvés
    const vendorsQ = query(
      collection(firestore, 'vendors'),
      where('verificationStatus', '==', 'approved')
    );
    const vendorsSnapshot = await getCountFromServer(vendorsQ);
    
    // Compter commandes
    const ordersSnapshot = await getCountFromServer(collection(firestore, 'orders'));
    
    // Revenus (somme commissions payées)
    const commQ = query(
      collection(firestore, 'commissions'),
      where('status', '==', 'paid')
    );
    const commSnapshot = await getDocs(commQ);
    const revenue = commSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
    
    return {
      totalUsers: usersSnapshot.data().count,
      totalVendors: vendorsSnapshot.data().count,
      totalOrders: ordersSnapshot.data().count,
      revenue
    };
  }
}
```

---

## 3. Composants React (Sketches UI)

### 3.1 ProductCard.tsx

```typescript
// Composant affichant une carte produit
// Props : product, onPress
// UI : Image, titre, prix, rating, bouton "Ajouter"

export const ProductCard = ({ product, onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        {/* Image */}
        <Image source={{ uri: product.images[0].url }} style={styles.image} />
        
        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{product.price}€</Text>
          
          {/* Rating */}
          <View style={styles.rating}>
            <StarIcon rating={product.rating} />
            <Text style={styles.ratingText}>({product.reviews})</Text>
          </View>
          
          {/* Bouton */}
          <Button title="Ajouter" color="red" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
```

### 3.2 OrderCard.tsx

```typescript
// Composant affichant une commande
// Props : order, onPress
// UI : ID commande, statut, prix, date, bouton détails

export const OrderCard = ({ order, onPress }: Props) => {
  const statusColors = {
    pending: '#FFA500',
    accepted: '#FFA500',
    'in-progress': '#1E90FF',
    delivered: '#28A745',
    cancelled: '#DC3545'
  };
  
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.orderId}>Commande #{order.orderId}</Text>
        <Text style={styles.items}>{order.items.length} produit(s)</Text>
        <Text style={styles.price}>{order.pricing.total}€</Text>
        
        <View style={[styles.status, { backgroundColor: statusColors[order.status] }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
        
        <Button title="Détails" onPress={onPress} />
      </View>
    </TouchableOpacity>
  );
};
```

---

## 4. Flows de Navigation (Expo Router)

### Layout principal (app/_layout.tsx)

```typescript
// Navigation conditionnelle basée sur le statut auth

export default function RootLayout() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  return (
    <Stack>
      {!user ? (
        // Screen auth (non authentifié)
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      ) : user.role === 'admin' ? (
        // Screen admin
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      ) : user.role === 'vendor' ? (
        // Screen vendeur
        <Stack.Screen name="(vendor)" options={{ headerShown: false }} />
      ) : (
        // Screen client (défaut)
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
```

### Client Tabs (app/(app)/_layout.tsx)

```typescript
export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />
        }}
      />
      <Tabs.Screen 
        name="cart" 
        options={{
          title: 'Panier',
          tabBarBadge: cartItems.length,
          tabBarIcon: ({ color }) => <CartIcon color={color} />
        }}
      />
      <Tabs.Screen 
        name="orders" 
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => <OrdersIcon color={color} />
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />
        }}
      />
    </Tabs>
  );
}
```

---

## 5. Palette Couleurs (constants/colors.ts)

```typescript
export const COLORS = {
  // Primary (Rouge)
  primary: '#DC143C',        // Crimson Red
  primaryLight: '#FF6B6B',   // Light Red
  primaryDark: '#A00000',    // Dark Red
  
  // Secondary (Noir)
  secondary: '#000000',
  secondaryLight: '#333333',
  
  // Tertiary (Blanc)
  tertiary: '#FFFFFF',
  
  // Neutral
  gray: '#F5F5F5',
  grayDark: '#999999',
  grayLight: '#EEEEEE',
  
  // Status
  success: '#28A745',
  warning: '#FFA500',
  error: '#DC3545',
  info: '#1E90FF',
  
  // Text
  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF'
};
```

---

## 6. Types TypeScript (types/index.ts)

```typescript
// User types
export type UserRole = 'client' | 'vendor' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  createdAt: number;
  isActive: boolean;
}

export interface Vendor extends User {
  universityId: string;
  universityEmail: string;
  storeName: string;
  rating: number;
  totalSales: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationMethod: 'email' | 'badge';
}

// Product types
export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  stock: { total: number; available: number; reserved: number };
  category: string;
  images: { url: string; order: number }[];
  rating: number;
  reviews: number;
  isActive: boolean;
  createdAt: number;
}

// Order types
export interface Order {
  id: string;
  clientId: string;
  vendorId: string;
  items: CartItem[];
  pricing: { subtotal: number; shipping: number; commission: number; total: number };
  status: 'pending' | 'accepted' | 'in-progress' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingInfo: { method: 'pickup' | 'delivery'; address?: any };
  timeline: { createdAt: number; acceptedAt?: number; deliveredAt?: number };
  notes?: { clientNote?: string; vendorNote?: string };
  rating?: number;
}

// Cart types
export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'order_accepted' | 'order_delivered' | 'vendor_approved';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  data?: any;
}
```

---

**Document Version** : 1.0  
**Date** : 17 novembre 2024  
**Étape** : C - Conception ✅
