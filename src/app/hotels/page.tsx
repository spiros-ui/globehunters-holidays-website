"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Star,
  Loader2,
  Building,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Wifi,
  Utensils,
  Car,
  Waves,
  Dumbbell,
  Coffee,
  Map,
  Heart,
  Check,
  AlertCircle,
  ParkingCircle,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice, cn } from "@/lib/utils";
import type { Currency } from "@/types";

// Booking.com color constants
const BOOKING_BLUE = "#003580";
const BOOKING_BLUE_LIGHT = "#0071c2";
const BOOKING_YELLOW = "#feba02";
const BOOKING_GREEN = "#008009";
const BOOKING_ORANGE = "#ff6600";
const GH_ORANGE = "#f97316"; // GlobeHunters brand orange for CTAs

interface HotelResult {
  id: string;
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  mainImage: string | null;
  images: string[];
  amenities: string[];
  price: number;
  pricePerNight: number;
  currency: string;
  nights: number;
  roomType: string;
  mealPlan: string;
  cancellationPolicy: string;
  freeCancellation: boolean;
}

// Generate mock review score (8.0-9.8) for demo purposes
function generateReviewScore(hotelId: string): number {
  const hash = hotelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.round((7 + (hash % 30) / 10) * 10) / 10;
}

// Generate mock review count for demo
function generateReviewCount(hotelId: string): number {
  const hash = hotelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 50 + (hash % 950);
}

// Generate urgency indicator randomly based on hotel id
function generateUrgencyIndicator(hotelId: string): { show: boolean; rooms: number } {
  const hash = hotelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const show = hash % 3 === 0;
  const rooms = 1 + (hash % 5);
  return { show, rooms };
}

// Get review label based on score
function getReviewLabel(score: number): string {
  if (score >= 9) return "Superb";
  if (score >= 8) return "Very Good";
  if (score >= 7) return "Good";
  return "Pleasant";
}

// Generate deterministic distance from center based on hotel id
function generateDistanceFromCenter(hotelId: string): number {
  const hash = hotelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.round((0.3 + (hash % 50) / 10) * 10) / 10;
}

// Get review badge color based on score
function getReviewBadgeColor(score: number): string {
  if (score >= 9) return "bg-[#003580]";
  if (score >= 8) return "bg-[#0071c2]";
  if (score >= 7) return "bg-[#5B9BD5]";
  return "bg-gray-500";
}

// Amenity icon mapping
function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return Wifi;
  if (lower.includes("pool") || lower.includes("swim")) return Waves;
  if (lower.includes("parking")) return ParkingCircle;
  if (lower.includes("fitness") || lower.includes("gym")) return Dumbbell;
  if (lower.includes("breakfast")) return Coffee;
  if (lower.includes("restaurant")) return UtensilsCrossed;
  return null;
}

// Property types for filter
const PROPERTY_TYPES = [
  { id: "hotels", label: "Hotels", count: 0 },
  { id: "apartments", label: "Apartments", count: 0 },
  { id: "villas", label: "Villas", count: 0 },
  { id: "resorts", label: "Resorts", count: 0 },
  { id: "hostels", label: "Hostels", count: 0 },
];

// Popular filter options
const POPULAR_FILTERS = [
  { id: "breakfast", label: "Breakfast included", icon: Coffee },
  { id: "freeCancellation", label: "Free cancellation", icon: Check },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "wifi", label: "Free WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: ParkingCircle },
];

interface HotelCardProps {
  hotel: HotelResult;
  currency: Currency;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  adults?: number;
}

function HotelCard({ hotel, currency, destination, checkIn, checkOut, rooms, adults }: HotelCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fallbackImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";
  const allImages = hotel.images.length > 0
    ? hotel.images
    : (hotel.mainImage ? [hotel.mainImage] : []);
  const displayImages = allImages.length > 0 ? allImages : [fallbackImage];

  const reviewScore = generateReviewScore(hotel.id);
  const reviewCount = generateReviewCount(hotel.id);
  const urgency = generateUrgencyIndicator(hotel.id);
  const reviewLabel = getReviewLabel(reviewScore);
  const reviewBadgeColor = getReviewBadgeColor(reviewScore);

  // Check if breakfast is included in amenities or meal plan
  const hasBreakfast = hotel.mealPlan.toLowerCase().includes("breakfast") ||
    hotel.amenities.some(a => a.toLowerCase().includes("breakfast"));

  // Generate original price for discount display (some hotels)
  const hasDiscount = hotel.id.charCodeAt(0) % 3 === 0;
  const originalPrice = hasDiscount ? Math.round(hotel.price * 1.15) : null;

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  return (
    <div
      className={cn(
        "bg-white rounded-lg border overflow-hidden transition-all duration-200",
        isHovered ? "shadow-lg border-[#003580]" : "shadow-sm border-gray-200"
      )}
      style={{ boxShadow: isHovered ? "0 4px 16px rgba(0, 0, 0, 0.12)" : "0 2px 8px rgba(0, 0, 0, 0.08)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image Gallery - Left side (30-40% width) */}
        <div className="relative w-full md:w-[280px] lg:w-[320px] h-52 md:h-[220px] flex-shrink-0 group">
          <Image
            src={displayImages[currentImageIndex] ?? displayImages[0] ?? fallbackImage}
            alt={hotel.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
            onError={() => setImageError(true)}
          />

          {/* Image Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Carousel Dots */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {displayImages.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === currentImageIndex ? "bg-white" : "bg-white/60"
                  )}
                />
              ))}
              {displayImages.length > 5 && (
                <span className="text-white text-xs ml-1">+{displayImages.length - 5}</span>
              )}
            </div>
          )}

          {/* Save Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSaved(!isSaved);
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              className={cn("w-5 h-5", isSaved ? "fill-red-500 text-red-500" : "text-gray-600")}
            />
          </button>

          {/* Genius Badge (for some hotels) */}
          {hasDiscount && (
            <div
              className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"
              style={{ backgroundColor: BOOKING_YELLOW, color: BOOKING_BLUE }}
            >
              <Sparkles className="w-3 h-3" />
              Genius
            </div>
          )}
        </div>

        {/* Content - Middle */}
        <div className="flex-1 p-4 flex flex-col min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              {/* Hotel Name */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-bold text-base md:text-lg hover:text-[#0071c2] cursor-pointer line-clamp-1"
                  style={{ color: BOOKING_BLUE }}
                >
                  {hotel.name}
                </h3>
                {/* Star Rating */}
                {hotel.starRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#feba02] text-[#feba02]" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Review Score Badge - Top Right */}
            <div className="flex items-start gap-2 flex-shrink-0">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-gray-900">{reviewLabel}</div>
                <div className="text-xs text-gray-500">{reviewCount.toLocaleString()} reviews</div>
              </div>
              <div
                className={cn("px-2 py-1.5 rounded-tl-lg rounded-tr-lg rounded-br-lg text-white font-bold text-sm", reviewBadgeColor)}
              >
                {reviewScore.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-[#0071c2] mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="underline cursor-pointer line-clamp-1">
              {hotel.city}{hotel.country ? `, ${hotel.country}` : ""}
            </span>
            <span className="text-gray-500 ml-1">- Show on map</span>
            {hotel.address && (
              <span className="text-gray-500 hidden lg:inline ml-1">- {generateDistanceFromCenter(hotel.id)} km from center</span>
            )}
          </div>

          {/* Mobile Review Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 md:hidden">
            <span className="font-semibold text-gray-900">{reviewLabel}</span>
            <span>- {reviewCount.toLocaleString()} reviews</span>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {hotel.freeCancellation && (
              <span className="text-xs font-medium" style={{ color: BOOKING_GREEN }}>
                <Check className="w-3 h-3 inline mr-0.5" />
                Free cancellation
              </span>
            )}
            {hasBreakfast && (
              <span className="text-xs font-medium" style={{ color: BOOKING_GREEN }}>
                <Check className="w-3 h-3 inline mr-0.5" />
                Breakfast included
              </span>
            )}
            {hasDiscount && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: BOOKING_GREEN, color: "white" }}
              >
                10% off
              </span>
            )}
          </div>

          {/* Amenity Icons Row */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {hotel.amenities.slice(0, 5).map((amenity, idx) => {
              const Icon = getAmenityIcon(amenity);
              if (!Icon) return null;
              return (
                <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{amenity}</span>
                </div>
              );
            })}
          </div>

          {/* Room Type */}
          <div className="text-sm text-gray-700 mb-1">
            <span className="font-medium">{hotel.roomType}</span>
          </div>

          {/* Stay Info */}
          <div className="text-xs text-gray-500 mb-2">
            {hotel.nights} night{hotel.nights > 1 ? "s" : ""}, 2 adults
          </div>

          {/* Urgency Indicator */}
          {urgency.show && (
            <div
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: BOOKING_ORANGE }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Only {urgency.rooms} room{urgency.rooms > 1 ? "s" : ""} left at this price on our site!
            </div>
          )}
        </div>

        {/* Price Column - Right side */}
        <div className="md:w-40 lg:w-44 p-4 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/50">
          <div className="text-right">
            {/* Original Price (strikethrough if discounted) */}
            {originalPrice && (
              <div className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice, currency)}
              </div>
            )}
            {/* Current Price */}
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {formatPrice(hotel.price, currency)}
            </div>
            <div className="text-xs text-gray-500">
              +{formatPrice(Math.round(hotel.price * 0.12), currency)} taxes and fees
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatPrice(hotel.pricePerNight, currency)} per night
            </div>
          </div>

          {/* CTA Button - GlobeHunters orange */}
          <Button
            className="w-full md:w-auto mt-2"
            style={{ backgroundColor: GH_ORANGE }}
            asChild
          >
            <Link href={`/hotels/${hotel.id}?${new URLSearchParams({
              name: hotel.name,
              thumbnail: hotel.mainImage || hotel.images?.[0] || "",
              address: hotel.address || "",
              cityName: hotel.city || "",
              destination: destination || "",
              starRating: String(hotel.starRating || 0),
              pricePerNight: String(hotel.pricePerNight || 0),
              boardType: hotel.mealPlan || "Room Only",
              refundable: String(hotel.freeCancellation || false),
              currency: currency,
              nights: String(hotel.nights || 1),
              checkIn: checkIn || "",
              checkOut: checkOut || "",
              rooms: String(rooms),
              adults: String(adults),
            }).toString()}`}>
              See availability
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Skeleton loading card
function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-[280px] lg:w-[320px] h-52 md:h-[220px] bg-gray-200" />
        <div className="flex-1 p-4">
          <div className="flex justify-between mb-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-8 w-12 bg-gray-200 rounded" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="flex gap-2 mb-3">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="md:w-40 p-4 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/50 flex flex-col items-end justify-end">
          <div className="h-6 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-16 mb-3" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

// Dual-handle range slider component
interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  currency: Currency;
}

function DualRangeSlider({ min, max, value, onChange, currency }: DualRangeSliderProps) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localMax - 10);
    setLocalMin(newMin);
    onChange([newMin, localMax]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin + 10);
    setLocalMax(newMax);
    onChange([localMin, newMax]);
  };

  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-2 rounded-full"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
            backgroundColor: BOOKING_BLUE,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#003580] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#003580] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#003580] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#003580] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{formatPrice(localMin, currency)}</span>
        <span className="font-medium">{formatPrice(localMax, currency)}</span>
      </div>
    </div>
  );
}

// Filter checkbox component
interface FilterCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

function FilterCheckbox({ checked, onChange, label, count, icon }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
          checked ? "border-[#003580] bg-[#003580]" : "border-gray-300 bg-white group-hover:border-gray-400"
        )}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      {icon && <span className="text-gray-500">{icon}</span>}
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
    </label>
  );
}

// Filters sidebar
interface FiltersProps {
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
  selectedReviewScore: number | null;
  setSelectedReviewScore: (score: number | null) => void;
  selectedPropertyTypes: string[];
  setSelectedPropertyTypes: (types: string[]) => void;
  currency: Currency;
}

function FiltersPanel({
  hotels,
  selectedStars,
  setSelectedStars,
  priceRange,
  setPriceRange,
  maxPrice,
  minPrice,
  freeCancellationOnly,
  setFreeCancellationOnly,
  showMobileFilters,
  setShowMobileFilters,
  selectedPopularFilters,
  setSelectedPopularFilters,
  selectedReviewScore,
  setSelectedReviewScore,
  selectedPropertyTypes,
  setSelectedPropertyTypes,
  currency,
}: FiltersProps) {
  // Count hotels by star rating
  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    hotels.forEach((h) => {
      if (h.starRating >= 1 && h.starRating <= 5) {
        counts[h.starRating]++;
      }
    });
    return counts;
  }, [hotels]);

  // Count hotels with free cancellation
  const freeCancelCount = useMemo(() => {
    return hotels.filter(h => h.freeCancellation).length;
  }, [hotels]);

  // Count hotels by review score threshold
  const reviewScoreCounts = useMemo(() => {
    return {
      9: hotels.filter(h => generateReviewScore(h.id) >= 9).length,
      8: hotels.filter(h => generateReviewScore(h.id) >= 8).length,
      7: hotels.filter(h => generateReviewScore(h.id) >= 7).length,
      6: hotels.filter(h => generateReviewScore(h.id) >= 6).length,
    };
  }, [hotels]);

  const hasActiveFilters = selectedStars.length > 0 ||
    freeCancellationOnly ||
    priceRange[0] > minPrice ||
    priceRange[1] < maxPrice ||
    selectedPopularFilters.length > 0 ||
    selectedReviewScore !== null ||
    selectedPropertyTypes.length > 0;

  const clearAllFilters = () => {
    setSelectedStars([]);
    setFreeCancellationOnly(false);
    setPriceRange([minPrice, maxPrice]);
    setSelectedPopularFilters([]);
    setSelectedReviewScore(null);
    setSelectedPropertyTypes([]);
  };

  const togglePopularFilter = (filterId: string) => {
    if (selectedPopularFilters.includes(filterId)) {
      setSelectedPopularFilters(selectedPopularFilters.filter(f => f !== filterId));
    } else {
      setSelectedPopularFilters([...selectedPopularFilters, filterId]);
    }
  };

  const togglePropertyType = (typeId: string) => {
    if (selectedPropertyTypes.includes(typeId)) {
      setSelectedPropertyTypes(selectedPropertyTypes.filter(t => t !== typeId));
    } else {
      setSelectedPropertyTypes([...selectedPropertyTypes, typeId]);
    }
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Applied Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedStars.map(star => (
            <button
              key={star}
              onClick={() => setSelectedStars(selectedStars.filter(s => s !== star))}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#003580]/10 text-[#003580] rounded text-xs font-medium hover:bg-[#003580]/20"
            >
              {star} star{star > 1 ? "s" : ""}
              <X className="w-3 h-3" />
            </button>
          ))}
          {freeCancellationOnly && (
            <button
              onClick={() => setFreeCancellationOnly(false)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#003580]/10 text-[#003580] rounded text-xs font-medium hover:bg-[#003580]/20"
            >
              Free cancellation
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedReviewScore && (
            <button
              onClick={() => setSelectedReviewScore(null)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#003580]/10 text-[#003580] rounded text-xs font-medium hover:bg-[#003580]/20"
            >
              {selectedReviewScore}+ rating
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-[#0071c2] hover:underline font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 1. Budget (per night) - Dual handle range slider */}
      <div className="pb-5 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-4 text-gray-900">Your budget (per night)</h3>
        <DualRangeSlider
          min={minPrice}
          max={maxPrice}
          value={priceRange}
          onChange={setPriceRange}
          currency={currency}
        />
      </div>

      {/* 2. Popular Filters */}
      <div className="pb-5 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-3 text-gray-900">Popular filters</h3>
        <div className="space-y-1">
          {POPULAR_FILTERS.map((filter) => {
            const Icon = filter.icon;
            let count = 0;
            if (filter.id === "freeCancellation") count = freeCancelCount;
            else if (filter.id === "breakfast") count = hotels.filter(h =>
              h.mealPlan.toLowerCase().includes("breakfast") ||
              h.amenities.some(a => a.toLowerCase().includes("breakfast"))
            ).length;
            else count = hotels.filter(h =>
              h.amenities.some(a => a.toLowerCase().includes(filter.id))
            ).length;

            return (
              <FilterCheckbox
                key={filter.id}
                checked={selectedPopularFilters.includes(filter.id)}
                onChange={() => togglePopularFilter(filter.id)}
                label={filter.label}
                count={count}
                icon={<Icon className="w-4 h-4" />}
              />
            );
          })}
        </div>
      </div>

      {/* 3. Star Rating */}
      <div className="pb-5 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-3 text-gray-900">Star rating</h3>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <FilterCheckbox
              key={star}
              checked={selectedStars.includes(star)}
              onChange={(checked) => {
                if (checked) {
                  setSelectedStars([...selectedStars, star]);
                } else {
                  setSelectedStars(selectedStars.filter((s) => s !== star));
                }
              }}
              label=""
              count={starCounts[star]}
              icon={
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: star }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#feba02] text-[#feba02]" />
                  ))}
                </div>
              }
            />
          ))}
        </div>
      </div>

      {/* 4. Guest Review Score */}
      <div className="pb-5 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-3 text-gray-900">Guest review score</h3>
        <div className="space-y-1">
          {[
            { score: 9, label: "Superb: 9+" },
            { score: 8, label: "Very Good: 8+" },
            { score: 7, label: "Good: 7+" },
            { score: 6, label: "Pleasant: 6+" },
          ].map(({ score, label }) => (
            <FilterCheckbox
              key={score}
              checked={selectedReviewScore === score}
              onChange={(checked) => setSelectedReviewScore(checked ? score : null)}
              label={label}
              count={reviewScoreCounts[score as keyof typeof reviewScoreCounts]}
            />
          ))}
        </div>
      </div>

      {/* 5. Property Type */}
      <div className="pb-5 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-3 text-gray-900">Property type</h3>
        <div className="space-y-1">
          {PROPERTY_TYPES.map((type) => (
            <FilterCheckbox
              key={type.id}
              checked={selectedPropertyTypes.includes(type.id)}
              onChange={() => togglePropertyType(type.id)}
              label={type.label}
              count={Math.floor(hotels.length / PROPERTY_TYPES.length)}
            />
          ))}
        </div>
      </div>

      {/* 6. Amenities (additional) */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-gray-900">Room amenities</h3>
        <div className="space-y-1">
          {["Air conditioning", "Kitchen", "Private bathroom", "Balcony"].map((amenity, idx) => (
            <FilterCheckbox
              key={amenity}
              checked={false}
              onChange={() => {}}
              label={amenity}
              count={Math.max(1, Math.floor(hotels.length * (0.3 + idx * 0.15)))}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[280px] flex-shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
          <h2 className="font-bold text-base mb-4 text-gray-900">Filter by:</h2>
          {filterContent}
        </div>
      </div>

      {/* Mobile Filters Drawer - from bottom */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5">{filterContent}</div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
              <Button
                className="flex-1"
                style={{ backgroundColor: GH_ORANGE }}
                onClick={() => setShowMobileFilters(false)}
              >
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sort options type
type SortOption = "topPicks" | "price" | "bestReviewed" | "distance" | "stars";

function HotelsContent() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [selectedPopularFilters, setSelectedPopularFilters] = useState<string[]>([]);
  const [selectedReviewScore, setSelectedReviewScore] = useState<number | null>(null);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("topPicks");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("departureDate") || searchParams.get("checkIn");
  const checkOut = searchParams.get("returnDate") || searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  // Calculate min/max prices (per night for the slider)
  const minPrice = useMemo(() => {
    if (hotels.length === 0) return 0;
    return Math.floor(Math.min(...hotels.map((h) => h.pricePerNight)));
  }, [hotels]);

  const maxPrice = useMemo(() => {
    if (hotels.length === 0) return 1000;
    return Math.ceil(Math.max(...hotels.map((h) => h.pricePerNight)));
  }, [hotels]);

  // Reset price range when hotels change
  useEffect(() => {
    if (hotels.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [hotels.length, minPrice, maxPrice]);

  // Filtered and sorted hotels
  const filteredHotels = useMemo(() => {
    let result = hotels;

    // Filter by star rating
    if (selectedStars.length > 0) {
      result = result.filter((h) => selectedStars.includes(h.starRating));
    }

    // Filter by free cancellation
    if (freeCancellationOnly || selectedPopularFilters.includes("freeCancellation")) {
      result = result.filter((h) => h.freeCancellation);
    }

    // Filter by breakfast
    if (selectedPopularFilters.includes("breakfast")) {
      result = result.filter((h) =>
        h.mealPlan.toLowerCase().includes("breakfast") ||
        h.amenities.some(a => a.toLowerCase().includes("breakfast"))
      );
    }

    // Filter by other amenities
    const amenityFilters = ["pool", "wifi", "parking"].filter(f => selectedPopularFilters.includes(f));
    if (amenityFilters.length > 0) {
      result = result.filter((h) =>
        amenityFilters.every(filter =>
          h.amenities.some(a => a.toLowerCase().includes(filter))
        )
      );
    }

    // Filter by price (per night)
    result = result.filter((h) => h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1]);

    // Filter by review score
    if (selectedReviewScore !== null) {
      result = result.filter((h) => generateReviewScore(h.id) >= selectedReviewScore);
    }

    // Sort
    switch (sortBy) {
      case "price":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "stars":
        result = [...result].sort((a, b) => b.starRating - a.starRating);
        break;
      case "bestReviewed":
        result = [...result].sort((a, b) => generateReviewScore(b.id) - generateReviewScore(a.id));
        break;
      case "distance":
        // Simulated distance sorting
        result = [...result].sort((a, b) => a.id.localeCompare(b.id));
        break;
      case "topPicks":
      default:
        // Default sorting - mix of rating, reviews, and price
        result = [...result].sort((a, b) => {
          const scoreA = generateReviewScore(a.id) * 10 - a.pricePerNight / 100;
          const scoreB = generateReviewScore(b.id) * 10 - b.pricePerNight / 100;
          return scoreB - scoreA;
        });
        break;
    }

    return result;
  }, [hotels, selectedStars, freeCancellationOnly, selectedPopularFilters, priceRange, selectedReviewScore, sortBy]);

  useEffect(() => {
    if (!destination || !checkIn || !checkOut) {
      setHotels([]);
      setLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          destination,
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(),
          rooms: rooms.toString(),
          currency,
        });

        const response = await fetch(`/api/search/hotels?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch hotels");
        }

        setHotels(data.data || []);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch hotels");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [destination, checkIn, checkOut, adults, children, rooms, currency]);

  const hasSearchParams = destination && checkIn && checkOut;

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      {/* Search Form - Booking.com blue header */}
      <section style={{ backgroundColor: BOOKING_BLUE }} className="py-6">
        <div className="container-wide">
          <SearchForm defaultType="hotels" />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-6 min-h-[60vh]" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="container-wide">
          {/* Results Header */}
          <div className="flex flex-col gap-4 mb-5">
            {/* Title Row */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {hasSearchParams ? (
                  <>{destination}: {hotels.length} properties found</>
                ) : (
                  "Search Hotels"
                )}
              </h1>
              {hasSearchParams && !loading && !error && (
                <p className="text-sm text-gray-600 mt-1">
                  {checkIn} - {checkOut} {nights > 0 && `(${nights} night${nights > 1 ? "s" : ""})`}
                </p>
              )}
              {!hasSearchParams && (
                <p className="text-sm text-gray-600 mt-1">
                  Enter your destination and dates to find available hotels
                </p>
              )}
            </div>

            {/* Sorting Bar */}
            {hasSearchParams && !loading && hotels.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                <div className="flex items-center gap-2">
                  {/* Mobile Filter Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden flex items-center gap-2"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-sm bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]"
                    >
                      <option value="topPicks">Our top picks</option>
                      <option value="price">Price (lowest first)</option>
                      <option value="bestReviewed">Best reviewed</option>
                      <option value="stars">Property rating</option>
                      <option value="distance">Distance from center</option>
                    </select>
                  </div>
                </div>

                {/* Map Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setShowMap(!showMap)}
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">{showMap ? "Show list" : "Show on map"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Main Content - Sidebar + Results */}
          <div className="flex gap-5">
            {/* Filters Sidebar - Left */}
            {hasSearchParams && !loading && !error && hotels.length > 0 && (
              <FiltersPanel
                hotels={hotels}
                selectedStars={selectedStars}
                setSelectedStars={setSelectedStars}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                maxPrice={maxPrice}
                minPrice={minPrice}
                freeCancellationOnly={freeCancellationOnly}
                setFreeCancellationOnly={setFreeCancellationOnly}
                showMobileFilters={showMobileFilters}
                setShowMobileFilters={setShowMobileFilters}
                selectedPopularFilters={selectedPopularFilters}
                setSelectedPopularFilters={setSelectedPopularFilters}
                selectedReviewScore={selectedReviewScore}
                setSelectedReviewScore={setSelectedReviewScore}
                selectedPropertyTypes={selectedPropertyTypes}
                setSelectedPropertyTypes={setSelectedPropertyTypes}
                currency={currency}
              />
            )}

            {/* Results List - Right */}
            <div className="flex-1 min-w-0">
              {/* No Search Yet */}
              {!hasSearchParams && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                  <Building className="w-16 h-16 mx-auto mb-4" style={{ color: BOOKING_BLUE, opacity: 0.3 }} />
                  <h2 className="text-xl font-bold mb-2 text-gray-900">Start Your Hotel Search</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Enter your destination, check-in and check-out dates to discover available hotels.
                  </p>
                </div>
              )}

              {/* Loading - Skeleton cards */}
              {hasSearchParams && loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <HotelCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error */}
              {hasSearchParams && !loading && error && (
                <div className="bg-white rounded-lg p-12 text-center border border-red-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2 text-gray-900">Something went wrong</h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <Button style={{ backgroundColor: GH_ORANGE }} asChild>
                    <a href="tel:+442089444555" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Call for Assistance
                    </a>
                  </Button>
                </div>
              )}

              {/* Results */}
              {hasSearchParams && !loading && !error && filteredHotels.length > 0 && (
                <div className="space-y-4">
                  {/* Results count */}
                  <div className="text-sm text-gray-600">
                    {filteredHotels.length === hotels.length ? (
                      <span>Showing all {hotels.length} properties</span>
                    ) : (
                      <span>Showing {filteredHotels.length} of {hotels.length} properties</span>
                    )}
                  </div>

                  {/* Hotel Cards */}
                  {filteredHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      currency={currency}
                      destination={destination || ""}
                      checkIn={checkIn || ""}
                      checkOut={checkOut || ""}
                      rooms={rooms}
                      adults={adults}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {hasSearchParams && !loading && !error && hotels.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                  <Building className="w-16 h-16 mx-auto mb-4" style={{ color: "#ccc" }} />
                  <h2 className="text-xl font-bold mb-2 text-gray-900">No hotels found</h2>
                  <p className="text-gray-600 mb-6">
                    We couldn&apos;t find hotels for this destination. Try different dates or contact us for assistance.
                  </p>
                  <Button style={{ backgroundColor: GH_ORANGE }} asChild>
                    <a href="tel:+442089444555" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Call 020 8944 4555
                    </a>
                  </Button>
                </div>
              )}

              {/* No filtered results */}
              {hasSearchParams && !loading && !error && hotels.length > 0 && filteredHotels.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                  <Filter className="w-16 h-16 mx-auto mb-4" style={{ color: "#ccc" }} />
                  <h2 className="text-xl font-bold mb-2 text-gray-900">No hotels match your filters</h2>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filter criteria to see more results.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedStars([]);
                      setFreeCancellationOnly(false);
                      setPriceRange([minPrice, maxPrice]);
                      setSelectedPopularFilters([]);
                      setSelectedReviewScore(null);
                      setSelectedPropertyTypes([]);
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Help Banner */}
              {hasSearchParams && !loading && !error && filteredHotels.length > 0 && (
                <div
                  className="mt-8 rounded-lg p-6 md:p-8 text-white"
                  style={{ backgroundColor: BOOKING_BLUE }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Need help finding the perfect hotel?</h2>
                      <p className="text-white/80 text-sm">
                        Our accommodation specialists can help you find hotels that match your preferences and budget.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="flex-shrink-0"
                      style={{ backgroundColor: GH_ORANGE, color: "#ffffff" }}
                      asChild
                    >
                      <a href="tel:+442089444555" className="flex items-center gap-2 font-bold">
                        <Phone className="h-5 w-5" />
                        020 8944 4555
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BOOKING_BLUE }} />
      </div>
    }>
      <HotelsContent />
    </Suspense>
  );
}
