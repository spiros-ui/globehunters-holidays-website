import type { Currency } from "@/types";

/**
 * Featured package data for Top 15 hero section
 */
export interface FeaturedPackage {
  id: string;
  name: string;
  destination: string;
  destinationCode: string;
  image: string;
  price: number;
  originalPrice?: number;
  currency: Currency;
  nights: number;
  rating?: number;
}

/**
 * Top 50 package with static activities and dynamic flight/hotel options
 */
export interface Top50Package {
  id: string;
  name: string;
  destination: string;
  destinationCode: string;
  image: string;
  price: number;
  currency: Currency;
  nights: number;

  // Static inclusions - things to do that don't change
  staticInclusions: PackageInclusion[];

  // Dynamic options - only flights and hotels can be changed
  flightOptions: FlightOption[];
  hotelOptions: HotelOption[];

  // Selected defaults
  selectedFlightId?: string;
  selectedHotelId?: string;
}

/**
 * Static package inclusion (activity/tour/experience)
 */
export interface PackageInclusion {
  id: string;
  name: string;
  description?: string;
  icon?: "tour" | "activity" | "transfer" | "meal" | "guide" | "ticket";
}

/**
 * Flight option that user can select
 */
export interface FlightOption {
  id: string;
  airline: string;
  airlineLogo?: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  priceAdjustment: number; // Difference from base price
}

/**
 * Hotel option that user can select
 */
export interface HotelOption {
  id: string;
  name: string;
  starRating: number;
  image?: string;
  location?: string;
  priceAdjustment: number; // Difference from base price
}
