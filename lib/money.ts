/**
 * lib/money.ts
 * ============
 * Toute l'arithmétique et le formatage monétaire de l'app.
 *
 * Devise : XOF (franc CFA BCEAO), la monnaie du Burkina Faso.
 *
 * Deux règles non négociables :
 *
 * 1. **Le XOF n'a pas de subdivision en circulation.** Tous les montants sont
 *    des ENTIERS. Pas de `toFixed(2)`, pas de centimes, jamais.
 * 2. **Aucun écran ne formate un prix à la main.** On passe par `formatXOF`,
 *    sinon on retrouve les trois formats incohérents de la v1.
 *
 * On n'utilise pas `Intl.NumberFormat` : le support de l'affichage des devises
 * par Hermes est inégal selon les plateformes, et on veut « 2 500 FCFA »
 * exactement, partout.
 */

/** Code ISO de la devise, tel que stocké en base. */
export const CURRENCY = 'XOF' as const;

/** Symbole affiché à l'utilisateur au Burkina Faso. */
export const CURRENCY_SYMBOL = 'FCFA' as const;

/**
 * Séparateur de milliers : espace insécable étroite (U+202F), la convention
 * typographique française. Empêche « 2 » et « 500 FCFA » de se retrouver sur
 * deux lignes différentes.
 */
const THIN_NBSP = ' ';

/** Espace insécable entre le montant et le symbole. */
const NBSP = ' ';

// ============================================
// NORMALISATION
// ============================================

/**
 * Ramène une valeur quelconque à un montant XOF valide : un entier positif.
 *
 * Les documents Firestore ne sont pas validés à l'écriture par le SDK client :
 * un prix peut arriver en `string`, `null` ou `NaN`. On ne veut jamais qu'un
 * `NaN` se propage jusque dans un total affiché.
 */
export function toAmount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Formate un montant pour l'affichage : `2500` → « 2 500 FCFA ».
 *
 * @param value   Montant en francs CFA.
 * @param options `symbol: false` pour le nombre seul (champs de saisie,
 *                colonnes de tableau alignées).
 */
export function formatXOF(
  value: unknown,
  options: { symbol?: boolean } = {}
): string {
  const { symbol = true } = options;
  const amount = toAmount(value);

  // Groupement par 3 depuis la droite.
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_NBSP);

  return symbol ? `${grouped}${NBSP}${CURRENCY_SYMBOL}` : grouped;
}

/**
 * Version compacte pour les espaces contraints (badges, graphiques) :
 * `1500` → « 1,5 k », `2400000` → « 2,4 M ».
 */
export function formatXOFCompact(value: unknown): string {
  const amount = toAmount(value);
  if (amount < 10_000) return formatXOF(amount);

  const [divisor, suffix] =
    amount >= 1_000_000 ? [1_000_000, 'M'] : [1_000, 'k'];
  const scaled = amount / divisor;
  // Une décimale seulement si elle apporte de l'information.
  const text = scaled >= 100 ? String(Math.round(scaled)) : scaled.toFixed(1).replace(/\.0$/, '');

  return `${text.replace('.', ',')}${NBSP}${suffix}${NBSP}${CURRENCY_SYMBOL}`;
}

/**
 * Analyse une saisie utilisateur (« 2 500 », « 2500 FCFA », « 2.500 ») et
 * renvoie le montant entier, ou `null` si ce n'est pas un nombre exploitable.
 */
export function parseXOF(input: string): number | null {
  const digits = input.replace(/[^\d]/g, '');
  if (digits.length === 0) return null;

  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

// ============================================
// RÈGLES COMMERCIALES
// ============================================

/**
 * Taux de commission prélevé par AubeShop sur chaque vente.
 * Surchargeable par `EXPO_PUBLIC_COMMISSION_RATE` pour les tests.
 */
export const COMMISSION_RATE = (() => {
  const raw = Number(process.env.EXPO_PUBLIC_COMMISSION_RATE);
  return Number.isFinite(raw) && raw >= 0 && raw < 1 ? raw : 0.1;
})();

/**
 * Barème de livraison, par zone de distance.
 *
 * Le tarif dépend de l'éloignement : 500 FCFA au plus près, 2 000 au plus
 * loin. On raisonne en zones plutôt qu'en kilomètres GPS parce que
 * l'adressage se fait au quartier à Ouagadougou comme à Bobo — le client
 * choisit son secteur, le tarif en découle, et personne n'a besoin
 * d'autoriser la géolocalisation pour commander.
 */
export const DELIVERY_ZONES = [
  { id: 'campus', label: 'Sur le campus', hint: 'Cité U, amphis, restau U', fee: 500 },
  { id: 'near', label: 'Quartier proche', hint: 'Moins de 3 km du campus', fee: 1000 },
  { id: 'city', label: 'En ville', hint: '3 à 8 km', fee: 1500 },
  { id: 'far', label: 'Périphérie', hint: 'Plus de 8 km', fee: 2000 },
] as const;

export type DeliveryZoneId = (typeof DELIVERY_ZONES)[number]['id'];

/** Tarif d'une zone. Retombe sur la zone la plus proche si l'id est inconnu. */
export function deliveryFee(zone: DeliveryZoneId | undefined): number {
  return DELIVERY_ZONES.find((z) => z.id === zone)?.fee ?? DELIVERY_ZONES[0].fee;
}

/** Bornes du barème, pour l'affichage (« Livraison de 500 à 2 000 FCFA »). */
export const DELIVERY_FEE_MIN = DELIVERY_ZONES[0].fee;
export const DELIVERY_FEE_MAX = DELIVERY_ZONES[DELIVERY_ZONES.length - 1].fee;

/**
 * Part des frais de livraison reversée au livreur ; AubeShop garde le reste
 * au titre de la mise en relation. Sur une course à 500 FCFA, le livreur
 * touche 400.
 */
export const COURIER_SHARE = 0.8;

/** Ce que le livreur encaisse pour une course. */
export function courierPayout(fee: number): number {
  return Math.round(toAmount(fee) * COURIER_SHARE);
}

/**
 * Commission due sur un sous-total, arrondie à l'entier supérieur.
 *
 * On arrondit en faveur de la plateforme plutôt qu'au plus proche : sur des
 * montants sans centimes, arrondir vers le bas ferait perdre jusqu'à 1 FCFA
 * par commande, et surtout rendrait `commission + net ≠ subtotal`.
 */
export function commissionOn(subtotal: number): number {
  return Math.ceil(toAmount(subtotal) * COMMISSION_RATE);
}

/** Ce que le vendeur touche réellement, commission déduite. */
export function vendorPayout(subtotal: number): number {
  return toAmount(subtotal) - commissionOn(subtotal);
}

/**
 * Le décompte complet d'une commande.
 *
 * Volontairement pur et synchrone : la même fonction sert à l'aperçu du
 * panier, à l'écran de paiement et à la création de la commande, ce qui
 * garantit que le client ne voit jamais un prix différent de celui facturé.
 *
 * La commission est prélevée sur la part du vendeur — elle n'est PAS ajoutée
 * au total payé par le client.
 */
export interface PriceBreakdown {
  /** Somme des articles. */
  subtotal: number;
  /** Frais de livraison (0 en retrait sur place). */
  shipping: number;
  /** Part AubeShop sur la vente, déduite du versement vendeur. */
  commission: number;
  /** Versement net au vendeur. */
  vendorPayout: number;
  /** Part du livreur sur les frais de livraison (0 en retrait). */
  courierPayout: number;
  /** Ce que le client paie. */
  total: number;
}

export function priceBreakdown(
  items: { price: number; quantity: number }[],
  shipping: { method: 'pickup' | 'delivery'; zone?: DeliveryZoneId }
): PriceBreakdown {
  const subtotal = items.reduce(
    (sum, item) => sum + toAmount(item.price) * Math.max(0, Math.trunc(item.quantity)),
    0
  );
  const shippingFee = shipping.method === 'delivery' ? deliveryFee(shipping.zone) : 0;
  const commission = commissionOn(subtotal);

  return {
    subtotal,
    shipping: shippingFee,
    commission,
    vendorPayout: subtotal - commission,
    courierPayout: courierPayout(shippingFee),
    total: subtotal + shippingFee,
  };
}
