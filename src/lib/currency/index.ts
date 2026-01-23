/**
 * Currency detection, conversion, and FX rates
 */

import type { Currency, Money } from "@/types";

export const SUPPORTED_CURRENCIES: Currency[] = ["GBP", "EUR", "USD", "AUD"];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
  AUD: "A$",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  GBP: "British Pound",
  EUR: "Euro",
  USD: "US Dollar",
  AUD: "Australian Dollar",
};

// Country to currency mapping
const COUNTRY_CURRENCY: Record<string, Currency> = {
  GB: "GBP",
  UK: "GBP",
  US: "GBP", // Default to GBP for UK-focused site
  AU: "AUD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  IE: "EUR",
};

// FX rates cache (in production, use Redis)
let fxRatesCache: {
  rates: Map<Currency, number>;
  baseCurrency: Currency;
  timestamp: number;
} | null = null;

const FX_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Detect currency based on various signals
 */
export function detectCurrency(
  urlParam?: string | null,
  cookieValue?: string | null,
  countryCode?: string | null
): Currency {
  // 1. URL parameter
  if (urlParam && SUPPORTED_CURRENCIES.includes(urlParam as Currency)) {
    return urlParam as Currency;
  }

  // 2. Cookie/stored preference
  if (cookieValue && SUPPORTED_CURRENCIES.includes(cookieValue as Currency)) {
    return cookieValue as Currency;
  }

  // 3. Geo-IP country
  if (countryCode && COUNTRY_CURRENCY[countryCode]) {
    return COUNTRY_CURRENCY[countryCode];
  }

  // 4. Default to GBP
  return "GBP";
}

/**
 * Fetch FX rates from external API
 */
export async function fetchFXRates(baseCurrency: Currency = "GBP"): Promise<Map<Currency, number>> {
  // Check cache
  if (
    fxRatesCache &&
    fxRatesCache.baseCurrency === baseCurrency &&
    Date.now() - fxRatesCache.timestamp < FX_CACHE_TTL
  ) {
    return fxRatesCache.rates;
  }

  try {
    // Using exchangerate-api.com (free tier available)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`FX API error: ${response.status}`);
    }

    const data = await response.json();
    const rates = new Map<Currency, number>();

    SUPPORTED_CURRENCIES.forEach((currency) => {
      rates.set(currency, data.rates[currency] || 1);
    });

    // Update cache
    fxRatesCache = {
      rates,
      baseCurrency,
      timestamp: Date.now(),
    };

    return rates;
  } catch (error) {
    console.error("Error fetching FX rates:", error);

    // Return fallback rates
    return getStaticFXRates(baseCurrency);
  }
}

/**
 * Static fallback FX rates (approximate)
 */
export function getStaticFXRates(baseCurrency: Currency): Map<Currency, number> {
  // Approximate rates as of early 2026
  const baseRates: Record<Currency, number> = {
    GBP: 1,
    EUR: 1.18,
    USD: 1.27,
    AUD: 1.95,
  };

  const rates = new Map<Currency, number>();
  const baseRate = baseRates[baseCurrency];

  SUPPORTED_CURRENCIES.forEach((currency) => {
    rates.set(currency, baseRates[currency] / baseRate);
  });

  return rates;
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) return amount;

  const rates = await fetchFXRates(from);
  const rate = rates.get(to) || 1;

  return Math.round(amount * rate * 100) / 100;
}

/**
 * Format money with currency symbol
 */
export function formatMoney(money: Money, showDecimals: boolean = false): string {
  const symbol = CURRENCY_SYMBOLS[money.currency];
  const amount = showDecimals
    ? money.amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : money.amount.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return `${symbol}${amount}`;
}

/**
 * Create a Money object
 */
export function createMoney(amount: number, currency: Currency): Money {
  return { amount, currency };
}
