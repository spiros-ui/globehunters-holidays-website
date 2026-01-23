// Currency Types
export type Currency = 'GBP' | 'EUR' | 'USD' | 'AUD';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface FXRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

// Search Types
export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants?: number;
  rooms?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

// Flight Types
export interface FlightOffer {
  id: string;
  provider: 'duffel';
  providerOfferId: string;
  outbound: FlightSlice;
  inbound?: FlightSlice;
  totalPrice: Money;
  basePrice: Money;
  taxes: Money;
  passengers: PassengerPricing[];
  cabinClass: string;
  baggageIncluded: BaggageAllowance;
  bookingUrl?: string;
  expiresAt: Date;
}

export interface FlightSlice {
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  segments: FlightSegment[];
  stops: number;
}

export interface FlightSegment {
  airline: Airline;
  flightNumber: string;
  aircraft?: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabinClass: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  code: string;
  name: string;
  logo?: string;
}

export interface PassengerPricing {
  type: 'adult' | 'child' | 'infant';
  price: Money;
}

export interface BaggageAllowance {
  cabin: string;
  checked: string;
}

// Hotel Types
export interface HotelOffer {
  id: string;
  provider: 'amadeus';
  providerHotelId: string;
  name: string;
  description?: string;
  starRating: number;
  address: Address;
  coordinates?: Coordinates;
  images: HotelImage[];
  amenities: string[];
  rooms: RoomOffer[];
  checkIn: string;
  checkOut: string;
  lowestPrice: Money;
  reviewScore?: number;
  reviewCount?: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RoomOffer {
  id: string;
  name: string;
  description?: string;
  bedType?: string;
  maxOccupancy: number;
  price: Money;
  pricePerNight: Money;
  cancellationPolicy: CancellationPolicy;
  mealPlan?: string;
  available: boolean;
}

export interface CancellationPolicy {
  type: 'free' | 'partial' | 'non_refundable';
  deadline?: string;
  description: string;
}

export interface HotelImage {
  url: string;
  category?: string;
  alt?: string;
}

// Activity Types
export interface ActivityOffer {
  id: string;
  provider: 'viator';
  providerProductCode: string;
  title: string;
  description: string;
  shortDescription?: string;
  images: ActivityImage[];
  duration: string;
  price: Money;
  pricePerPerson: Money;
  rating?: number;
  reviewCount?: number;
  categories: string[];
  tags: string[];
  includes: string[];
  excludes: string[];
  meetingPoint?: string;
  bookingUrl?: string;
}

export interface ActivityImage {
  url: string;
  caption?: string;
}

// Package Types
export interface PackageOffer {
  id: string;
  title: string;
  theme: string;
  destination: Destination;
  nights: number;
  flight: FlightOffer;
  hotel: HotelOffer;
  activity?: ActivityOffer;
  totalPrice: Money;
  breakdown: {
    flight: Money;
    hotel: Money;
    activity?: Money;
    markup: Money;
  };
  includes: string[];
  images: string[];
  createdAt: Date;
  expiresAt: Date;
}

// Destination Types
export interface Destination {
  slug: string;
  name: string;
  country: string;
  airportCode: string;
  heroImage?: string;
  description?: string;
  startingPrice?: Money;
}

// Admin Types
export interface ContentBlock {
  id: string;
  key: string;
  content: string;
  type: 'text' | 'html' | 'json';
  updatedAt: Date;
  updatedBy?: string;
}

export interface PhoneNumber {
  id: string;
  name: string;
  number: string;
  displayNumber: string;
  country?: string;
  destinationSlug?: string;
  isDefault: boolean;
  isActive: boolean;
  trackingId?: string;
}

export interface PricingRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'tiered';
  vertical?: 'flights' | 'hotels' | 'activities';
  destinationSlug?: string;
  providerCode?: string;
  percentageMarkup?: number;
  fixedMarkup?: number;
  tieredRules?: TieredRule[];
  minMargin?: number;
  roundTo?: number;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  isActive: boolean;
}

export interface TieredRule {
  min: number;
  max: number;
  value: number;
  isPercentage: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'editor' | 'analyst';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  resource: string;
  resourceId?: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
