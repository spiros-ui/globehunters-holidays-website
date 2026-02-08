"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, Suspense, useCallback, useRef } from "react";
import {
  Phone,
  Loader2,
  Building,
  Filter,
  Map,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/SearchForm";
import { ReferenceNumber } from "@/components/ui/ReferenceNumber";
import { cn } from "@/lib/utils";
import type { Currency } from "@/types";
import dynamic from "next/dynamic";

// Import hotel components
import {
  HotelCard,
  HotelCardSkeleton,
  HotelFilters,
  HotelResult,
  SortOption,
  BOOKING_BLUE,
  GH_ORANGE,
  calculateDistance,
} from "@/components/hotels";

// Dynamic import of HotelMap to avoid SSR issues with Leaflet
const HotelMap = dynamic(() => import("@/components/hotels/HotelMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#003580]" />
    </div>
  ),
});

function HotelsContent() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [selectedPopularFilters, setSelectedPopularFilters] = useState<string[]>([]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedRoomAmenities, setSelectedRoomAmenities] = useState<string[]>([]);
  const [minReviewScore, setMinReviewScore] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("topPicks");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Parse search params
  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("departureDate") || searchParams.get("checkIn");
  const checkOut = searchParams.get("returnDate") || searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const childAges = searchParams.get("childAges") || "";
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  // Calculate min/max prices
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
        h.amenities.includes("Breakfast")
      );
    }

    // Filter by other amenities
    const popularAmenityMap: Record<string, string> = {
      pool: "Swimming pool",
      wifi: "Free WiFi",
      parking: "Parking",
    };
    const amenityFilters = ["pool", "wifi", "parking"].filter(f => selectedPopularFilters.includes(f));
    if (amenityFilters.length > 0) {
      result = result.filter((h) =>
        amenityFilters.every(filter => {
          const normalized = popularAmenityMap[filter];
          return normalized ? h.amenities.includes(normalized) : false;
        })
      );
    }

    // Filter by price
    result = result.filter((h) => h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1]);

    // Filter by room amenities
    if (selectedRoomAmenities.length > 0) {
      result = result.filter((h) =>
        selectedRoomAmenities.every(amenity => h.amenities.includes(amenity))
      );
    }

    // Filter by property type
    if (selectedPropertyTypes.length > 0) {
      result = result.filter((h) => {
        const kind = h.kind || "Hotel";
        const displayName = kind.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        return selectedPropertyTypes.includes(displayName);
      });
    }

    // Filter by review score
    if (minReviewScore > 0) {
      result = result.filter((h) => h.reviewScore && h.reviewScore >= minReviewScore);
    }

    // Sort
    switch (sortBy) {
      case "price":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "stars":
        result = [...result].sort((a, b) => b.starRating - a.starRating);
        break;
      case "reviewScore":
        result = [...result].sort((a, b) => (b.reviewScore || 0) - (a.reviewScore || 0));
        break;
      case "distance":
        const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude && h.latitude !== 0 && h.longitude !== 0);
        if (hotelsWithCoords.length > 0) {
          const centerLat = hotelsWithCoords.reduce((sum, h) => sum + h.latitude, 0) / hotelsWithCoords.length;
          const centerLon = hotelsWithCoords.reduce((sum, h) => sum + h.longitude, 0) / hotelsWithCoords.length;
          result = [...result].sort((a, b) => {
            const distA = calculateDistance(a.latitude, a.longitude, centerLat, centerLon);
            const distB = calculateDistance(b.latitude, b.longitude, centerLat, centerLon);
            return distA - distB;
          });
        }
        break;
      case "topPicks":
      default:
        result = [...result].sort((a, b) => {
          const scoreA = (a.reviewScore || a.starRating * 2) * 10 - a.pricePerNight / 100;
          const scoreB = (b.reviewScore || b.starRating * 2) * 10 - b.pricePerNight / 100;
          return scoreB - scoreA;
        });
        break;
    }

    return result;
  }, [hotels, selectedStars, freeCancellationOnly, selectedPopularFilters, priceRange, selectedRoomAmenities, selectedPropertyTypes, minReviewScore, sortBy]);

  // Calculate center coordinates
  const centerCoordinates = useMemo(() => {
    const hotelsWithCoords = hotels.filter(h => h.latitude && h.longitude && h.latitude !== 0 && h.longitude !== 0);
    if (hotelsWithCoords.length === 0) return null;

    const sumLat = hotelsWithCoords.reduce((sum, h) => sum + h.latitude, 0);
    const sumLon = hotelsWithCoords.reduce((sum, h) => sum + h.longitude, 0);

    return {
      lat: sumLat / hotelsWithCoords.length,
      lon: sumLon / hotelsWithCoords.length,
    };
  }, [hotels]);

  // Calculate average price for "Great Deal" badges
  const avgPricePerNight = useMemo(() => {
    if (hotels.length === 0) return 0;
    return hotels.reduce((sum, h) => sum + h.pricePerNight, 0) / hotels.length;
  }, [hotels]);

  // Fetch hotels
  useEffect(() => {
    if (!destination || !checkIn || !checkOut) {
      setHotels([]);
      setLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMore(false);
      setTotalAvailable(0);

      try {
        const params = new URLSearchParams({
          destination,
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(),
          rooms: rooms.toString(),
          currency,
          page: "1",
        });
        if (childAges) params.set("childAges", childAges);

        const response = await fetch(`/api/search/hotels?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch hotels");
        }

        setHotels(data.data || []);
        setTotalAvailable(data.totalAvailable || 0);
        setHasMore(data.hasMore || false);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch hotels");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [destination, checkIn, checkOut, adults, children, childAges, rooms, currency]);

  // Load more hotels
  const loadMoreHotels = useCallback(async () => {
    if (!destination || !checkIn || !checkOut || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = new URLSearchParams({
        destination,
        checkIn,
        checkOut,
        adults: adults.toString(),
        children: children.toString(),
        rooms: rooms.toString(),
        currency,
        page: nextPage.toString(),
      });
      if (childAges) params.set("childAges", childAges);

      const response = await fetch(`/api/search/hotels?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load more hotels");
      }

      setHotels(prev => [...prev, ...(data.data || [])]);
      setHasMore(data.hasMore || false);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error("Error loading more hotels:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [destination, checkIn, checkOut, adults, children, childAges, rooms, currency, currentPage, loadingMore, hasMore]);

  const hasSearchParams = destination && checkIn && checkOut;
  const [searchFormOpen, setSearchFormOpen] = useState(!hasSearchParams);

  // Auto-scroll to results
  useEffect(() => {
    if (!loading && hotels.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, hotels.length]);

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      {/* Search Form */}
      <section style={{ backgroundColor: BOOKING_BLUE }}>
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
                  <SearchForm defaultType="hotels" />
                </div>
              )}
            </>
          ) : (
            <div className="py-6">
              <SearchForm defaultType="hotels" />
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section ref={resultsRef} className="py-6 min-h-[60vh]" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="container-wide">
          {/* Results Header */}
          <div className="flex flex-col gap-4 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {!hasSearchParams ? (
                  "Search Hotels"
                ) : loading ? (
                  <>{destination}: Searching...</>
                ) : (
                  <>{destination}: {totalAvailable > hotels.length ? totalAvailable : hotels.length} properties found</>
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

            {/* Reference Number */}
            {hasSearchParams && !loading && hotels.length > 0 && (
              <div className="mb-4">
                <ReferenceNumber
                  searchType="hotels"
                  searchParams={{
                    destination: destination || "",
                    checkIn: checkIn || "",
                    checkOut: checkOut || "",
                    adults: String(adults),
                    children: String(children),
                    rooms: String(rooms),
                  }}
                />
              </div>
            )}

            {/* Sorting Bar */}
            {hasSearchParams && !loading && hotels.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden flex items-center gap-2"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-sm bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580]"
                    >
                      <option value="topPicks">Our top picks</option>
                      <option value="price">Price (lowest first)</option>
                      <option value="stars">Property rating</option>
                      <option value="reviewScore">Top reviewed</option>
                      <option value="distance">Distance from center</option>
                    </select>
                  </div>
                </div>

                <Button
                  variant={showMap ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-2",
                    showMap && "bg-[#003580] text-white hover:bg-[#002855]"
                  )}
                  onClick={() => setShowMap(!showMap)}
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">{showMap ? "Hide map" : "Show on map"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Map */}
          {showMap && hasSearchParams && !loading && filteredHotels.length > 0 && (
            <div className="mb-5">
              <HotelMap
                destination={destination || ""}
                hotels={filteredHotels.map((hotel) => ({
                  id: hotel.id,
                  name: hotel.name,
                  lat: hotel.latitude,
                  lng: hotel.longitude,
                  price: hotel.pricePerNight,
                  currency: currency,
                  starRating: hotel.starRating,
                  mainImage: hotel.mainImage,
                  address: hotel.address || hotel.city,
                }))}
                onHotelClick={(hotelId) => {
                  const hotel = filteredHotels.find(h => h.id === hotelId);
                  if (hotel) {
                    const params = new URLSearchParams({
                      name: hotel.name,
                      thumbnail: hotel.mainImage || "",
                      address: hotel.address || "",
                      cityName: hotel.city || "",
                      destination: destination || "",
                      starRating: String(hotel.starRating),
                      pricePerNight: String(hotel.pricePerNight),
                      boardType: hotel.mealPlan || "Room Only",
                      refundable: String(hotel.freeCancellation),
                      currency: currency,
                      nights: String(hotel.nights),
                      checkIn: checkIn || "",
                      checkOut: checkOut || "",
                      rooms: String(rooms),
                      adults: String(adults),
                      children: String(children),
                      ...(childAges ? { childAges } : {}),
                    });
                    window.location.href = `/hotels/${encodeURIComponent(hotel.id)}?${params.toString()}`;
                  }
                }}
                onClose={() => setShowMap(false)}
                selectedHotelId={hoveredHotelId}
                height="400px"
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex gap-5">
            {/* Filters Sidebar */}
            {hasSearchParams && !loading && !error && hotels.length > 0 && (
              <HotelFilters
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
                selectedPropertyTypes={selectedPropertyTypes}
                setSelectedPropertyTypes={setSelectedPropertyTypes}
                selectedRoomAmenities={selectedRoomAmenities}
                setSelectedRoomAmenities={setSelectedRoomAmenities}
                minReviewScore={minReviewScore}
                setMinReviewScore={setMinReviewScore}
                currency={currency}
              />
            )}

            {/* Results List */}
            <div className="flex-1 min-w-0">
              {/* No Search */}
              {!hasSearchParams && (
                <div className="bg-white rounded-lg p-12 text-center border border-gray-200" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" }}>
                  <Building className="w-16 h-16 mx-auto mb-4" style={{ color: BOOKING_BLUE, opacity: 0.3 }} />
                  <h2 className="text-xl font-bold mb-2 text-gray-900">Start Your Hotel Search</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Enter your destination, check-in and check-out dates to discover available hotels.
                  </p>
                </div>
              )}

              {/* Loading */}
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
                  <div className="text-sm text-gray-600">
                    {filteredHotels.length === hotels.length ? (
                      totalAvailable > hotels.length ? (
                        <span>Showing {hotels.length} of {totalAvailable} properties available</span>
                      ) : (
                        <span>Showing all {hotels.length} properties</span>
                      )
                    ) : (
                      <span>Showing {filteredHotels.length} of {hotels.length} loaded properties ({totalAvailable} available)</span>
                    )}
                  </div>

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
                      children={children}
                      childAges={childAges}
                      centerLat={centerCoordinates?.lat}
                      centerLon={centerCoordinates?.lon}
                      avgPrice={avgPricePerNight}
                      onShowOnMap={(hotelId) => {
                        setShowMap(true);
                        setHoveredHotelId(hotelId);
                        setTimeout(() => {
                          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 100);
                      }}
                    />
                  ))}

                  {hasMore && (
                    <div className="flex flex-col items-center gap-2 pt-4">
                      <p className="text-sm text-gray-500">
                        Showing {hotels.length} of {totalAvailable} properties
                      </p>
                      <Button
                        onClick={loadMoreHotels}
                        disabled={loadingMore}
                        variant="outline"
                        size="lg"
                        className="px-8 border-[#003580] text-[#003580] hover:bg-[#003580]/5"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading more properties...
                          </>
                        ) : (
                          <>
                            <Building className="w-4 h-4 mr-2" />
                            Show more properties
                          </>
                        )}
                      </Button>
                    </div>
                  )}
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

              {/* No Filtered Results */}
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
                      setSelectedPropertyTypes([]);
                      setSelectedRoomAmenities([]);
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
