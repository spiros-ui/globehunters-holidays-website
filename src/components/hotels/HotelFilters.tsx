"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import type { Currency } from "@/types";
import type { FiltersProps } from "./types";
import { BOOKING_BLUE, GH_ORANGE, POPULAR_FILTERS, getReviewLabel } from "./constants";

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
    const newMin = Math.min(Number(e.target.value), localMax - 1);
    setLocalMin(newMin);
    onChange([newMin, localMax]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localMin + 1);
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

// Main Filters Panel component
export function HotelFilters({
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
  selectedPropertyTypes,
  setSelectedPropertyTypes,
  selectedRoomAmenities,
  setSelectedRoomAmenities,
  minReviewScore,
  setMinReviewScore,
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

  const hasActiveFilters = selectedStars.length > 0 ||
    freeCancellationOnly ||
    priceRange[0] > minPrice ||
    priceRange[1] < maxPrice ||
    selectedPopularFilters.length > 0 ||
    selectedPropertyTypes.length > 0 ||
    selectedRoomAmenities.length > 0 ||
    minReviewScore > 0;

  const clearAllFilters = () => {
    setSelectedStars([]);
    setFreeCancellationOnly(false);
    setPriceRange([minPrice, maxPrice]);
    setSelectedPopularFilters([]);
    setSelectedPropertyTypes([]);
    setSelectedRoomAmenities([]);
    setMinReviewScore(0);
  };

  const togglePopularFilter = (filterId: string) => {
    if (selectedPopularFilters.includes(filterId)) {
      setSelectedPopularFilters(selectedPopularFilters.filter(f => f !== filterId));
    } else {
      setSelectedPopularFilters([...selectedPopularFilters, filterId]);
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
          <button
            onClick={clearAllFilters}
            className="text-xs text-[#0071c2] hover:underline font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 1. Budget (per night) */}
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
            else {
              const amenityMap: Record<string, string> = {
                wifi: "Free WiFi",
                pool: "Swimming pool",
                parking: "Parking",
              };
              const normalizedName = amenityMap[filter.id];
              count = normalizedName
                ? hotels.filter(h => h.amenities.includes(normalizedName)).length
                : hotels.filter(h => h.amenities.some(a => a.toLowerCase().includes(filter.id))).length;
            }

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
      {hotels.some(h => h.reviewScore && h.reviewScore > 0) && (
        <div className="pb-5 border-b border-gray-200">
          <h3 className="font-semibold text-sm mb-3 text-gray-900">Guest review score</h3>
          <div className="space-y-1">
            {[
              { min: 9, label: `${getReviewLabel(9)} 9+` },
              { min: 8, label: `${getReviewLabel(8)} 8+` },
              { min: 7, label: `${getReviewLabel(7)} 7+` },
              { min: 6, label: `${getReviewLabel(6)} 6+` },
            ].map(({ min, label }) => {
              const count = hotels.filter(h => h.reviewScore && h.reviewScore >= min).length;
              return (
                <FilterCheckbox
                  key={min}
                  checked={minReviewScore === min}
                  onChange={(checked) => setMinReviewScore(checked ? min : 0)}
                  label={label}
                  count={count}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Property Type */}
      {(() => {
        const typeCounts: Record<string, number> = {};
        hotels.forEach(h => {
          const kind = h.kind || "Hotel";
          const displayName = kind.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          typeCounts[displayName] = (typeCounts[displayName] || 0) + 1;
        });
        const types = Object.entries(typeCounts)
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1]);

        if (types.length <= 1) return null;

        return (
          <div className="pb-5 border-b border-gray-200">
            <h3 className="font-semibold text-sm mb-3 text-gray-900">Property type</h3>
            <div className="space-y-1">
              {types.map(([type, count]) => (
                <FilterCheckbox
                  key={type}
                  checked={selectedPropertyTypes.includes(type)}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedPropertyTypes([...selectedPropertyTypes, type]);
                    } else {
                      setSelectedPropertyTypes(selectedPropertyTypes.filter(t => t !== type));
                    }
                  }}
                  label={type}
                  count={count}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* 5. Room Amenities */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-gray-900">Room amenities</h3>
        <div className="space-y-1">
          {["Free WiFi", "Swimming pool", "Air conditioning", "Kitchen", "Private bathroom", "Balcony", "Spa", "Beach", "Parking", "Restaurant"].map((amenity) => {
            const count = hotels.filter(h =>
              h.amenities.some(a => a === amenity)
            ).length;
            return (
              <FilterCheckbox
                key={amenity}
                checked={selectedRoomAmenities.includes(amenity)}
                onChange={(checked) => {
                  if (checked) {
                    setSelectedRoomAmenities([...selectedRoomAmenities, amenity]);
                  } else {
                    setSelectedRoomAmenities(selectedRoomAmenities.filter(a => a !== amenity));
                  }
                }}
                label={amenity}
                count={count}
              />
            );
          })}
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

      {/* Mobile Filters Drawer */}
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
