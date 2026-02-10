"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Top50PackageCard } from "./Top50PackageCard";
import { Top50PackageCardSkeleton } from "./Top50PackageCardSkeleton";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Top50Package } from "./types";

// Import package data to get additional info (images, countries, regions)
import top50PackagesData from "@/data/top50-packages.json";

// Region definitions for tabs
const REGIONS = [
  { id: null, name: "All Destinations" },
  { id: "europe", name: "Europe" },
  { id: "asia", name: "Asia" },
  { id: "middle-east", name: "Middle East" },
  { id: "americas", name: "Americas" },
  { id: "africa", name: "Africa" },
  { id: "oceania", name: "Oceania" },
  { id: "indian-ocean", name: "Indian Ocean" },
];

interface DestinationInfo {
  name: string;
  country: string;
  region: string;
  image: string;
  packageCount: number;
}

interface Top50PackagesSectionProps {
  packages: Top50Package[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  initialDisplayCount?: number;
  className?: string;
  onFlightChange?: (packageId: string, flightId: string) => void;
  onHotelChange?: (packageId: string, hotelId: string) => void;
}

/**
 * Section component for Top 50 packages below the fold
 * Shows packages with static inclusions and dynamic flight/hotel options
 */
export function Top50PackagesSection({
  packages,
  title = "Top 50 Holiday Packages",
  subtitle = "Pre-built packages with real experiences - just choose your flight and hotel",
  loading = false,
  initialDisplayCount = 10,
  className,
  onFlightChange,
  onHotelChange,
}: Top50PackagesSectionProps) {
  const [displayCount, setDisplayCount] = React.useState(initialDisplayCount);
  const [selectedDestination, setSelectedDestination] = React.useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = React.useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Build destination info from the JSON data
  const destinationInfoMap = React.useMemo(() => {
    const map = new Map<string, DestinationInfo>();

    for (const pkg of top50PackagesData.packages) {
      const existing = map.get(pkg.destinationName);
      if (existing) {
        existing.packageCount++;
      } else {
        map.set(pkg.destinationName, {
          name: pkg.destinationName,
          country: pkg.country,
          region: pkg.region,
          image: pkg.heroImage,
          packageCount: 1,
        });
      }
    }

    return map;
  }, []);

  // Get destinations filtered by region
  const filteredDestinations = React.useMemo(() => {
    const destinations = Array.from(destinationInfoMap.values());
    if (!selectedRegion) return destinations;
    return destinations.filter((d) => d.region === selectedRegion);
  }, [destinationInfoMap, selectedRegion]);

  // Filter packages by selected destination
  const filteredPackages = React.useMemo(() => {
    if (!selectedDestination) {
      // If region is selected but no specific destination, filter by region
      if (selectedRegion) {
        const destinationsInRegion = filteredDestinations.map((d) => d.name);
        return packages.filter((pkg) => destinationsInRegion.includes(pkg.destination));
      }
      return packages;
    }
    return packages.filter((pkg) => pkg.destination === selectedDestination);
  }, [packages, selectedDestination, selectedRegion, filteredDestinations]);

  // Visible packages based on display count
  const visiblePackages = filteredPackages.slice(0, displayCount);
  const hasMore = displayCount < filteredPackages.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 10, filteredPackages.length));
  };

  // Reset display count when filter changes
  React.useEffect(() => {
    setDisplayCount(initialDisplayCount);
  }, [selectedDestination, selectedRegion, initialDisplayCount]);

  // Reset destination when region changes
  React.useEffect(() => {
    setSelectedDestination(null);
  }, [selectedRegion]);

  // Scroll functions for carousel navigation
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Skeleton count for loading state
  const skeletonCount = 3;

  return (
    <section className={cn("section bg-muted/30", className)}>
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-display text-foreground mb-3">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Region Tabs */}
        {!loading && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {REGIONS.map((region) => (
              <button
                key={region.id ?? "all"}
                onClick={() => setSelectedRegion(region.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  selectedRegion === region.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-foreground hover:bg-muted border border-border"
                )}
              >
                {region.name}
              </button>
            ))}
          </div>
        )}

        {/* Destination Cards Carousel */}
        {!loading && filteredDestinations.length > 0 && (
          <div className="relative mb-10">
            {/* Navigation Arrows */}
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-muted transition-colors -ml-2 md:ml-0"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-muted transition-colors -mr-2 md:mr-0"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide px-8 md:px-12 py-2 -mx-4 md:mx-0"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {/* "All" Card */}
              <button
                onClick={() => setSelectedDestination(null)}
                className={cn(
                  "flex-shrink-0 w-40 md:w-48 rounded-xl overflow-hidden relative group transition-all duration-300",
                  "scroll-snap-align-start",
                  selectedDestination === null
                    ? "ring-2 ring-accent ring-offset-2 shadow-lg scale-[1.02]"
                    : "hover:shadow-lg hover:scale-[1.02]"
                )}
              >
                <div className="relative h-28 md:h-32 bg-gradient-to-br from-primary to-primary/80">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-3xl md:text-4xl font-bold mb-1">
                        {filteredDestinations.reduce((sum, d) => sum + d.packageCount, 0)}
                      </div>
                      <div className="text-xs uppercase tracking-wide opacity-90">Packages</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 text-center">
                  <h3 className="font-semibold text-foreground text-sm">All Destinations</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filteredDestinations.length} locations
                  </p>
                </div>
                {selectedDestination === null && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Destination Cards */}
              {filteredDestinations.map((destination) => (
                <button
                  key={destination.name}
                  onClick={() => setSelectedDestination(destination.name)}
                  className={cn(
                    "flex-shrink-0 w-40 md:w-48 rounded-xl overflow-hidden relative group transition-all duration-300",
                    "scroll-snap-align-start",
                    selectedDestination === destination.name
                      ? "ring-2 ring-accent ring-offset-2 shadow-lg scale-[1.02]"
                      : "hover:shadow-lg hover:scale-[1.02]"
                  )}
                >
                  {/* Image */}
                  <div className="relative h-28 md:h-32">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 160px, 192px"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {/* Package Count Badge */}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-2 py-1 rounded-full">
                      {destination.packageCount} {destination.packageCount === 1 ? "pkg" : "pkgs"}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="bg-white p-3">
                    <h3 className="font-semibold text-foreground text-sm truncate">{destination.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {destination.country}
                    </p>
                  </div>
                  {/* Selected Indicator */}
                  {selectedDestination === destination.name && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filter Indicator */}
        {(selectedDestination || selectedRegion) && !loading && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground">Showing:</span>
            {selectedRegion && !selectedDestination && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                {REGIONS.find((r) => r.id === selectedRegion)?.name}
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {selectedDestination && (
              <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-sm font-medium px-3 py-1 rounded-full">
                {selectedDestination}
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="ml-1 hover:bg-accent/20 rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDestination(null);
                setSelectedRegion(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Package List */}
        <div className="space-y-6">
          {loading
            ? // Loading skeletons
              Array.from({ length: skeletonCount }).map((_, index) => (
                <Top50PackageCardSkeleton key={`skeleton-${index}`} />
              ))
            : // Actual packages
              visiblePackages.map((pkg) => (
                <Top50PackageCard
                  key={pkg.id}
                  package={pkg}
                  onFlightChange={onFlightChange}
                  onHotelChange={onHotelChange}
                />
              ))}
        </div>

        {/* Empty State */}
        {!loading && filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No packages found for this destination.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSelectedDestination(null);
                setSelectedRegion(null);
              }}
            >
              View All Packages
            </Button>
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" onClick={handleLoadMore}>
              Load More Packages ({filteredPackages.length - displayCount} remaining)
            </Button>
          </div>
        )}

        {/* View count indicator */}
        {!loading && filteredPackages.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Showing {visiblePackages.length} of {filteredPackages.length} packages
          </p>
        )}
      </div>
    </section>
  );
}

export default Top50PackagesSection;
