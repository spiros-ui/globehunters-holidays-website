import type { Currency } from "@/types";

export interface HotelResult {
  id: string;
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  mainImage: string | null;
  images: string[];
  amenities: string[];
  kind: string;
  price: number;
  pricePerNight: number;
  currency: string;
  nights: number;
  roomType: string;
  mealPlan: string;
  cancellationPolicy: string;
  freeCancellation: boolean;
  guests?: {
    adults: number;
    children: number;
    rooms: number;
  };
}

export interface HotelCardProps {
  hotel: HotelResult;
  currency: Currency;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  adults?: number;
  children?: number;
  childAges?: string;
  centerLat?: number;
  centerLon?: number;
  avgPrice?: number;
  onShowOnMap?: (hotelId: string) => void;
}

export interface FiltersProps {
  hotels: HotelResult[];
  selectedStars: number[];
  setSelectedStars: (stars: number[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  maxPrice: number;
  minPrice: number;
  freeCancellationOnly: boolean;
  setFreeCancellationOnly: (val: boolean) => void;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  selectedPopularFilters: string[];
  setSelectedPopularFilters: (filters: string[]) => void;
  selectedPropertyTypes: string[];
  setSelectedPropertyTypes: (types: string[]) => void;
  selectedRoomAmenities: string[];
  setSelectedRoomAmenities: (amenities: string[]) => void;
  currency: Currency;
}

export type SortOption = "topPicks" | "price" | "stars" | "distance";
