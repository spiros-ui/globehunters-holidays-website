/**
 * Types for live API data integration on the package detail page.
 * These types represent data that will come from Duffel (flights),
 * HotelBeds (hotels), and activity APIs in future phases.
 */

import type { Currency } from "@/types";

// ============ HOTEL API TYPES ============

export interface HotelAPIResult {
  id: string;
  name: string;
  starRating: number;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  imagesLarge?: string[];
  amenities: string[];
  amenityGroups?: Array<{
    groupName: string;
    amenities: string[];
  }>;
  checkInTime?: string;
  checkOutTime?: string;
  reviewScore?: number;
  reviewCount?: number;
}

export interface HotelDetails {
  description?: string;
  descriptionSections?: Array<{
    title: string;
    paragraphs: string[];
  }>;
  hotelChain?: string;
  propertyType?: string;
  phone?: string;
  email?: string;
  rooms: HotelRoom[];
}

export interface HotelRoom {
  id: string;
  name: string;
  description?: string;
  bedType?: string;
  maxOccupancy: number;
  pricePerNight: number;
  totalPrice: number;
  currency: Currency;
  mealPlan?: string;
  freeCancellation: boolean;
}

// ============ FLIGHT API TYPES ============

export interface LiveFlightOffer {
  id: string;
  provider: "duffel";
  providerOfferId: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo?: string;
  outbound: LiveFlightSlice;
  inbound: LiveFlightSlice | null;
  totalPrice: number;
  basePrice: number;
  taxes: number;
  currency: Currency;
  cabinClass: string;
  cabinBaggage?: string;
  checkedBaggage?: string;
  stops: number;
  expiresAt?: string;
}

export interface LiveFlightSlice {
  origin: string;
  originName?: string;
  originCity?: string;
  destination: string;
  destinationName?: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  departureDate?: string;
  arrivalDate?: string;
  duration: number;
  segments?: LiveFlightSegment[];
}

export interface LiveFlightSegment {
  airlineCode: string;
  airlineName?: string;
  flightNumber: string;
  aircraft?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabinClass: string;
}

// ============ ACTIVITY API TYPES ============

export interface LiveActivity {
  id: string;
  provider: "viator" | "klook" | "static";
  title: string;
  description: string;
  shortDescription?: string;
  image?: string;
  images?: string[];
  duration: string;
  price: number;
  currency: Currency;
  rating?: number;
  reviewCount?: number;
  category: string;
  includes?: string[];
  highlights?: string[];
  bookingUrl?: string;
}

// ============ PRICING TYPES ============

export interface PriceBreakdown {
  flightPrice: number | null;
  hotelPrice: number | null;
  activityTotal: number;
  total: number | null;
  perPerson: number | null;
}

export interface CalculateTotalPriceParams {
  liveFlightPrice: number | null;
  liveHotelPrice: number | null;
  liveActivityTotal: number;
  nights: number;
  adults: number;
}
