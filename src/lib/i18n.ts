import type { Currency, Language } from "./api/types";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

// Base currency is EUR. Exchange rates relative to EUR.
export const CURRENCY_RATES: Record<Currency, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.85,
};

export function convertPrice(centsEUR: number, targetCurrency: Currency = "EUR"): number {
  const rate = CURRENCY_RATES[targetCurrency] ?? 1.0;
  return Math.round(centsEUR * rate);
}

export function getShippingRate(countryCode: string, currency: Currency = "EUR"): number {
  const code = countryCode.trim().toUpperCase();
  let baseEur = 1500; // default international: €15

  const EU_COUNTRIES = [
    "PT", "ES", "FR", "DE", "IT", "NL", "BE", "AT", "IE", "GR",
    "FI", "SE", "DK", "PL", "CZ", "HU", "RO", "BG", "HR", "SK",
    "SI", "LT", "LV", "EE", "CY", "LU", "MT"
  ];

  if (code === "PT") {
    baseEur = 500; // Portugal domestic: €5
  } else if (EU_COUNTRIES.includes(code)) {
    baseEur = 700; // EU Flat: €7
  } else if (code === "GB" || code === "UK") {
    baseEur = 950; // UK: approx £8 / €9.50
  } else if (code === "US" || code === "CA") {
    baseEur = 1200; // North America: €12 / $13
  }

  return convertPrice(baseEur, currency);
}

export const DICTIONARY = {
  en: {
    home: "HOME",
    shop: "SHOP",
    about: "ABOUT",
    cart: "CART",
    track: "TRACK",
    insertCoin: "INSERT COIN [CLICK]",
    coinInserted: "COIN INSERTED: 1-UP!",
    playRunner: "PLAY RUNNER",
    pressStart: "PRESS START",
    heroDesc: "Handmade merino wool caps from Portugal. Arcade-shop energy, none of the chrome.",
    shopNow: "SHOP NOW",
    ourStory: "OUR STORY",
    featured: "FEATURED",
    allCaps: "ALL CAPS",
    addToCart: "ADD TO CART",
    soldOut: "SOLD OUT",
    subtotal: "SUBTOTAL",
    shipping: "SHIPPING",
    total: "TOTAL",
    checkout: "CHECKOUT",
  },
  pt: {
    home: "INÍCIO",
    shop: "LOJA",
    about: "SOBRE",
    cart: "CARRINHO",
    track: "SEGUIR",
    insertCoin: "INSERIR MOEDA",
    coinInserted: "MOEDA INSERIDA: 1-UP!",
    playRunner: "JOGAR RUNNER",
    pressStart: "PRESS START",
    heroDesc: "Gorros artesanais de lã merino feitos em Portugal. Estilo arcade dos anos 90.",
    shopNow: "VER LOJA",
    ourStory: "A NOSSA HISTÓRIA",
    featured: "DESTAQUES",
    allCaps: "TODOS OS GORROS",
    addToCart: "COMPRAR",
    soldOut: "ESGOTADO",
    subtotal: "SUBTOTAL",
    shipping: "ENVIO",
    total: "TOTAL",
    checkout: "PAGAMENTO",
  },
} as const;
