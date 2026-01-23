/**
 * Globehunters API Adapter
 * Connects to the existing Globehunters API for real flight, hotel, and package data
 */

import type { Currency } from "@/types";

const API_BASE_URL = process.env.GLOBEHUNTERS_API_URL || "https://globehunter.replit.app";

// ============================================
// Request Types
// ============================================

interface PackageSearchParams {
  departure_airport: string;
  destination: string;
  departure_date: string;
  return_date: string;
  adults: number;
  children: number;
  rooms: number;
  currency: Currency;
}

interface FlightSearchParams {
  departure_airport: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults: number;
  children: number;
  currency: Currency;
}

interface HotelSearchParams {
  destination: string;
  check_in: string;
  check_out: string;
  adults: number;
  rooms: number;
  currency: Currency;
}

// ============================================
// Response Types (from Globehunters API)
// ============================================

export interface GHFlight {
  Result_id: string;
  airline_code: string;
  airline_name: string;
  total_fare: number;
  Segments: GHFlightSegment[];
  stops: number;
  travel_time: number;
  direct_flight: boolean;
  refundable: boolean;
  cabin_type: string;
  currency_code: string;
}

export interface GHFlightSegment {
  departure_airport: string;
  departure_city: string;
  arrival_airport: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  flight_number: string;
  airline_code: string;
  airline_name: string;
  duration: number;
}

export interface GHHotel {
  hotel_id: string;
  hotel_name: string;
  name: string;
  star_rating: number;
  review_score: number;
  review_score_word: string;
  thumbnail: string;
  images: string[];
  address: string;
  city_name: string;
  min_price: number;
  price_per_night: number;
  board_type: string;
  refundable: boolean;
  distance_from_center: string;
  description?: string;
  amenities?: string[];
  rooms?: GHRoom[];
}

export interface GHRoom {
  room_id: string;
  room_name: string;
  price: number;
  price_per_night: number;
  board_type: string;
  refundable: boolean;
  max_occupancy: number;
}

export interface GHPackage {
  package_id: string;
  package_title: string;
  package_icon: string;
  theme_activity: string;
  flight: GHFlight;
  hotel: GHHotel;
  total_price: number;
  price_per_person: number;
  currency: string;
  nights: number;
  destination: string;
  includes: string[];
  alternative_flights: GHFlight[];
}

export interface PackageSearchResponse {
  status: boolean;
  packages: GHPackage[];
}

export interface FlightSearchResponse {
  status: boolean;
  flights: GHFlight[];
}

export interface HotelSearchResponse {
  status: boolean;
  hotels: GHHotel[];
}

// ============================================
// API Functions
// ============================================

async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: object
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Globehunters API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Search for holiday packages (flights + hotels combined)
 */
export async function searchPackages(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  rooms: number;
  currency: Currency;
}): Promise<PackageSearchResponse> {
  const requestBody: PackageSearchParams = {
    departure_airport: params.origin,
    destination: params.destination,
    departure_date: params.departureDate,
    return_date: params.returnDate,
    adults: params.adults,
    children: params.children,
    rooms: params.rooms,
    currency: params.currency,
  };

  return apiRequest<PackageSearchResponse>("/api/search/packages", "POST", requestBody);
}

/**
 * Search for flights only
 */
export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  currency: Currency;
}): Promise<FlightSearchResponse> {
  const requestBody: FlightSearchParams = {
    departure_airport: params.origin,
    destination: params.destination,
    departure_date: params.departureDate,
    return_date: params.returnDate,
    adults: params.adults,
    children: params.children,
    currency: params.currency,
  };

  return apiRequest<FlightSearchResponse>("/api/search/flights", "POST", requestBody);
}

/**
 * Search for hotels only
 */
export async function searchHotels(params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  currency: Currency;
}): Promise<HotelSearchResponse> {
  const requestBody: HotelSearchParams = {
    destination: params.destination,
    check_in: params.checkIn,
    check_out: params.checkOut,
    adults: params.adults,
    rooms: params.rooms,
    currency: params.currency,
  };

  return apiRequest<HotelSearchResponse>("/api/search/hotels", "POST", requestBody);
}
