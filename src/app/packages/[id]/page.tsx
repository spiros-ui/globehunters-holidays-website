"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Calendar,
  Star,
  Plane,
  Building,
  Camera,
  Check,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface FlightLeg {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  departureDate?: string;
}

interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
}

interface PackageFlight {
  id: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo: string;
  price: number;
  basePrice?: number;
  stops: number;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  segments?: FlightSegment[];
  returnSegments?: FlightSegment[];
}

interface PackageHotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  mainImage: string | null;
  images: string[];
  price: number;
  basePrice?: number;
  pricePerNight: number;
  roomType: string;
  mealPlan: string;
  freeCancellation: boolean;
}

interface Attraction {
  id: string;
  name: string;
  category: string;
  kinds: string;
  description: string;
  image: string | null;
  rating: string;
  price: number;
  currency: string;
}

interface PackageData {
  id: string;
  name: string;
  theme: string;
  tagline: string;
  description: string;
  destination: string;
  destinationCountry: string;
  nights: number;
  days: number;
  flight: PackageFlight;
  hotel: PackageHotel;
  attractions: Attraction[];
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  includes: string[];
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());

  if (images.length === 0) {
    return (
      <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center rounded-lg">
        <Camera className="h-16 w-16 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
        {!errors.has(current) ? (
          <Image
            src={images[current]}
            alt={`${name} - Photo ${current + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            onError={() => setErrors((prev) => new Set(prev).add(current))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Camera className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`relative w-16 h-12 rounded overflow-hidden flex-shrink-0 border-2 ${
                idx === current ? "border-[#f97316]" : "border-transparent"
              }`}
            >
              {!errors.has(idx) ? (
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  onError={() => setErrors((prev) => new Set(prev).add(idx))}
                />
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageDetailContent() {
  const searchParams = useSearchParams();
  const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set());

  // Parse package data from URL
  const dataParam = searchParams.get("data");
  let pkg: PackageData | null = null;

  try {
    if (dataParam) {
      const parsed = JSON.parse(dataParam);
      pkg = {
        ...parsed,
        nights: parseInt(parsed.nights) || parsed.nights,
        days: parseInt(parsed.days) || parsed.days,
        totalPrice: typeof parsed.totalPrice === "string" ? parseInt(parsed.totalPrice) : parsed.totalPrice,
        pricePerPerson: typeof parsed.pricePerPerson === "string" ? parseInt(parsed.pricePerPerson) : parsed.pricePerPerson,
      };
    }
  } catch {
    pkg = null;
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F6FA]">
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Package Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">
            This package may have expired. Please search again for available packages.
          </p>
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white font-semibold text-sm"
            style={{ backgroundColor: "#f97316" }}
          >
            Search Packages
          </Link>
        </div>
      </div>
    );
  }

  const currency = (pkg.currency || "GBP") as Currency;
  const attractions = pkg.attractions || [];

  // Calculate tour add-on total
  const tourTotal = attractions
    .filter((a) => selectedTours.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const grandTotal = pkg.totalPrice + tourTotal;

  const toggleTour = (id: string) => {
    setSelectedTours((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F6FA]">
      {/* Top bar */}
      <div className="bg-[#003580] text-white">
        <div className="container-wide flex items-center justify-between py-2">
          <Link
            href="/packages"
            className="flex items-center gap-1.5 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to packages
          </Link>
          <a
            href="tel:+442089444555"
            className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            <Phone className="h-4 w-4" />
            020 8944 4555
          </a>
        </div>
      </div>

      <div className="container-wide py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {pkg.theme}
            </span>
            <span className="text-[12px] text-gray-500">
              {pkg.nights} nights / {pkg.days} days
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {pkg.name}
          </h1>
          <p className="text-gray-500">{pkg.tagline}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {pkg.destination}, {pkg.destinationCountry}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {pkg.nights} nights
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-[#003580]" />
                Your Hotel
              </h2>
              <ImageGallery images={pkg.hotel.images} name={pkg.hotel.name} />
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.hotel.name}</h3>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: pkg.hotel.starRating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                {pkg.hotel.address && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {pkg.hotel.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="inline-flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
                    <Building className="h-4 w-4 mr-1.5 text-gray-400" />
                    {pkg.hotel.roomType}
                  </span>
                  {pkg.hotel.mealPlan !== "Room Only" && (
                    <span className="inline-flex items-center text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                      <Check className="h-4 w-4 mr-1.5" />
                      {pkg.hotel.mealPlan}
                    </span>
                  )}
                  {pkg.hotel.freeCancellation && (
                    <span className="inline-flex items-center text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                      <Check className="h-4 w-4 mr-1.5" />
                      Free cancellation
                    </span>
                  )}
                  <span className="inline-flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
                    <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                    {pkg.nights} nights
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {formatPrice(pkg.hotel.pricePerNight, currency)} per night
                </div>
              </div>
            </div>

            {/* Flight Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plane className="h-5 w-5 text-[#003580]" />
                Your Flights
              </h2>

              {/* Outbound */}
              {pkg.flight.outbound && (
                <div className="border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-white bg-[#003580] px-2 py-0.5 rounded">
                      OUTBOUND
                    </span>
                    {pkg.flight.outbound.departureDate && (
                      <span className="text-xs text-gray-500">
                        {pkg.flight.outbound.departureDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 relative flex-shrink-0">
                      <Image
                        src={`https://pics.avs.io/120/48/${pkg.flight.airlineCode}.png`}
                        alt={pkg.flight.airlineName}
                        width={120}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.outbound.departureTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.outbound.origin}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-[11px] text-gray-400">
                            {formatDuration(pkg.flight.outbound.duration)}
                          </div>
                          <div className="w-full flex items-center gap-1">
                            <div className="flex-1 h-[1px] bg-gray-300" />
                            <Plane className="h-3.5 w-3.5 text-gray-400" />
                            <div className="flex-1 h-[1px] bg-gray-300" />
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {pkg.flight.stops === 0 ? "Direct" : `${pkg.flight.stops} stop`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.outbound.arrivalTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.outbound.destination}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pkg.flight.airlineName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Return */}
              {pkg.flight.inbound && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-white bg-gray-600 px-2 py-0.5 rounded">
                      RETURN
                    </span>
                    {pkg.flight.inbound.departureDate && (
                      <span className="text-xs text-gray-500">
                        {pkg.flight.inbound.departureDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 relative flex-shrink-0">
                      <Image
                        src={`https://pics.avs.io/120/48/${pkg.flight.airlineCode}.png`}
                        alt={pkg.flight.airlineName}
                        width={120}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.inbound.departureTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.inbound.origin}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-[11px] text-gray-400">
                            {formatDuration(pkg.flight.inbound.duration)}
                          </div>
                          <div className="w-full flex items-center gap-1">
                            <div className="flex-1 h-[1px] bg-gray-300" />
                            <Plane className="h-3.5 w-3.5 text-gray-400 rotate-180" />
                            <div className="flex-1 h-[1px] bg-gray-300" />
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {pkg.flight.stops === 0 ? "Direct" : `${pkg.flight.stops} stop`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.inbound.arrivalTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.inbound.destination}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pkg.flight.airlineName}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tours & Activities Section */}
            {attractions.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-orange-500" />
                  Tours & Activities
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Add optional tours to enhance your trip. Prices are per person.
                </p>

                <div className="space-y-3">
                  {attractions.map((attraction) => {
                    const isSelected = selectedTours.has(attraction.id);
                    return (
                      <div
                        key={attraction.id}
                        className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                          isSelected
                            ? "border-orange-300 bg-orange-50/50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleTour(attraction.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {attraction.image ? (
                              <Image
                                src={attraction.image}
                                alt={attraction.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Compass className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-sm text-gray-900">
                                  {attraction.name}
                                </h3>
                                <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {attraction.category}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-bold text-gray-900">
                                  {formatPrice(attraction.price, currency)}
                                </div>
                                <div className="text-[11px] text-gray-500">per person</div>
                              </div>
                            </div>
                            {attraction.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {attraction.description}
                              </p>
                            )}
                          </div>

                          {/* Toggle */}
                          <button
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTour(attraction.id);
                            }}
                          >
                            {isSelected ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedTours.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedTours.size} tour{selectedTours.size > 1 ? "s" : ""} selected
                    </span>
                    <span className="font-bold text-gray-900">
                      +{formatPrice(tourTotal, currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* What's Included */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3">What&apos;s Included</h2>
              <div className="grid md:grid-cols-2 gap-2">
                {pkg.includes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {item as string}
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-400 px-1">
              <p>Package price is per person based on 2 adults sharing. Prices subject to availability. Call to confirm booking.</p>
            </div>
          </div>

          {/* Right Column - Price Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-3">Price Summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Plane className="h-3.5 w-3.5 inline mr-1" />
                      Flights
                    </span>
                    <span className="font-medium">{formatPrice(pkg.flight.price, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Building className="h-3.5 w-3.5 inline mr-1" />
                      Hotel ({pkg.nights} nights)
                    </span>
                    <span className="font-medium">{formatPrice(pkg.hotel.price, currency)}</span>
                  </div>
                  {selectedTours.size > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>
                        <Compass className="h-3.5 w-3.5 inline mr-1" />
                        Tours ({selectedTours.size})
                      </span>
                      <span className="font-medium">+{formatPrice(tourTotal, currency)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-600">Total package</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(grandTotal, currency)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {formatPrice(Math.round(grandTotal / 2), currency)} per person
                  </div>
                </div>

                <a
                  href="tel:+442089444555"
                  className="mt-4 block w-full text-center py-3 rounded-md text-white font-bold text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#f97316" }}
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  Call to Book
                </a>

                <p className="text-center text-xs text-gray-500 mt-2">
                  or call <strong>020 8944 4555</strong>
                </p>
              </div>

              {/* Trust Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">ATOL Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">24/7 Customer Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">Best Price Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">No Hidden Fees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-[#003580] mt-8">
        <div className="container-wide py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white text-center md:text-left">
            <h2 className="text-lg font-bold">Ready to book this package?</h2>
            <p className="text-blue-200 text-sm">
              Call our travel experts to secure the best price.
            </p>
          </div>
          <a
            href="tel:+442089444555"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: "#f97316" }}
          >
            <Phone className="h-4 w-4" />
            Call 020 8944 4555
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PackageDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
        </div>
      }
    >
      <PackageDetailContent />
    </Suspense>
  );
}
