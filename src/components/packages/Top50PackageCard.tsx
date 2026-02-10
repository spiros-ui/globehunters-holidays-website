"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Map,
  Clock,
  Plane,
  Building,
  ChevronDown,
  Check,
  Star,
  MapPin,
  Utensils,
  Ticket,
  Users,
  Bus,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Top50Package, FlightOption, HotelOption, PackageInclusion } from "./types";

interface Top50PackageCardProps {
  package: Top50Package;
  onFlightChange?: (packageId: string, flightId: string) => void;
  onHotelChange?: (packageId: string, hotelId: string) => void;
  className?: string;
}

// Icon mapping for static inclusions
const inclusionIcons: Record<string, React.ElementType> = {
  tour: MapPin,
  activity: Ticket,
  transfer: Bus,
  meal: Utensils,
  guide: Users,
  ticket: Ticket,
};

/**
 * Package card for Top 50 section with dynamic flight/hotel selection
 * Only flights and hotels are changeable - everything else is static
 */
export function Top50PackageCard({
  package: pkg,
  onFlightChange,
  onHotelChange,
  className,
}: Top50PackageCardProps) {
  const [selectedFlightId, setSelectedFlightId] = React.useState(
    pkg.selectedFlightId || pkg.flightOptions[0]?.id
  );
  const [selectedHotelId, setSelectedHotelId] = React.useState(
    pkg.selectedHotelId || pkg.hotelOptions[0]?.id
  );
  const [showFlightDropdown, setShowFlightDropdown] = React.useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = React.useState(false);

  const selectedFlight = pkg.flightOptions.find((f) => f.id === selectedFlightId);
  const selectedHotel = pkg.hotelOptions.find((h) => h.id === selectedHotelId);

  // Calculate total price with adjustments
  const totalPrice =
    pkg.price +
    (selectedFlight?.priceAdjustment || 0) +
    (selectedHotel?.priceAdjustment || 0);

  const handleFlightSelect = (flightId: string) => {
    setSelectedFlightId(flightId);
    setShowFlightDropdown(false);
    onFlightChange?.(pkg.id, flightId);
  };

  const handleHotelSelect = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setShowHotelDropdown(false);
    onHotelChange?.(pkg.id, hotelId);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowFlightDropdown(false);
        setShowHotelDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Generate search URL with selected options
  const generateSearchUrl = () => {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 14);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + pkg.nights);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const params = new URLSearchParams({
      origin: "LHR",
      destination: pkg.destinationCode,
      departureDate: formatDate(departureDate),
      returnDate: formatDate(returnDate),
      adults: "2",
      children: "0",
      rooms: "1",
      currency: pkg.currency,
      flightId: selectedFlightId || "",
      hotelId: selectedHotelId || "",
    });

    return `/packages/${pkg.id}?${params.toString()}`;
  };

  return (
    <div className={cn("card-hover flex flex-col md:flex-row", className)}>
      {/* Image */}
      <div className="relative w-full md:w-[320px] lg:w-[360px] flex-shrink-0">
        <div className="aspect-[16/10] md:aspect-auto md:h-full relative">
          <Image
            src={pkg.image}
            alt={pkg.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 360px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:bg-gradient-to-r" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-serif text-xl text-foreground mb-1">{pkg.name}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Map className="h-4 w-4" />
                {pkg.destination}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {pkg.nights} nights
              </span>
            </div>
          </div>
        </div>

        {/* Static Inclusions - Real things to do */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Whats Included
          </p>
          <div className="flex flex-wrap gap-2">
            {pkg.staticInclusions.map((inclusion) => (
              <InclusionTag key={inclusion.id} inclusion={inclusion} />
            ))}
          </div>
        </div>

        {/* Dynamic Options - Only Flights and Hotels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Flight Selector */}
          {pkg.flightOptions.length > 0 && (
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFlightDropdown(!showFlightDropdown);
                  setShowHotelDropdown(false);
                }}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Plane className="h-4 w-4 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Flight</p>
                    <p className="text-sm font-medium truncate">
                      {selectedFlight?.airline || "Select flight"}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                    showFlightDropdown && "rotate-180"
                  )}
                />
              </button>

              {/* Flight Dropdown */}
              {showFlightDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
                  {pkg.flightOptions.map((flight) => (
                    <FlightOptionItem
                      key={flight.id}
                      flight={flight}
                      selected={flight.id === selectedFlightId}
                      currency={pkg.currency}
                      onSelect={() => handleFlightSelect(flight.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hotel Selector */}
          {pkg.hotelOptions.length > 0 && (
            <div className="relative" data-dropdown>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHotelDropdown(!showHotelDropdown);
                  setShowFlightDropdown(false);
                }}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building className="h-4 w-4 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Hotel</p>
                    <p className="text-sm font-medium truncate">
                      {selectedHotel?.name || "Select hotel"}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                    showHotelDropdown && "rotate-180"
                  )}
                />
              </button>

              {/* Hotel Dropdown */}
              {showHotelDropdown && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
                  {pkg.hotelOptions.map((hotel) => (
                    <HotelOptionItem
                      key={hotel.id}
                      hotel={hotel}
                      selected={hotel.id === selectedHotelId}
                      currency={pkg.currency}
                      onSelect={() => handleHotelSelect(hotel.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price and CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Total from</p>
            <div className="text-2xl font-semibold text-foreground">
              {formatPrice(totalPrice, pkg.currency)}
            </div>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
          <Button asChild>
            <Link href={generateSearchUrl()}>View Package</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Static inclusion tag component
 */
function InclusionTag({ inclusion }: { inclusion: PackageInclusion }) {
  const Icon = inclusionIcons[inclusion.icon || "activity"] || Ticket;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full"
      title={inclusion.description}
    >
      <Icon className="h-3 w-3" />
      {inclusion.name}
    </span>
  );
}

/**
 * Flight option dropdown item
 */
function FlightOptionItem({
  flight,
  selected,
  currency,
  onSelect,
}: {
  flight: FlightOption;
  selected: boolean;
  currency: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
        selected && "bg-accent/5"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{flight.airline}</p>
        <p className="text-xs text-muted-foreground">
          {flight.departure} - {flight.arrival} | {flight.duration}
          {flight.stops > 0 && ` | ${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        {flight.priceAdjustment !== 0 && (
          <p
            className={cn(
              "text-xs font-medium",
              flight.priceAdjustment > 0 ? "text-destructive" : "text-success"
            )}
          >
            {flight.priceAdjustment > 0 ? "+" : ""}
            {formatPrice(flight.priceAdjustment, currency)}
          </p>
        )}
      </div>
      {selected && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
    </button>
  );
}

/**
 * Hotel option dropdown item
 */
function HotelOptionItem({
  hotel,
  selected,
  currency,
  onSelect,
}: {
  hotel: HotelOption;
  selected: boolean;
  currency: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
        selected && "bg-accent/5"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{hotel.name}</p>
          <div className="flex items-center">
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-accent text-accent" />
            ))}
          </div>
        </div>
        {hotel.location && (
          <p className="text-xs text-muted-foreground">{hotel.location}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {hotel.priceAdjustment !== 0 && (
          <p
            className={cn(
              "text-xs font-medium",
              hotel.priceAdjustment > 0 ? "text-destructive" : "text-success"
            )}
          >
            {hotel.priceAdjustment > 0 ? "+" : ""}
            {formatPrice(hotel.priceAdjustment, currency)}
          </p>
        )}
      </div>
      {selected && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
    </button>
  );
}

export default Top50PackageCard;
