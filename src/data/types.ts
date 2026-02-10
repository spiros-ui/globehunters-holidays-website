/**
 * Type definitions for package and activity data models
 * Used with featured-packages.json, top50-packages.json, and destination-activities.json
 */

import type { Currency } from "@/types";

// ============ PACKAGE TYPES ============

export interface PackageData {
  id: string;
  destinationId: string;
  destinationName: string;
  country: string;
  region?: string;
  airportCode: string;
  title: string;
  tagline: string;
  nights: number;
  startingPrice: number;
  currency: Currency;
  rating: number;
  reviewCount: number;
  featured: boolean;
  featuredOrder?: number;
  top50Rank?: number;
  theme: PackageTheme;
  heroImage: string;
  images: string[];
  highlights: string[];
  includes: string[];
  activities: string[]; // Activity IDs
}

export type PackageTheme =
  | "luxury"
  | "beach"
  | "cultural"
  | "adventure"
  | "romantic"
  | "city";

export interface ThemeDefinition {
  id: PackageTheme;
  name: string;
  description: string;
}

export interface RegionDefinition {
  id: string;
  name: string;
}

// ============ ACTIVITY TYPES ============

export interface ActivityData {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  duration: string;
  price: number;
  currency: Currency;
  rating: number;
  reviewCount: number;
  category: ActivityCategory;
  image: string;
  includes: string[];
  highlights: string[];
}

export type ActivityCategory =
  | "Attractions"
  | "Tours"
  | "Cultural"
  | "Food & Drink"
  | "Cruises"
  | "Adventure"
  | "Water Sports"
  | "Day Trips"
  | "Entertainment"
  | "Theme Parks"
  | "Wildlife"
  | "Wellness"
  | "Walking Tours"
  | "Experiences"
  | "Island Tours";

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
}

// ============ DATA FILE STRUCTURES ============

export interface FeaturedPackagesFile {
  version: string;
  lastUpdated: string;
  description: string;
  featuredPackages: PackageData[];
}

export interface Top50PackagesFile {
  version: string;
  lastUpdated: string;
  description: string;
  packages: PackageData[];
  themes: ThemeDefinition[];
  regions: RegionDefinition[];
}

export interface DestinationActivitiesFile {
  version: string;
  lastUpdated: string;
  description: string;
  activities: Record<string, ActivityData[]>;
  categories: CategoryDefinition[];
}

// ============ HELPER TYPES ============

export type DestinationId =
  | "dubai"
  | "maldives"
  | "bali"
  | "bangkok"
  | "phuket"
  | "paris"
  | "rome"
  | "barcelona"
  | "santorini"
  | "london"
  | "new-york"
  | "tokyo"
  | "singapore"
  | "amsterdam"
  | "hong-kong"
  | "cairo"
  | "venice"
  | "lisbon"
  | "prague"
  | "vienna"
  | "milan"
  | "madrid"
  | "athens"
  | "miami"
  | "los-angeles"
  | "cancun"
  | "marrakech"
  | "cape-town"
  | "sydney"
  | "melbourne"
  | "abu-dhabi"
  | "kyoto"
  | "seoul"
  | "kuala-lumpur"
  | "ho-chi-minh"
  | "florence"
  | "dublin"
  | "edinburgh"
  | "budapest"
  | "nice"
  | "mauritius"
  | "sri-lanka"
  | "sicily"
  | "iceland"
  | "zanzibar"
  | "jordan"
  | "dubrovnik"
  | "costa-rica"
  | "peru"
  | "new-zealand";

// ============ UTILITY FUNCTIONS TYPES ============

export interface PackageFilters {
  theme?: PackageTheme;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  minNights?: number;
  maxNights?: number;
  minRating?: number;
  featured?: boolean;
}

export interface ActivityFilters {
  category?: ActivityCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}
