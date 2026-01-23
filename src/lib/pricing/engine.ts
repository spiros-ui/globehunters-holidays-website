/**
 * Pricing Rules Engine
 * Applies markup rules to prices from API providers
 */

import type { Currency, PricingRule, TieredRule } from "@/types";

export interface PricingContext {
  vertical: "flights" | "hotels" | "activities" | "packages";
  destinationSlug?: string;
  providerCode: string;
  basePrice: number;
  currency: Currency;
  bookingDate?: Date;
}

export interface PricingResult {
  finalPrice: number;
  markup: number;
  ruleApplied: string;
  currency: Currency;
}

// Default pricing rules (in production, these come from database)
const DEFAULT_RULES: PricingRule[] = [
  {
    id: "default-flights",
    name: "Default Flight Markup",
    type: "percentage",
    vertical: "flights",
    percentageMarkup: 8,
    priority: 0,
    isActive: true,
  },
  {
    id: "default-hotels",
    name: "Default Hotel Markup",
    type: "percentage",
    vertical: "hotels",
    percentageMarkup: 10,
    priority: 0,
    isActive: true,
  },
  {
    id: "default-activities",
    name: "Default Activity Markup",
    type: "percentage",
    vertical: "activities",
    percentageMarkup: 12,
    priority: 0,
    isActive: true,
  },
  {
    id: "premium-destinations",
    name: "Premium Destination Markup",
    type: "tiered",
    destinationSlug: "maldives",
    tieredRules: [
      { min: 0, max: 2000, value: 15, isPercentage: true },
      { min: 2000, max: 5000, value: 12, isPercentage: true },
      { min: 5000, max: Infinity, value: 10, isPercentage: true },
    ],
    minMargin: 50,
    priority: 10,
    isActive: true,
  },
];

/**
 * Find applicable pricing rules for a given context
 */
function findApplicableRules(
  ctx: PricingContext,
  rules: PricingRule[] = DEFAULT_RULES
): PricingRule[] {
  return rules
    .filter((rule) => {
      if (!rule.isActive) return false;

      // Check vertical match
      if (rule.vertical && rule.vertical !== ctx.vertical) return false;

      // Check destination match
      if (rule.destinationSlug && rule.destinationSlug !== ctx.destinationSlug) return false;

      // Check provider match
      if (rule.providerCode && rule.providerCode !== ctx.providerCode) return false;

      // Check date validity
      if (rule.startDate && ctx.bookingDate && ctx.bookingDate < rule.startDate) return false;
      if (rule.endDate && ctx.bookingDate && ctx.bookingDate > rule.endDate) return false;

      return true;
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
}

/**
 * Calculate markup based on rule type
 */
function calculateMarkup(rule: PricingRule, basePrice: number): number {
  switch (rule.type) {
    case "percentage":
      return basePrice * ((rule.percentageMarkup || 0) / 100);

    case "fixed":
      return rule.fixedMarkup || 0;

    case "tiered": {
      const tiers = rule.tieredRules || [];
      const applicableTier = tiers.find(
        (t) => basePrice >= t.min && basePrice < t.max
      );

      if (!applicableTier) {
        // Use last tier for prices above all ranges
        const lastTier = tiers[tiers.length - 1];
        if (lastTier) {
          return lastTier.isPercentage
            ? basePrice * (lastTier.value / 100)
            : lastTier.value;
        }
        return 0;
      }

      return applicableTier.isPercentage
        ? basePrice * (applicableTier.value / 100)
        : applicableTier.value;
    }

    default:
      return 0;
  }
}

/**
 * Round price to nearest X.99 (or other pattern)
 */
function roundPrice(price: number, roundTo: number = 0.99): number {
  if (roundTo === 0) {
    return Math.round(price * 100) / 100;
  }

  // Round to nearest X.99
  const wholePart = Math.floor(price);
  return wholePart + roundTo;
}

/**
 * Apply pricing rules to get final price
 */
export function applyPricingRules(
  ctx: PricingContext,
  rules?: PricingRule[]
): PricingResult {
  const applicableRules = findApplicableRules(ctx, rules);

  // No rules found - apply default 8% markup
  if (applicableRules.length === 0) {
    const markup = ctx.basePrice * 0.08;
    return {
      finalPrice: roundPrice(ctx.basePrice + markup),
      markup,
      ruleApplied: "default",
      currency: ctx.currency,
    };
  }

  // Use highest priority rule
  const rule = applicableRules[0];
  let markup = calculateMarkup(rule, ctx.basePrice);

  // Apply minimum margin if set
  if (rule.minMargin && markup < rule.minMargin) {
    markup = rule.minMargin;
  }

  const finalPrice = roundPrice(
    ctx.basePrice + markup,
    rule.roundTo || 0.99
  );

  return {
    finalPrice,
    markup,
    ruleApplied: rule.name,
    currency: ctx.currency,
  };
}

/**
 * Calculate package price from components
 */
export function calculatePackagePrice(
  flightPrice: number,
  hotelPrice: number,
  activityPrice: number,
  currency: Currency,
  destinationSlug?: string
): PricingResult {
  const totalBase = flightPrice + hotelPrice + activityPrice;

  return applyPricingRules({
    vertical: "packages",
    destinationSlug,
    providerCode: "composite",
    basePrice: totalBase,
    currency,
  });
}

/**
 * Preview price calculation (for admin UI)
 */
export function previewPrice(
  basePrice: number,
  vertical: "flights" | "hotels" | "activities" | "packages",
  currency: Currency = "GBP",
  rules?: PricingRule[]
): PricingResult {
  return applyPricingRules(
    {
      vertical,
      providerCode: "preview",
      basePrice,
      currency,
    },
    rules
  );
}

/**
 * Simple helper for quick price application
 * Returns final price after applying default rules
 */
export function applyMarkup(
  amount: number,
  productType: "flight" | "hotel" | "activity" | "package",
  currency: Currency = "GBP"
): number {
  const verticalMap: Record<string, "flights" | "hotels" | "activities" | "packages"> = {
    flight: "flights",
    hotel: "hotels",
    activity: "activities",
    package: "packages",
  };

  const result = applyPricingRules({
    vertical: verticalMap[productType],
    providerCode: "default",
    basePrice: amount,
    currency,
  });

  return result.finalPrice;
}
