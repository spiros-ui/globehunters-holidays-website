"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  ChevronRight,
  ChevronLeft,
  Heart,
  Check,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, cn } from "@/lib/utils";
import type { HotelCardProps } from "./types";
import {
  BOOKING_BLUE,
  BOOKING_GREEN,
  GH_ORANGE,
  HOTEL_PLACEHOLDER,
  PREMIUM_AMENITIES,
  SUSTAINABILITY_KEYWORDS,
} from "./constants";
import { calculateDistance, getAmenityIcon } from "./utils";

export function HotelCard({
  hotel,
  currency,
  destination,
  checkIn,
  checkOut,
  rooms = 1,
  adults,
  children = 0,
  childAges,
  centerLat,
  centerLon,
  avgPrice,
  onShowOnMap,
}: HotelCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const allImages = hotel.images.length > 0
    ? hotel.images
    : (hotel.mainImage ? [hotel.mainImage] : [HOTEL_PLACEHOLDER]);
  const displayImages = imageError ? [HOTEL_PLACEHOLDER] : allImages;

  // Check if this hotel is a great deal (15% below average price)
  const isDeal = avgPrice ? hotel.pricePerNight < avgPrice * 0.85 : false;

  // Check if this is a popular choice (4+ stars with premium amenities)
  const hasPremiumAmenities = PREMIUM_AMENITIES.filter(a =>
    hotel.amenities.some(ha => ha.toLowerCase().includes(a.toLowerCase()))
  ).length >= 2;
  const isPopular = hotel.starRating >= 4 && hasPremiumAmenities;

  // Check if hotel has sustainability features
  const isSustainable = hotel.amenities.some(a =>
    SUSTAINABILITY_KEYWORDS.some(keyword => a.toLowerCase().includes(keyword))
  );

  // Check if breakfast is included in amenities or meal plan
  const hasBreakfast = hotel.mealPlan.toLowerCase().includes("breakfast") ||
    hotel.amenities.some(a => a === "Breakfast");

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
        {/* Image Gallery - Left side */}
        <div className="relative w-full md:w-[280px] lg:w-[320px] h-52 md:h-[220px] flex-shrink-0 group">
          <Image
            src={displayImages[currentImageIndex] ?? displayImages[0]}
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

          {/* Deal and Popular Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {isDeal && (
              <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs font-bold px-2 py-1">
                Great Deal
              </Badge>
            )}
            {isPopular && !isDeal && (
              <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs font-bold px-2 py-1">
                Popular
              </Badge>
            )}
          </div>
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
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-[#0071c2] mb-2 flex-wrap">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="underline cursor-pointer">
              {hotel.city}{hotel.country ? `, ${hotel.country}` : ""}
            </span>
            {centerLat && centerLon && hotel.latitude && hotel.longitude && (
              <span className="text-gray-500">
                - {calculateDistance(hotel.latitude, hotel.longitude, centerLat, centerLon).toFixed(1)} km from center
              </span>
            )}
            <button
              className="text-[#0071c2] hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                if (onShowOnMap) {
                  onShowOnMap(hotel.id);
                }
              }}
            >
              - Show on map
            </button>
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
            {isSustainable && (
              <span className="text-xs font-medium text-green-700">
                <Leaf className="w-3 h-3 inline mr-0.5" />
                Travel Sustainable
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

          {/* Room Type and Meal Plan */}
          <div className="text-sm text-gray-700 mb-1">
            <span className="font-medium">{hotel.roomType}</span>
            {hotel.mealPlan && hotel.mealPlan !== "Room Only" && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">
                {hotel.mealPlan}
              </span>
            )}
            {hotel.mealPlan === "Room Only" && (
              <span className="ml-2 text-xs text-gray-500">
                · Room only
              </span>
            )}
          </div>

          {/* Stay Info */}
          <div className="text-xs text-gray-500 mb-2">
            {hotel.nights} night{hotel.nights > 1 ? "s" : ""}, {hotel.guests?.adults || adults} adult{(hotel.guests?.adults || adults) !== 1 ? "s" : ""}{(hotel.guests?.children || children) > 0 ? `, ${hotel.guests?.children || children} child${(hotel.guests?.children || children) !== 1 ? "ren" : ""}` : ""}, {hotel.guests?.rooms || rooms} room{(hotel.guests?.rooms || rooms) > 1 ? "s" : ""}
          </div>
        </div>

        {/* Price Column - Right side */}
        <div className="md:w-40 lg:w-44 p-4 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/50">
          <div className="text-right">
            {/* Current Price */}
            <div className="text-xl lg:text-2xl font-bold text-gray-900">
              {formatPrice(hotel.price, currency)}
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
              children: String(children),
              ...(childAges ? { childAges } : {}),
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
