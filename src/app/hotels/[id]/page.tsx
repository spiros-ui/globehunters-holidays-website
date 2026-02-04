"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Star,
  ArrowLeft,
  Loader2,
  Check,
  Wifi,
  Coffee,
  Car,
  Waves,
  Dumbbell,
  Utensils,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Shield,
  ThumbsUp,
  Headphones,
  Camera,
  Sparkles,
  ParkingCircle,
  AirVent,
  ConciergeBell,
  Plane,
  Dog,
  ShowerHead,
  Building2,
  Accessibility,
  Palmtree,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";
import dynamic from "next/dynamic";
import { ReferenceNumber } from "@/components/ui/ReferenceNumber";

// Dynamic import of HotelMap to avoid SSR issues with Leaflet
const HotelMap = dynamic(() => import("@/components/hotels/HotelMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#003580]" />
    </div>
  ),
});

// ============================================================================
// Types
// ============================================================================

interface AmenityGroup {
  group_name: string;
  amenities: string[];
}

interface DescriptionSection {
  title: string;
  paragraphs: string[];
}

interface HotelDetailData {
  id: string;
  name: string;
  address: string;
  star_rating: number;
  latitude: number;
  longitude: number;
  images: string[];
  images_large: string[];
  amenity_groups: AmenityGroup[];
  description_struct: DescriptionSection[];
  check_in_time: string;
  check_out_time: string;
  hotel_chain: string;
  phone: string;
  email: string;
  front_desk_time_start: string;
  front_desk_time_end: string;
  postal_code: string;
  kind: string;
  region_name: string;
}

interface RateInfo {
  roomName: string;
  mealPlan: string;
  totalPrice: number;
  pricePerNight: number;
  freeCancellation: boolean;
  cancellationDeadline: string | null;
  paymentType: string;
}

// ============================================================================
// Amenity icon mapping
// ============================================================================

const amenityIconMap: Record<string, React.ReactNode> = {
  "wi-fi": <Wifi className="w-5 h-5" />,
  wifi: <Wifi className="w-5 h-5" />,
  internet: <Wifi className="w-5 h-5" />,
  breakfast: <Coffee className="w-5 h-5" />,
  buffet: <Coffee className="w-5 h-5" />,
  parking: <ParkingCircle className="w-5 h-5" />,
  pool: <Waves className="w-5 h-5" />,
  swimming: <Waves className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  fitness: <Dumbbell className="w-5 h-5" />,
  restaurant: <Utensils className="w-5 h-5" />,
  bar: <Utensils className="w-5 h-5" />,
  spa: <Sparkles className="w-5 h-5" />,
  sauna: <Sparkles className="w-5 h-5" />,
  "air conditioning": <AirVent className="w-5 h-5" />,
  "room service": <ConciergeBell className="w-5 h-5" />,
  "airport shuttle": <Plane className="w-5 h-5" />,
  pet: <Dog className="w-5 h-5" />,
  laundry: <ShowerHead className="w-5 h-5" />,
  "business center": <Building2 className="w-5 h-5" />,
  "24-hour": <Clock className="w-5 h-5" />,
  reception: <Clock className="w-5 h-5" />,
  beach: <Palmtree className="w-5 h-5" />,
  wheelchair: <Accessibility className="w-5 h-5" />,
  family: <Bed className="w-5 h-5" />,
};

function getAmenityIcon(amenityName: string): React.ReactNode {
  const lower = amenityName.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return <Check className="w-5 h-5" />;
}

// ============================================================================
// Fullscreen Gallery Modal
// ============================================================================

function GalleryModal({
  images,
  initialIndex,
  onClose,
  hotelName,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  hotelName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, handlePrev, handleNext]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {currentIndex + 1} / {images.length} &mdash; {hotelName}
        </span>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close gallery"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative px-16">
        <button
          onClick={handlePrev}
          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-5xl aspect-[16/10]">
          <Image
            src={images[currentIndex]}
            alt={`${hotelName} - Photo ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />
        </div>

        <button
          onClick={handleNext}
          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 justify-center">
          {images.slice(0, 20).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="bg-[#f5f5f5] py-3 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="h-8 w-80 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-60 bg-gray-200 rounded" />
      </div>

      {/* Gallery skeleton */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-lg overflow-hidden">
          <div className="col-span-2 row-span-2 bg-gray-200" />
          <div className="bg-gray-200" />
          <div className="bg-gray-200" />
          <div className="bg-gray-200" />
          <div className="bg-gray-200" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-4/6 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-56 bg-gray-200 rounded" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Content Component
// ============================================================================

function HotelDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [hotelData, setHotelData] = useState<HotelDetailData | null>(null);
  const [rates, setRates] = useState<RateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Get data from search params (fallback)
  const spName = searchParams.get("name") || "Hotel";
  const spThumbnail = searchParams.get("thumbnail") || "";
  const spAddress = searchParams.get("address") || "";
  const spCityName = searchParams.get("cityName") || "";
  const spDestination = searchParams.get("destination") || "";
  const spStarRating = parseInt(searchParams.get("starRating") || "0");
  const pricePerNight = parseFloat(searchParams.get("pricePerNight") || "0");
  const boardType = searchParams.get("boardType") || "Room Only";
  const refundable = searchParams.get("refundable") === "true";
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const nights = parseInt(searchParams.get("nights") || "7");
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");

  // Use API rates if available, otherwise fall back to search params
  const cheapestRate = rates.length > 0 ? rates[0] : null;
  const displayPricePerNight = cheapestRate ? cheapestRate.pricePerNight : pricePerNight;
  const totalPrice = cheapestRate ? cheapestRate.totalPrice : pricePerNight * nights;
  const displayRefundable = cheapestRate ? cheapestRate.freeCancellation : refundable;

  // Fetch hotel detail and rates from API
  useEffect(() => {
    async function fetchHotelDetail() {
      try {
        const params = new URLSearchParams();
        if (checkIn) params.set("checkIn", checkIn);
        if (checkOut) params.set("checkOut", checkOut);
        params.set("adults", String(adults));
        params.set("children", String(children));
        params.set("rooms", String(rooms));
        params.set("currency", currency);

        const res = await fetch(`/api/search/hotels/${encodeURIComponent(id)}?${params}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status && json.data) {
            setHotelData(json.data);
          }
          if (json.rates && json.rates.length > 0) {
            setRates(json.rates);
          }
        }
      } catch {
        // Fallback to search params data
      } finally {
        setLoading(false);
      }
    }
    fetchHotelDetail();
  }, [id, checkIn, checkOut, adults, children, rooms, currency]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Derive display values - prefer API data, fallback to search params
  const name = hotelData?.name || spName;
  const address = hotelData?.address || spAddress;
  const starRating = hotelData?.star_rating || spStarRating;
  const cityName = hotelData?.region_name || spCityName;
  const destination = spDestination;
  const images = hotelData?.images || (spThumbnail ? [spThumbnail] : []);
  const imagesLarge = hotelData?.images_large || images;
  const amenityGroups = hotelData?.amenity_groups || [];
  const descriptionStruct = hotelData?.description_struct || [];
  const checkInTime = hotelData?.check_in_time || "";
  const checkOutTime = hotelData?.check_out_time || "";
  const hotelChain = hotelData?.hotel_chain || "";
  const propertyKind = hotelData?.kind || "";

  // Build flat amenities list for the "most popular" section
  const allAmenities: string[] = [];
  for (const group of amenityGroups) {
    allAmenities.push(...group.amenities);
  }
  const popularAmenities = allAmenities.slice(0, 12);

  // Build description text
  const descriptionParagraphs: { title: string; text: string }[] = [];
  for (const section of descriptionStruct) {
    if (section.paragraphs.length > 0) {
      descriptionParagraphs.push({
        title: section.title,
        text: section.paragraphs.join(" "),
      });
    }
  }

  // Gallery display images (max 5 for the grid)
  const galleryImages = images.slice(0, 5);
  const remainingPhotos = images.length - 5;

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  // Format check-in/out dates nicely
  function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <>
      {/* Gallery Modal */}
      {galleryOpen && imagesLarge.length > 0 && (
        <GalleryModal
          images={imagesLarge}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
          hotelName={name}
        />
      )}

      {/* Breadcrumb */}
      <div className="bg-[#f5f5f5] py-3 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 text-[#0071c2] hover:text-[#003580] text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search results
          </Link>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {/* Star rating + hotel type badge */}
              <div className="flex items-center gap-2 mb-1">
                {starRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: starRating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-[#feba02] text-[#feba02]"
                      />
                    ))}
                  </div>
                )}
                {propertyKind && (
                  <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">
                    {propertyKind}
                  </Badge>
                )}
                {hotelChain && (
                  <Badge className="bg-[#003580]/10 text-[#003580] border-0 text-xs">
                    {hotelChain}
                  </Badge>
                )}
              </div>

              {/* Hotel name */}
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-1">
                {name}
              </h1>

              {/* Address */}
              {address && (
                <div className="flex items-center gap-1.5 text-[#0071c2] text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {address}
                    {cityName && !address.toLowerCase().includes(cityName.toLowerCase())
                      ? `, ${cityName}`
                      : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Price quick glance (mobile) */}
            {displayPricePerNight > 0 && (
              <div className="lg:hidden text-right">
                <div className="text-sm text-gray-500">from</div>
                <div className="text-2xl font-bold text-[#1a1a2e]">
                  {formatPrice(displayPricePerNight, currency)}
                </div>
                <div className="text-xs text-gray-500">per night</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Web Reference Number - Unique per hotel page */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <ReferenceNumber searchType="hotels" />
      </div>

      {/* Image Gallery - Booking.com Style */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            {/* Large main image */}
            <button
              onClick={() => openGallery(0)}
              className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden"
            >
              <Image
                src={galleryImages[0]}
                alt={`${name} - Main photo`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 640px"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>

            {/* 4 smaller thumbnails */}
            {[1, 2, 3, 4].map((idx) => {
              const img = galleryImages[idx];
              const isLast = idx === 4;
              const showOverlay = isLast && remainingPhotos > 0;

              if (!img) {
                return (
                  <div
                    key={idx}
                    className="relative bg-gray-100 flex items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-gray-300" />
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={() => openGallery(idx)}
                  className="relative group cursor-pointer overflow-hidden"
                >
                  <Image
                    src={img}
                    alt={`${name} - Photo ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 25vw, 320px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {showOverlay && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        +{remainingPhotos} photos
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-[300px] md:h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p>No photos available</p>
            </div>
          </div>
        )}
      </div>

      {/* Hotel Location Map */}
      {(hotelData?.latitude || address) && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0071c2]" />
            Location
          </h2>
          <HotelMap
            hotels={[{
              id: id,
              name: name,
              lat: hotelData?.latitude,
              lng: hotelData?.longitude,
              starRating: starRating,
              mainImage: images[0],
              address: address,
            }]}
            destination={cityName || address}
            singleHotel={true}
            showCloseButton={false}
            height="300px"
          />
          {address && (
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {address}{cityName && !address.toLowerCase().includes(cityName.toLowerCase()) ? `, ${cityName}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Content Section - Two Columns */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Hotel Description */}
            {descriptionParagraphs.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">
                  About this property
                </h2>
                <div className="space-y-4">
                  {descriptionParagraphs.map((section, idx) => (
                    <div key={idx}>
                      {section.title && (
                        <h3 className="font-semibold text-[#1a1a2e] mb-1">
                          {section.title}
                        </h3>
                      )}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {section.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Popular Facilities */}
            {popularAmenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">
                  Most popular facilities
                </h2>
                <div className="flex flex-wrap gap-3">
                  {popularAmenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#f5f5f5] rounded text-sm text-[#1a1a2e]"
                    >
                      <span className="text-[#0071c2]">
                        {getAmenityIcon(amenity)}
                      </span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Amenity Groups */}
            {amenityGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">
                  Property amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {amenityGroups.map((group, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-[#1a1a2e] mb-2 text-sm">
                        {group.group_name}
                      </h3>
                      <ul className="space-y-1">
                        {group.amenities.map((amenity, aidx) => (
                          <li
                            key={aidx}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <Check className="w-3.5 h-3.5 text-[#008009] flex-shrink-0" />
                            {amenity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-in / Check-out Times */}
            {(checkInTime || checkOutTime) && (
              <div className="border border-gray-200 rounded-lg p-5">
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">
                  House rules
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {checkInTime && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#f5f5f5] rounded">
                        <Clock className="w-5 h-5 text-[#003580]" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#1a1a2e]">
                          Check-in
                        </div>
                        <div className="text-sm text-gray-600">
                          From {checkInTime}
                        </div>
                      </div>
                    </div>
                  )}
                  {checkOutTime && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#f5f5f5] rounded">
                        <Clock className="w-5 h-5 text-[#003580]" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#1a1a2e]">
                          Check-out
                        </div>
                        <div className="text-sm text-gray-600">
                          Until {checkOutTime}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Room Availability / Booking Section */}
            {(rates.length > 0 || pricePerNight > 0) && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-[#003580] text-white px-5 py-3">
                  <h2 className="text-lg font-bold">Availability</h2>
                  {checkIn && checkOut && (
                    <p className="text-sm text-white/80 mt-0.5">
                      {formatDisplayDate(checkIn)} &mdash;{" "}
                      {formatDisplayDate(checkOut)} &middot; {nights} night
                      {nights !== 1 ? "s" : ""} &middot; {adults} adult
                      {adults !== 1 ? "s" : ""}{children > 0 ? ` · ${children} child${children !== 1 ? "ren" : ""}` : ""} &middot; {rooms} room
                      {rooms !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f5f5f5] border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-[#1a1a2e]">
                          Room type
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#1a1a2e]">
                          Board basis
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#1a1a2e]">
                          Conditions
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-[#1a1a2e]">
                          Price ({nights} nights)
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rates.length > 0 ? (
                        rates.map((rate, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-[#fafafa]">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-[#0071c2]">
                                {rate.roomName}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {adults} adult{adults !== 1 ? "s" : ""}{children > 0 ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                {rate.mealPlan !== "Room Only" ? (
                                  <>
                                    <Coffee className="w-4 h-4 text-[#008009]" />
                                    <span className="text-[#008009] font-medium">{rate.mealPlan}</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">{rate.mealPlan}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {rate.freeCancellation ? (
                                <div>
                                  <div className="flex items-center gap-1.5 text-[#008009]">
                                    <Check className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                      Free cancellation
                                    </span>
                                  </div>
                                  {rate.cancellationDeadline && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      until {new Date(rate.cancellationDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  Non-refundable
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="font-bold text-lg text-[#1a1a2e]">
                                {formatPrice(rate.totalPrice, currency)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatPrice(rate.pricePerNight, currency)} per night
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                className="text-white font-semibold whitespace-nowrap"
                                style={{ backgroundColor: "#f97316" }}
                                asChild
                              >
                                <a
                                  href="tel:+442089444555"
                                  className="flex items-center gap-1.5"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  Call to Book
                                </a>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-gray-100 hover:bg-[#fafafa]">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-[#0071c2]">
                              Standard Room
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {adults} adult{adults !== 1 ? "s" : ""}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <Coffee className="w-4 h-4 text-[#008009]" />
                              <span>{boardType}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {refundable ? (
                              <div className="flex items-center gap-1.5 text-[#008009]">
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-medium">
                                  Free cancellation
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Non-refundable
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="font-bold text-lg text-[#1a1a2e]">
                              {formatPrice(totalPrice, currency)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatPrice(pricePerNight, currency)} per night
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              size="sm"
                              className="text-white font-semibold whitespace-nowrap"
                              style={{ backgroundColor: "#f97316" }}
                              asChild
                            >
                              <a
                                href="tel:+442089444555"
                                className="flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                Call to Book
                              </a>
                            </Button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sticky Booking Card */}
          <div className="lg:order-last">
            <div className="sticky top-6 space-y-4">
              {/* Booking summary card */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                {/* Star rating header */}
                {starRating > 0 && (
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: starRating }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-[#feba02] text-[#feba02]" />
                      ))}
                      <span className="text-sm text-gray-500 ml-1">{starRating}-star hotel</span>
                    </div>
                  </div>
                )}

                {/* Price */}
                {displayPricePerNight > 0 && (
                  <div className="p-4 border-b border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">
                      {nights} night{nights !== 1 ? "s" : ""}, {adults} adult{adults !== 1 ? "s" : ""}{children > 0 ? `, ${children} child${children !== 1 ? "ren" : ""}` : ""}, {rooms} room
                      {rooms !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">from</div>
                    <div className="text-3xl font-bold text-[#1a1a2e]">
                      {formatPrice(totalPrice, currency)}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {formatPrice(displayPricePerNight, currency)} per night
                    </div>
                    {displayRefundable && (
                      <div className="flex items-center gap-1.5 mt-2 text-[#008009]">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-medium">
                          Free cancellation available
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Check-in/out dates */}
                {(checkIn || checkOut) && (
                  <div className="p-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      {checkIn && (
                        <div>
                          <div className="text-xs text-gray-500 font-medium">
                            Check-in
                          </div>
                          <div className="text-sm font-semibold text-[#1a1a2e]">
                            {formatDisplayDate(checkIn)}
                          </div>
                          {checkInTime && (
                            <div className="text-xs text-gray-500">
                              From {checkInTime}
                            </div>
                          )}
                        </div>
                      )}
                      {checkOut && (
                        <div>
                          <div className="text-xs text-gray-500 font-medium">
                            Check-out
                          </div>
                          <div className="text-sm font-semibold text-[#1a1a2e]">
                            {formatDisplayDate(checkOut)}
                          </div>
                          {checkOutTime && (
                            <div className="text-xs text-gray-500">
                              Until {checkOutTime}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="p-4">
                  <Button
                    size="lg"
                    className="w-full text-white font-bold"
                    style={{ backgroundColor: "#f97316" }}
                    asChild
                  >
                    <a
                      href="tel:+442089444555"
                      className="flex items-center justify-center gap-2"
                    >
                      <Phone className="h-5 w-5" />
                      Call to Book
                    </a>
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    020 8944 4555
                  </p>
                </div>
              </div>

              {/* Why book with us */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-bold text-sm text-[#1a1a2e] mb-3">
                  Why book with us?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <ThumbsUp className="w-4 h-4 text-[#0071c2] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      Personalized service from travel experts
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-[#0071c2] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      Best price guarantee
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Plane className="w-4 h-4 text-[#0071c2] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      ATOL protected holidays
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Headphones className="w-4 h-4 text-[#0071c2] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      24/7 customer support
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA bar */}
      <div className="bg-[#003580] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Ready to book your stay at {name}?
          </h2>
          <p className="text-white/70 mb-5 max-w-xl mx-auto text-sm">
            Our accommodation specialists are ready to help you secure the best
            rates and customise your booking.
          </p>
          <Button
            size="lg"
            className="text-white font-bold"
            style={{ backgroundColor: "#f97316" }}
            asChild
          >
            <a
              href="tel:+442089444555"
              className="flex items-center gap-2"
            >
              <Phone className="h-5 w-5" />
              Call 020 8944 4555
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Page Component
// ============================================================================

export default function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071c2]" />
        </div>
      }
    >
      <HotelDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
