/**
 * Booking Engine Validation Utilities
 *
 * This module provides validation functions for package booking constraints:
 * - FROM field: Must be a valid UK airport
 * - DESTINATION field: Must be from the Top 50 package destinations
 *
 * Use these functions to validate URL query parameters, API requests, etc.
 */

import ukAirportsData from "@/data/uk-airports.json";
import packageDestinationsData from "@/data/package-destinations.json";

// Types
export interface UkAirport {
  code: string;
  name: string;
  city: string;
  region: string;
}

export interface PackageDestination {
  code: string;
  name: string;
  country: string;
  region: string;
}

export interface ValidationResult {
  isValid: boolean;
  normalizedValue: string | null;
  errorMessage: string | null;
}

// Data exports
export const ukAirports: UkAirport[] = ukAirportsData.airports;
export const packageDestinations: PackageDestination[] = packageDestinationsData.destinations;

// UK Airport validation
export function isValidUkAirport(code: string): boolean {
  if (!code) return false;
  const normalized = code.toUpperCase().trim();
  return ukAirports.some(airport => airport.code === normalized);
}

export function normalizeUkAirport(value: string): string | null {
  if (!value) return null;
  const normalized = value.toUpperCase().trim();
  const found = ukAirports.find(airport => airport.code === normalized);
  return found ? found.code : null;
}

export function getUkAirportByCode(code: string): UkAirport | undefined {
  if (!code) return undefined;
  return ukAirports.find(airport => airport.code === code.toUpperCase().trim());
}

export function validateUkAirport(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      normalizedValue: null,
      errorMessage: "Please select a UK departure airport."
    };
  }

  const normalized = normalizeUkAirport(value);
  if (normalized) {
    return {
      isValid: true,
      normalizedValue: normalized,
      errorMessage: null
    };
  }

  return {
    isValid: false,
    normalizedValue: null,
    errorMessage: `"${value}" is not a valid UK airport. Please select from our list of UK departure airports.`
  };
}

// Package Destination validation
export function isValidPackageDestination(nameOrCode: string): boolean {
  if (!nameOrCode) return false;
  const normalized = nameOrCode.toLowerCase().trim();
  return packageDestinations.some(
    dest => dest.code.toLowerCase() === normalized || dest.name.toLowerCase() === normalized
  );
}

export function normalizeDestination(value: string): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  const found = packageDestinations.find(
    dest => dest.code.toLowerCase() === normalized || dest.name.toLowerCase() === normalized
  );
  return found ? found.name : null;
}

export function getDestinationByNameOrCode(value: string): PackageDestination | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  return packageDestinations.find(
    dest => dest.code.toLowerCase() === normalized || dest.name.toLowerCase() === normalized
  );
}

export function validatePackageDestination(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      normalizedValue: null,
      errorMessage: "Please select a destination."
    };
  }

  const normalized = normalizeDestination(value);
  if (normalized) {
    return {
      isValid: true,
      normalizedValue: normalized,
      errorMessage: null
    };
  }

  return {
    isValid: false,
    normalizedValue: null,
    errorMessage: `"${value}" is not available as a package destination. Please select from our Top 50 destinations.`
  };
}

// Combined validation for package search params
export interface PackageSearchParams {
  origin: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  rooms?: string;
}

export interface PackageSearchValidationResult {
  isValid: boolean;
  normalizedParams: PackageSearchParams | null;
  errors: {
    origin?: string;
    destination?: string;
    general?: string;
  };
}

export function validatePackageSearchParams(params: PackageSearchParams): PackageSearchValidationResult {
  const errors: { origin?: string; destination?: string; general?: string } = {};
  let isValid = true;

  // Validate origin
  const originValidation = validateUkAirport(params.origin);
  if (!originValidation.isValid) {
    errors.origin = originValidation.errorMessage || "Invalid origin";
    isValid = false;
  }

  // Validate destination
  const destValidation = validatePackageDestination(params.destination);
  if (!destValidation.isValid) {
    errors.destination = destValidation.errorMessage || "Invalid destination";
    isValid = false;
  }

  if (!isValid) {
    return {
      isValid: false,
      normalizedParams: null,
      errors
    };
  }

  return {
    isValid: true,
    normalizedParams: {
      origin: originValidation.normalizedValue!,
      destination: destValidation.normalizedValue!,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      children: params.children,
      rooms: params.rooms
    },
    errors: {}
  };
}

// Helper to get all UK airports grouped by region
export function getUkAirportsByRegion(): Record<string, UkAirport[]> {
  return ukAirports.reduce((acc, airport) => {
    const region = airport.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(airport);
    return acc;
  }, {} as Record<string, UkAirport[]>);
}

// Helper to get all package destinations grouped by region
export function getDestinationsByRegion(): Record<string, PackageDestination[]> {
  return packageDestinations.reduce((acc, dest) => {
    const region = dest.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(dest);
    return acc;
  }, {} as Record<string, PackageDestination[]>);
}
