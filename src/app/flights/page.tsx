"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Phone,
  Plane,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Briefcase,
  ArrowRight,
  SlidersHorizontal,
  Check,
  ChevronRight,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/SearchForm";
import { ReferenceNumber } from "@/components/ui/ReferenceNumber";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types";

// Booking.com color constants
const BOOKING_BLUE = "#003580";
const BOOKING_YELLOW = "#FEBA02";
const BOOKING_GREEN = "#008009";

interface FlightSegment {
  departureAirport: string;
  departureAirportName: string;
  departureCity: string;
  arrivalAirport: string;
  arrivalAirportName: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo?: string;
  operatingCarrier?: string;
  duration: number;
  cabinClass: string;
  aircraft?: string;
  baggageIncluded?: boolean;
}

interface FlightLeg {
  origin: string;
  originName: string;
  originCity: string;
  destination: string;
  destinationName: string;
  destinationCity: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo?: string;
  stops: number;
  duration: number;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  segments: FlightSegment[];
}

interface FlightResult {
  id: string;
  price: number;
  basePrice: number;
  taxAmount: number;
  currency: string;
  ownerCode: string;
  ownerName: string;
  ownerLogo?: string;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  passengers: {
    adults: number;
    children: number;
    total: number;
  };
  cabinBaggage?: string;
  checkedBaggage?: string;
}

// Format duration from minutes
function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Format time to HH:MM
function formatTimeDisplay(time: string): string {
  if (!time) return "--:--";
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  // Try to parse and format
  try {
    const date = new Date(time);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return time;
  }
}

// GlobeHunters brand orange for CTA buttons
const GH_ORANGE = "#f97316";
const GH_ORANGE_HOVER = "#ea580c";

// Fallback airline logo (higher resolution for crisp display)
function getAirlineLogo(airlineCode: string, duffelLogo?: string): string {
  if (duffelLogo) return duffelLogo;
  return `https://pics.avs.io/400/160/${airlineCode}.png`;
}

// Skeleton loading card
function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="w-24 space-y-2">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

interface FlightCardProps {
  flight: FlightResult;
  currency: Currency;
}

function FlightCard({ flight, currency }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const airlineLogo = getAirlineLogo(flight.outbound.airlineCode, flight.ownerLogo);
  const totalDuration = flight.outbound.duration + (flight.inbound?.duration || 0);

  // Check if baggage is included
  const hasCabinBag = flight.cabinBaggage && !flight.cabinBaggage.toLowerCase().includes("no");
  const hasCheckedBag = flight.checkedBaggage && !flight.checkedBaggage.toLowerCase().includes("no");

  return (
    <div
      className={cn(
        "bg-white rounded-lg border overflow-hidden transition-all duration-200",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:border-[#003580]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      )}
    >
      {/* Main Content */}
      <div className="p-4 md:p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Airline Logo */}
          <div className="flex items-start gap-4 lg:w-32 flex-shrink-0">
            <div className="w-20 h-12 relative flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              {!logoError ? (
                <Image
                  src={airlineLogo}
                  alt={flight.ownerName}
                  width={120}
                  height={48}
                  className="object-contain p-1"
                  onError={() => setLogoError(true)}
                  unoptimized
                />
              ) : (
                <span className="text-sm font-bold text-[#003580]">{flight.ownerCode}</span>
              )}
            </div>
            <div className="lg:hidden flex-1">
              <div className="font-medium text-sm text-gray-900">{flight.ownerName}</div>
              <div className="text-xs text-gray-500 mt-0.5">{flight.outbound.segments[0]?.flightNumber}</div>
            </div>
            {/* Mobile Price */}
            <div className="lg:hidden text-right">
              <div className="text-xl font-bold text-[#003580]">
                {formatPrice(flight.price, currency)}
              </div>
              <div className="text-xs text-gray-500">
                {flight.passengers.total > 1 ? "total" : "per person"}
              </div>
            </div>
          </div>

          {/* Center: Flight Details */}
          <div className="flex-1 space-y-4">
            {/* Outbound Flight */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-xs text-gray-500 w-20">Outbound</div>
              <div className="flex items-center gap-3 flex-1">
                <div className="text-center min-w-[60px]">
                  <div className="text-lg md:text-xl font-bold text-gray-900">
                    {formatTimeDisplay(flight.outbound.departureTime)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{flight.outbound.origin}</div>
                </div>

                <div className="flex-1 flex flex-col items-center px-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDuration(flight.outbound.duration)}
                  </div>
                  <div className="relative w-full flex items-center">
                    <div className="flex-1 h-[2px] bg-gray-300"></div>
                    <ChevronRight className="w-3 h-3 text-gray-400 -ml-1" />
                  </div>
                  <div className={cn(
                    "text-xs font-medium mt-1",
                    flight.outbound.stops === 0 ? "text-[#008009]" : "text-orange-600"
                  )}>
                    {flight.outbound.stops === 0 ? "Direct" : `${flight.outbound.stops} stop${flight.outbound.stops > 1 ? "s" : ""}`}
                  </div>
                </div>

                <div className="text-center min-w-[60px]">
                  <div className="text-lg md:text-xl font-bold text-gray-900">
                    {formatTimeDisplay(flight.outbound.arrivalTime)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{flight.outbound.destination}</div>
                </div>
              </div>
            </div>

            {/* Inbound Flight */}
            {flight.inbound && (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-xs text-gray-500 w-20">Return</div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg md:text-xl font-bold text-gray-900">
                      {formatTimeDisplay(flight.inbound.departureTime)}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{flight.inbound.origin}</div>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDuration(flight.inbound.duration)}
                    </div>
                    <div className="relative w-full flex items-center">
                      <div className="flex-1 h-[2px] bg-gray-300"></div>
                      <ChevronRight className="w-3 h-3 text-gray-400 -ml-1" />
                    </div>
                    <div className={cn(
                      "text-xs font-medium mt-1",
                      flight.inbound.stops === 0 ? "text-[#008009]" : "text-orange-600"
                    )}>
                      {flight.inbound.stops === 0 ? "Direct" : `${flight.inbound.stops} stop${flight.inbound.stops > 1 ? "s" : ""}`}
                    </div>
                  </div>

                  <div className="text-center min-w-[60px]">
                    <div className="text-lg md:text-xl font-bold text-gray-900">
                      {formatTimeDisplay(flight.inbound.arrivalTime)}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">{flight.inbound.destination}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Baggage Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {hasCabinBag && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-[#008009] rounded">
                  <Briefcase className="w-3 h-3" />
                  Cabin bag included
                </span>
              )}
              {hasCheckedBag && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-[#008009] rounded">
                  <Check className="w-3 h-3" />
                  Checked bag included
                </span>
              )}
              {!hasCabinBag && !hasCheckedBag && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded">
                  <Briefcase className="w-3 h-3" />
                  Personal item only
                </span>
              )}
            </div>
          </div>

          {/* Right: Price & CTA - Desktop */}
          <div className="hidden lg:flex flex-col items-end justify-between lg:w-44 lg:pl-5 lg:border-l border-gray-100">
            <div className="text-right">
              <div className="text-2xl font-bold text-[#003580]">
                {formatPrice(flight.price, currency)}
              </div>
              <div className="text-xs text-gray-500">
                {flight.passengers.total > 1 ? `Total for ${flight.passengers.total} passengers` : "per person"}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Includes taxes & fees
              </div>
            </div>
            <Button
              className={`w-full mt-3 text-white font-semibold`}
              style={{ backgroundColor: GH_ORANGE }}
              asChild
            >
              <a href="tel:+442089444555">
                <Phone className="h-4 w-4 mr-1" />
                Call to Book
              </a>
            </Button>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="lg:hidden mt-4 pt-4 border-t border-gray-100">
          <Button
            className="w-full text-white font-semibold"
            style={{ backgroundColor: GH_ORANGE }}
            asChild
          >
            <a href="tel:+442089444555">
              <Phone className="h-4 w-4 mr-1" />
              Call to Book
            </a>
          </Button>
        </div>
      </div>

      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-sm text-[#003580] font-medium transition-colors border-t border-gray-100"
      >
        {expanded ? (
          <>Hide details <ChevronUp className="w-4 h-4" /></>
        ) : (
          <>View details <ChevronDown className="w-4 h-4" /></>
        )}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-[#F2F6FA] p-4 md:p-5 space-y-5">
          {/* Outbound Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-4 h-4 text-[#003580]" />
              <span className="font-semibold text-gray-900">Outbound Flight</span>
              <span className="text-sm text-gray-500">{flight.outbound.departureDate}</span>
            </div>
            <div className="space-y-2">
              {flight.outbound.segments.map((seg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
                      <Image
                        src={getAirlineLogo(seg.airlineCode, seg.airlineLogo)}
                        alt={seg.airlineName}
                        width={80}
                        height={32}
                        className="object-contain p-0.5"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#003580]">{seg.flightNumber}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-gray-600">{seg.airlineName}</span>
                        {seg.operatingCarrier && seg.operatingCarrier !== seg.airlineName && (
                          <span className="text-xs text-gray-400">(Operated by {seg.operatingCarrier})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-sm">
                        <div>
                          <span className="font-bold text-gray-900">{formatTimeDisplay(seg.departureTime)}</span>
                          <span className="text-gray-500 ml-2">{seg.departureAirport}</span>
                          <span className="text-gray-400 ml-1 text-xs">{seg.departureAirportName}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-gray-900">{formatTimeDisplay(seg.arrivalTime)}</span>
                          <span className="text-gray-500 ml-2">{seg.arrivalAirport}</span>
                          <span className="text-gray-400 ml-1 text-xs">{seg.arrivalAirportName}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(seg.duration)}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{seg.cabinClass}</span>
                        {seg.aircraft && <span className="text-gray-400">{seg.aircraft}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inbound Details */}
          {flight.inbound && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Plane className="w-4 h-4 text-[#003580] rotate-180" />
                <span className="font-semibold text-gray-900">Return Flight</span>
                <span className="text-sm text-gray-500">{flight.inbound.departureDate}</span>
              </div>
              <div className="space-y-2">
                {flight.inbound.segments.map((seg, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
                        <Image
                          src={getAirlineLogo(seg.airlineCode, seg.airlineLogo)}
                          alt={seg.airlineName}
                          width={40}
                          height={40}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#003580]">{seg.flightNumber}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-600">{seg.airlineName}</span>
                          {seg.operatingCarrier && seg.operatingCarrier !== seg.airlineName && (
                            <span className="text-xs text-gray-400">(Operated by {seg.operatingCarrier})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-sm">
                          <div>
                            <span className="font-bold text-gray-900">{formatTimeDisplay(seg.departureTime)}</span>
                            <span className="text-gray-500 ml-2">{seg.departureAirport}</span>
                            <span className="text-gray-400 ml-1 text-xs">{seg.departureAirportName}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-gray-900">{formatTimeDisplay(seg.arrivalTime)}</span>
                            <span className="text-gray-500 ml-2">{seg.arrivalAirport}</span>
                            <span className="text-gray-400 ml-1 text-xs">{seg.arrivalAirportName}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(seg.duration)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{seg.cabinClass}</span>
                          {seg.aircraft && <span className="text-gray-400">{seg.aircraft}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="font-semibold mb-3 text-gray-900">Price Breakdown</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Flight fare</span>
                <span className="text-gray-900">{formatPrice(flight.basePrice, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes & fees</span>
                <span className="text-gray-900">{formatPrice(flight.taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total ({flight.passengers.total} {flight.passengers.total > 1 ? "passengers" : "passenger"})</span>
                <span className="text-[#003580] text-lg">{formatPrice(flight.price, currency)}</span>
              </div>
            </div>
          </div>

          {/* Baggage Information */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
              <Briefcase className="w-4 h-4 text-[#003580]" />
              Baggage Allowance
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-28 text-gray-500">Cabin baggage</div>
                <div className={hasCabinBag ? "text-[#008009] font-medium" : "text-gray-600"}>
                  {flight.cabinBaggage || "1 x Personal item"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-28 text-gray-500">Checked baggage</div>
                <div className={hasCheckedBag ? "text-[#008009] font-medium" : "text-orange-600"}>
                  {flight.checkedBaggage || "Not included - available for purchase"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Checkbox component styled like Booking.com
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  disabled?: boolean;
}

function Checkbox({ checked, onChange, label, count, disabled }: CheckboxProps) {
  return (
    <label className={cn(
      "flex items-center gap-3 cursor-pointer group py-1.5",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <div
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
          checked
            ? "bg-[#003580] border-[#003580]"
            : "bg-white border-gray-300 group-hover:border-[#003580]"
        )}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="sr-only"
        disabled={disabled}
      />
      <span className="text-sm text-gray-700 flex-1 group-hover:text-gray-900">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </label>
  );
}

// Range Slider component
interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
}

function RangeSlider({ min, max, value, onChange, formatLabel }: RangeSliderProps) {
  const format = formatLabel || ((v) => v.toString());

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{format(min)}</span>
        <span className="font-medium text-[#003580]">Up to {format(value[1])}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value[1]}
        onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003580]"
        style={{
          background: `linear-gradient(to right, #003580 0%, #003580 ${((value[1] - min) / (max - min)) * 100}%, #E7E7E7 ${((value[1] - min) / (max - min)) * 100}%, #E7E7E7 100%)`
        }}
      />
    </div>
  );
}

// Filters sidebar
interface FiltersProps {
  flights: FlightResult[];
  selectedAirlines: string[];
  setSelectedAirlines: (airlines: string[]) => void;
  selectedStops: number[];
  setSelectedStops: (stops: number[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  durationRange: [number, number];
  setDurationRange: (range: [number, number]) => void;
  departureTimeRange: [number, number];
  setDepartureTimeRange: (range: [number, number]) => void;
  selectedBaggage: string[];
  setSelectedBaggage: (baggage: string[]) => void;
  maxPrice: number;
  minPrice: number;
  maxDuration: number;
  minDuration: number;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  currency: Currency;
}

function FiltersPanel({
  flights,
  selectedAirlines,
  setSelectedAirlines,
  selectedStops,
  setSelectedStops,
  priceRange,
  setPriceRange,
  durationRange,
  setDurationRange,
  departureTimeRange,
  setDepartureTimeRange,
  selectedBaggage,
  setSelectedBaggage,
  maxPrice,
  minPrice,
  maxDuration,
  minDuration,
  showMobileFilters,
  setShowMobileFilters,
  clearAllFilters,
  hasActiveFilters,
  currency,
}: FiltersProps) {
  const [showAllAirlines, setShowAllAirlines] = useState(false);

  // Get unique airlines with counts
  const airlines = useMemo(() => {
    const airlineMap = new Map<string, { code: string; name: string; count: number }>();
    flights.forEach((f) => {
      const key = f.ownerCode;
      if (!airlineMap.has(key)) {
        airlineMap.set(key, { code: key, name: f.ownerName, count: 1 });
      } else {
        airlineMap.get(key)!.count++;
      }
    });
    return Array.from(airlineMap.values()).sort((a, b) => b.count - a.count);
  }, [flights]);

  // Get stops options with counts
  const stopsOptions = useMemo(() => {
    const stopsMap = new Map<number, number>();
    flights.forEach((f) => {
      const maxStops = Math.max(f.outbound.stops, f.inbound?.stops || 0);
      stopsMap.set(maxStops, (stopsMap.get(maxStops) || 0) + 1);
    });
    return Array.from(stopsMap.entries())
      .map(([stops, count]) => ({ stops, count }))
      .sort((a, b) => a.stops - b.stops);
  }, [flights]);

  // Baggage options
  const baggageOptions = useMemo(() => {
    let cabinCount = 0;
    let checkedCount = 0;

    flights.forEach((f) => {
      if (f.cabinBaggage && !f.cabinBaggage.toLowerCase().includes("no")) cabinCount++;
      if (f.checkedBaggage && !f.checkedBaggage.toLowerCase().includes("no")) checkedCount++;
    });

    return [
      { id: "cabin", label: "Cabin bag included", count: cabinCount },
      { id: "checked", label: "Checked bag included", count: checkedCount },
    ];
  }, [flights]);

  // Format time for display (0-24 hours)
  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const visibleAirlines = showAllAirlines ? airlines : airlines.slice(0, 5);

  const filterContent = (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="pb-4 border-b border-gray-200">
          <button
            onClick={clearAllFilters}
            className="text-sm text-[#003580] hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* 1. Stops Filter */}
      <div className="pb-5 border-b border-gray-100">
        <h3 className="font-semibold mb-3 text-gray-900">Stops</h3>
        <div className="space-y-1">
          {stopsOptions.map(({ stops, count }) => (
            <Checkbox
              key={stops}
              checked={selectedStops.includes(stops)}
              onChange={(checked) => {
                if (checked) {
                  setSelectedStops([...selectedStops, stops]);
                } else {
                  setSelectedStops(selectedStops.filter((s) => s !== stops));
                }
              }}
              label={stops === 0 ? "Direct" : stops === 1 ? "1 stop" : `${stops}+ stops`}
              count={count}
            />
          ))}
        </div>
      </div>

      {/* 2. Duration Filter */}
      <div className="pb-5 border-b border-gray-100">
        <h3 className="font-semibold mb-3 text-gray-900">Flight Duration</h3>
        <RangeSlider
          min={minDuration}
          max={maxDuration}
          value={durationRange}
          onChange={setDurationRange}
          formatLabel={(v) => formatDuration(v)}
        />
      </div>

      {/* 3. Airlines Filter */}
      <div className="pb-5 border-b border-gray-100">
        <h3 className="font-semibold mb-3 text-gray-900">Airlines</h3>
        <div className="space-y-1">
          {visibleAirlines.map((airline) => (
            <Checkbox
              key={airline.code}
              checked={selectedAirlines.includes(airline.code)}
              onChange={(checked) => {
                if (checked) {
                  setSelectedAirlines([...selectedAirlines, airline.code]);
                } else {
                  setSelectedAirlines(selectedAirlines.filter((a) => a !== airline.code));
                }
              }}
              label={airline.name}
              count={airline.count}
            />
          ))}
        </div>
        {airlines.length > 5 && (
          <button
            onClick={() => setShowAllAirlines(!showAllAirlines)}
            className="mt-2 text-sm text-[#003580] hover:underline font-medium flex items-center gap-1"
          >
            {showAllAirlines ? (
              <>Show less <ChevronUp className="w-4 h-4" /></>
            ) : (
              <>Show all {airlines.length} airlines <ChevronDown className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>

      {/* 4. Departure Time Filter */}
      <div className="pb-5 border-b border-gray-100">
        <h3 className="font-semibold mb-3 text-gray-900">Departure Time</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{formatTime(departureTimeRange[0])}</span>
            <span className="text-gray-500">{formatTime(departureTimeRange[1])}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={24}
              value={departureTimeRange[0]}
              onChange={(e) => setDepartureTimeRange([parseInt(e.target.value), departureTimeRange[1]])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003580] absolute"
            />
            <input
              type="range"
              min={0}
              max={24}
              value={departureTimeRange[1]}
              onChange={(e) => setDepartureTimeRange([departureTimeRange[0], parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003580]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDepartureTimeRange([6, 12])}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                departureTimeRange[0] === 6 && departureTimeRange[1] === 12
                  ? "bg-[#003580] text-white border-[#003580]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#003580]"
              )}
            >
              Morning
            </button>
            <button
              onClick={() => setDepartureTimeRange([12, 18])}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                departureTimeRange[0] === 12 && departureTimeRange[1] === 18
                  ? "bg-[#003580] text-white border-[#003580]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#003580]"
              )}
            >
              Afternoon
            </button>
            <button
              onClick={() => setDepartureTimeRange([18, 24])}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                departureTimeRange[0] === 18 && departureTimeRange[1] === 24
                  ? "bg-[#003580] text-white border-[#003580]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#003580]"
              )}
            >
              Evening
            </button>
          </div>
        </div>
      </div>

      {/* 5. Price Filter */}
      <div className="pb-5 border-b border-gray-100">
        <h3 className="font-semibold mb-3 text-gray-900">Price</h3>
        <RangeSlider
          min={minPrice}
          max={maxPrice}
          value={priceRange}
          onChange={setPriceRange}
          formatLabel={(v) => formatPrice(v, currency)}
        />
      </div>

      {/* 6. Baggage Filter */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-900">Baggage</h3>
        <div className="space-y-1">
          {baggageOptions.map((option) => (
            <Checkbox
              key={option.id}
              checked={selectedBaggage.includes(option.id)}
              onChange={(checked) => {
                if (checked) {
                  setSelectedBaggage([...selectedBaggage, option.id]);
                } else {
                  setSelectedBaggage(selectedBaggage.filter((b) => b !== option.id));
                }
              }}
              label={option.label}
              count={option.count}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="font-bold text-lg mb-5 text-gray-900">Filter by:</h2>
          {filterContent}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-lg text-gray-900">Filter by</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {filterContent}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
              <Button
                className="flex-1 text-white font-semibold"
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

// Sorting tabs component
interface SortTabsProps {
  sortBy: "best" | "price" | "duration";
  setSortBy: (sort: "best" | "price" | "duration") => void;
  cheapestPrice?: number;
  fastestPrice?: number;
  fastestDuration?: number;
  bestValuePrice?: number;
  bestValueDuration?: number;
  currency: Currency;
}

function SortTabs({ sortBy, setSortBy, cheapestPrice, fastestPrice, fastestDuration, bestValuePrice, bestValueDuration, currency }: SortTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
      <button
        onClick={() => setSortBy("best")}
        className={cn(
          "px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex flex-col items-center min-w-[100px]",
          sortBy === "best"
            ? "bg-[#003580] text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:border-[#003580] hover:text-[#003580]"
        )}
      >
        <span>Best</span>
        {bestValuePrice && (
          <span className={cn("text-xs", sortBy === "best" ? "text-blue-200" : "text-orange-500")}>
            {formatPrice(bestValuePrice, currency)}
            {bestValueDuration && <span className="text-gray-400 ml-1">· {formatDuration(bestValueDuration)}</span>}
          </span>
        )}
      </button>
      <button
        onClick={() => setSortBy("price")}
        className={cn(
          "px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex flex-col items-center min-w-[100px]",
          sortBy === "price"
            ? "bg-[#003580] text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:border-[#003580] hover:text-[#003580]"
        )}
      >
        <span>Cheapest</span>
        {cheapestPrice && (
          <span className={cn("text-xs", sortBy === "price" ? "text-blue-200" : "text-orange-500")}>
            {formatPrice(cheapestPrice, currency)}
          </span>
        )}
      </button>
      <button
        onClick={() => setSortBy("duration")}
        className={cn(
          "px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex flex-col items-center min-w-[100px]",
          sortBy === "duration"
            ? "bg-[#003580] text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:border-[#003580] hover:text-[#003580]"
        )}
      >
        <span>Fastest</span>
        {fastestDuration && (
          <span className={cn("text-xs", sortBy === "duration" ? "text-blue-200" : "text-green-600")}>
            {formatDuration(fastestDuration)}
            {fastestPrice && <span className="text-gray-400 ml-1">· {formatPrice(fastestPrice, currency)}</span>}
          </span>
        )}
      </button>
    </div>
  );
}

function FlightsContent() {
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 2880]); // 48 hours max
  const [departureTimeRange, setDepartureTimeRange] = useState<[number, number]>([0, 24]);
  const [selectedBaggage, setSelectedBaggage] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"best" | "price" | "duration">("best");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departureDate = searchParams.get("departureDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  const hasSearchParamsInit = !!(origin && destination && departureDate);
  const [searchFormOpen, setSearchFormOpen] = useState(!hasSearchParamsInit);

  // Calculate min/max prices
  const minPrice = useMemo(() => {
    if (flights.length === 0) return 0;
    return Math.floor(Math.min(...flights.map((f) => f.price)));
  }, [flights]);

  const maxPrice = useMemo(() => {
    if (flights.length === 0) return 10000;
    return Math.ceil(Math.max(...flights.map((f) => f.price)));
  }, [flights]);

  // Calculate min/max duration
  const minDuration = useMemo(() => {
    if (flights.length === 0) return 0;
    return Math.min(...flights.map((f) => f.outbound.duration + (f.inbound?.duration || 0)));
  }, [flights]);

  const maxDuration = useMemo(() => {
    if (flights.length === 0) return 2880;
    return Math.max(...flights.map((f) => f.outbound.duration + (f.inbound?.duration || 0)));
  }, [flights]);

  // Get best price and fastest duration for sort tabs
  const cheapestPrice = useMemo(() => {
    if (flights.length === 0) return undefined;
    return Math.min(...flights.map((f) => f.price));
  }, [flights]);

  const fastestDuration = useMemo(() => {
    if (flights.length === 0) return undefined;
    return Math.min(...flights.map((f) => f.outbound.duration + (f.inbound?.duration || 0)));
  }, [flights]);

  // Get price of the fastest flight
  const fastestPrice = useMemo(() => {
    if (flights.length === 0) return undefined;
    const fastest = flights.reduce((best, f) => {
      const duration = f.outbound.duration + (f.inbound?.duration || 0);
      const bestDuration = best.outbound.duration + (best.inbound?.duration || 0);
      return duration < bestDuration ? f : best;
    });
    return fastest.price;
  }, [flights]);

  // Get "best value" flight (balanced price and duration) price and duration
  const bestValueFlight = useMemo(() => {
    if (flights.length === 0) return undefined;
    // Score flights based on normalized price and duration
    const maxP = Math.max(...flights.map(f => f.price));
    const minP = Math.min(...flights.map(f => f.price));
    const maxD = Math.max(...flights.map(f => f.outbound.duration + (f.inbound?.duration || 0)));
    const minD = Math.min(...flights.map(f => f.outbound.duration + (f.inbound?.duration || 0)));

    const scored = flights.map(f => {
      const duration = f.outbound.duration + (f.inbound?.duration || 0);
      const priceScore = maxP > minP ? (f.price - minP) / (maxP - minP) : 0;
      const durationScore = maxD > minD ? (duration - minD) / (maxD - minD) : 0;
      // Weight price slightly more (60%) than duration (40%)
      const score = priceScore * 0.6 + durationScore * 0.4;
      return { flight: f, score, duration };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored[0] ? { price: scored[0].flight.price, duration: scored[0].duration } : undefined;
  }, [flights]);

  const bestValuePrice = bestValueFlight?.price;
  const bestValueDuration = bestValueFlight?.duration;

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedAirlines.length > 0 ||
      selectedStops.length > 0 ||
      priceRange[1] < maxPrice ||
      durationRange[1] < maxDuration ||
      departureTimeRange[0] > 0 ||
      departureTimeRange[1] < 24 ||
      selectedBaggage.length > 0
    );
  }, [selectedAirlines, selectedStops, priceRange, maxPrice, durationRange, maxDuration, departureTimeRange, selectedBaggage]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedAirlines([]);
    setSelectedStops([]);
    setPriceRange([minPrice, maxPrice]);
    setDurationRange([minDuration, maxDuration]);
    setDepartureTimeRange([0, 24]);
    setSelectedBaggage([]);
  }, [minPrice, maxPrice, minDuration, maxDuration]);

  // Reset ranges when flights change
  useEffect(() => {
    if (flights.length > 0) {
      setPriceRange([minPrice, maxPrice]);
      setDurationRange([minDuration, maxDuration]);
    }
  }, [flights.length, minPrice, maxPrice, minDuration, maxDuration]);

  // Filtered and sorted flights
  const filteredFlights = useMemo(() => {
    let result = flights;

    // Filter by airlines
    if (selectedAirlines.length > 0) {
      result = result.filter((f) => selectedAirlines.includes(f.ownerCode));
    }

    // Filter by stops
    if (selectedStops.length > 0) {
      result = result.filter((f) => {
        const maxStops = Math.max(f.outbound.stops, f.inbound?.stops || 0);
        return selectedStops.includes(maxStops);
      });
    }

    // Filter by price
    result = result.filter((f) => f.price >= priceRange[0] && f.price <= priceRange[1]);

    // Filter by duration
    result = result.filter((f) => {
      const totalDuration = f.outbound.duration + (f.inbound?.duration || 0);
      return totalDuration <= durationRange[1];
    });

    // Filter by departure time
    result = result.filter((f) => {
      const depTime = f.outbound.departureTime;
      // Extract hour from time string (assumes HH:MM format)
      const hourMatch = depTime.match(/^(\d{1,2}):/);
      if (hourMatch) {
        const hour = parseInt(hourMatch[1]);
        return hour >= departureTimeRange[0] && hour <= departureTimeRange[1];
      }
      return true;
    });

    // Filter by baggage
    if (selectedBaggage.length > 0) {
      result = result.filter((f) => {
        const hasCabin = f.cabinBaggage && !f.cabinBaggage.toLowerCase().includes("no");
        const hasChecked = f.checkedBaggage && !f.checkedBaggage.toLowerCase().includes("no");

        if (selectedBaggage.includes("cabin") && !hasCabin) return false;
        if (selectedBaggage.includes("checked") && !hasChecked) return false;
        return true;
      });
    }

    // Sort
    if (sortBy === "price") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "duration") {
      result = [...result].sort((a, b) => {
        const aDuration = a.outbound.duration + (a.inbound?.duration || 0);
        const bDuration = b.outbound.duration + (b.inbound?.duration || 0);
        return aDuration - bDuration;
      });
    } else {
      // "best" - algorithm considers price, duration, and stops
      result = [...result].sort((a, b) => {
        const aScore = a.price * 0.5 + (a.outbound.duration + (a.inbound?.duration || 0)) * 0.3 + (a.outbound.stops + (a.inbound?.stops || 0)) * 100;
        const bScore = b.price * 0.5 + (b.outbound.duration + (b.inbound?.duration || 0)) * 0.3 + (b.outbound.stops + (b.inbound?.stops || 0)) * 100;
        return aScore - bScore;
      });
    }

    return result;
  }, [flights, selectedAirlines, selectedStops, priceRange, durationRange, departureTimeRange, selectedBaggage, sortBy]);

  useEffect(() => {
    if (!origin || !destination || !departureDate) {
      setFlights([]);
      setLoading(false);
      return;
    }

    const fetchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          origin,
          destination,
          departureDate,
          adults: adults.toString(),
          children: children.toString(),
          currency,
        });

        if (returnDate) {
          params.set("returnDate", returnDate);
        }

        const response = await fetch(`/api/search/flights?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch flights");
        }

        setFlights(data.data || []);
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch flights");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, departureDate, returnDate, adults, children, currency]);

  // Auto-scroll to results when search completes
  useEffect(() => {
    if (!loading && flights.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, flights.length]);

  const hasSearchParams = origin && destination && departureDate;

  return (
    <>
      {/* Search Form - Collapsible when results are present */}
      <section className="bg-[#003580]">
        <div className="container-wide">
          {hasSearchParams ? (
            <>
              <button
                onClick={() => setSearchFormOpen(!searchFormOpen)}
                className="w-full flex items-center justify-between py-4 text-white"
              >
                <span className="font-semibold flex items-center gap-2 text-base">
                  <Search className="w-5 h-5" />
                  {searchFormOpen ? "Hide Search" : "Modify Search"}
                </span>
                {searchFormOpen ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>
              {searchFormOpen && (
                <div className="pb-6">
                  <SearchForm defaultType="flights" />
                </div>
              )}
            </>
          ) : (
            <div className="py-6">
              <SearchForm defaultType="flights" />
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section ref={resultsRef} className="py-6 bg-[#F2F6FA] min-h-[60vh]">
        <div className="container-wide">
          {/* Results Header */}
          <div className="mb-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {hasSearchParams ? (
                    <>
                      {origin} <ArrowRight className="inline w-5 h-5 text-gray-400 mx-1" /> {destination}
                    </>
                  ) : (
                    "Search Flights"
                  )}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {!hasSearchParams && "Enter your travel details to find available flights"}
                  {hasSearchParams && loading && "Searching for the best deals..."}
                  {hasSearchParams && !loading && !error && (
                    <>
                      {filteredFlights.length === flights.length ? (
                        <span>{flights.length} {flights.length === 1 ? "result" : "results"}</span>
                      ) : (
                        <span>Showing {filteredFlights.length} of {flights.length} results</span>
                      )}
                      {departureDate && <span className="mx-2">|</span>}
                      {departureDate && <span>{departureDate}</span>}
                      {returnDate && <span> - {returnDate}</span>}
                      <span className="mx-2">|</span>
                      <span>{adults + children} {adults + children === 1 ? "traveller" : "travellers"}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Call to Book CTA */}
              {!loading && flights.length > 0 && (
                <Button
                  className="hidden md:flex text-white font-semibold"
                  style={{ backgroundColor: GH_ORANGE }}
                  asChild
                >
                  <a href="tel:+442089444555">
                    <Phone className="h-4 w-4 mr-2" />
                    Call 020 8944 4555
                  </a>
                </Button>
              )}
            </div>

            {/* Web Reference Number */}
            {!loading && flights.length > 0 && (
              <div className="mt-4">
                <ReferenceNumber
                  searchType="flights"
                  searchParams={{
                    origin: origin || "",
                    destination: destination || "",
                    departureDate: departureDate || "",
                    returnDate: returnDate || "",
                    adults: String(adults),
                    children: String(children),
                  }}
                />
              </div>
            )}

            {/* Sorting & Filter Controls */}
            {!loading && flights.length > 0 && (
              <div className="flex items-center justify-between gap-4 mt-5">
                {/* Sort Tabs - Desktop */}
                <div className="hidden md:block">
                  <SortTabs
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    cheapestPrice={cheapestPrice}
                    fastestPrice={fastestPrice}
                    fastestDuration={fastestDuration}
                    bestValuePrice={bestValuePrice}
                    bestValueDuration={bestValueDuration}
                    currency={currency}
                  />
                </div>

                {/* Mobile Controls */}
                <div className="flex md:hidden gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filter
                    {hasActiveFilters && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-[#003580] text-white text-xs flex items-center justify-center">
                        !
                      </span>
                    )}
                  </Button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "best" | "price" | "duration")}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
                  >
                    <option value="best">Best</option>
                    <option value="price">Cheapest</option>
                    <option value="duration">Fastest</option>
                  </select>
                </div>

                {/* Results count - Desktop */}
                <div className="hidden md:block text-sm text-gray-500">
                  {filteredFlights.length} {filteredFlights.length === 1 ? "flight" : "flights"} found
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            {hasSearchParams && !loading && !error && flights.length > 0 && (
              <FiltersPanel
                flights={flights}
                selectedAirlines={selectedAirlines}
                setSelectedAirlines={setSelectedAirlines}
                selectedStops={selectedStops}
                setSelectedStops={setSelectedStops}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                durationRange={durationRange}
                setDurationRange={setDurationRange}
                departureTimeRange={departureTimeRange}
                setDepartureTimeRange={setDepartureTimeRange}
                selectedBaggage={selectedBaggage}
                setSelectedBaggage={setSelectedBaggage}
                maxPrice={maxPrice}
                minPrice={minPrice}
                maxDuration={maxDuration}
                minDuration={minDuration}
                showMobileFilters={showMobileFilters}
                setShowMobileFilters={setShowMobileFilters}
                clearAllFilters={clearAllFilters}
                hasActiveFilters={hasActiveFilters}
                currency={currency}
              />
            )}

            {/* Results List */}
            <div className="flex-1 min-w-0">
              {/* No Search Yet */}
              {!hasSearchParams && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <Plane className="w-16 h-16 text-[#003580]/20 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Where would you like to go?</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Enter your departure city, destination, and travel dates to discover available flights.
                  </p>
                </div>
              )}

              {/* Loading */}
              {hasSearchParams && loading && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-6 text-center border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#003580] mx-auto mb-3" />
                    <p className="text-gray-900 font-medium">Finding the best deals...</p>
                    <p className="text-xs text-gray-500 mt-1">Searching {origin} to {destination}</p>
                  </div>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}

              {/* Error */}
              {hasSearchParams && !loading && error && (
                <div className="bg-white rounded-lg p-12 text-center border border-red-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                  <p className="text-gray-500 mb-6">{error}</p>
                  <Button
                    className="text-white font-semibold"
                    style={{ backgroundColor: GH_ORANGE }}
                    asChild
                  >
                    <a href="tel:+442089444555">
                      <Phone className="h-4 w-4 mr-2" />
                      Call for Assistance
                    </a>
                  </Button>
                </div>
              )}

              {/* Results */}
              {hasSearchParams && !loading && !error && filteredFlights.length > 0 && (
                <div className="space-y-4">
                  {filteredFlights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} currency={currency} />
                  ))}
                </div>
              )}

              {/* No Results */}
              {hasSearchParams && !loading && !error && flights.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <Plane className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No flights found</h2>
                  <p className="text-gray-500 mb-6">
                    We could not find any flights for this route. Try different dates or contact us for assistance.
                  </p>
                  <Button
                    className="text-white font-semibold"
                    style={{ backgroundColor: GH_ORANGE }}
                    asChild
                  >
                    <a href="tel:+442089444555">
                      <Phone className="h-4 w-4 mr-2" />
                      Call 020 8944 4555
                    </a>
                  </Button>
                </div>
              )}

              {/* No filtered results */}
              {hasSearchParams && !loading && !error && flights.length > 0 && filteredFlights.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <SlidersHorizontal className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No matches</h2>
                  <p className="text-gray-500 mb-6">
                    No flights match your current filters. Try adjusting your criteria.
                  </p>
                  <Button
                    variant="outline"
                    className="border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white"
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}

              {/* Help Banner */}
              {hasSearchParams && !loading && !error && filteredFlights.length > 0 && (
                <div className="mt-6 bg-[#003580] rounded-lg p-6 md:p-8 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Need help booking?</h2>
                      <p className="text-blue-200 text-sm">
                        Our flight specialists can find exclusive fares and help with complex itineraries.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="text-white font-semibold"
                      style={{ backgroundColor: GH_ORANGE }}
                      asChild
                    >
                      <a href="tel:+442089444555">
                        <Phone className="h-5 w-5 mr-2" />
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

      {/* Mobile Sticky Footer CTA */}
      {hasSearchParams && !loading && flights.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.1)]">
          <Button
            className="w-full text-white font-semibold"
            style={{ backgroundColor: GH_ORANGE }}
            size="lg"
            asChild
          >
            <a href="tel:+442089444555">
              <Phone className="h-5 w-5 mr-2" />
              Call to Book: 020 8944 4555
            </a>
          </Button>
        </div>
      )}
    </>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#F2F6FA]">
        <Loader2 className="h-8 w-8 animate-spin text-[#003580]" />
      </div>
    }>
      <FlightsContent />
    </Suspense>
  );
}
