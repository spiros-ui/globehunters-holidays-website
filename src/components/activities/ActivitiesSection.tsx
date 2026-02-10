"use client";

import { useState, useEffect } from "react";
import { Loader2, Compass, ChevronRight, AlertCircle, Phone } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import { formatPrice } from "@/lib/utils";
import type { Currency, ActivityOffer } from "@/types";

// Booking phone number for activities
const BOOKING_PHONE = "020 8944 4555";

interface ActivitiesSectionProps {
  destination: string;
  currency: Currency;
  startDate?: string;
  endDate?: string;
  selectedActivities?: Record<string, number>;
  onToggleActivity?: (id: string, price: number) => void;
  showTitle?: boolean;
  maxItems?: number;
  compact?: boolean;
}

export function ActivitiesSection({
  destination,
  currency,
  startDate,
  endDate,
  selectedActivities = {},
  onToggleActivity,
  showTitle = true,
  maxItems = 8,
  compact = false,
}: ActivitiesSectionProps) {
  const [activities, setActivities] = useState<ActivityOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!destination) {
        setActivities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          destination,
          currency,
          limit: String(maxItems),
          mode: startDate && endDate ? "search" : "top",
        });

        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const response = await fetch(`/api/search/activities?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch activities");
        }

        // Filter out activities without valid images
        const activitiesWithImages = (data.data || []).filter((activity: ActivityOffer) => {
          // Check if activity has at least one valid image
          const hasValidImage = activity.images &&
            activity.images.length > 0 &&
            activity.images[0]?.url &&
            activity.images[0].url.length > 0 &&
            !activity.images[0].url.includes("placeholder") &&
            activity.images[0].url.startsWith("http");
          return hasValidImage;
        });
        setActivities(activitiesWithImages);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError(err instanceof Error ? err.message : "Failed to load activities");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [destination, currency, startDate, endDate, maxItems]);

  // Calculate total for selected activities
  const selectedTotal = Object.values(selectedActivities).reduce((sum, price) => sum + price, 0);
  const selectedCount = Object.keys(selectedActivities).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading activities for {destination}...</span>
        </div>
      </div>
    );
  }

  if (error || activities.length === 0) {
    // Don't show error state if no activities - just return null
    if (activities.length === 0 && !error) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            {error || `No activities found for ${destination}`}
          </span>
        </div>
      </div>
    );
  }

  const displayedActivities = showAll ? activities : activities.slice(0, compact ? 4 : maxItems);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      {showTitle && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">
                Things to Do in {destination}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {activities.length} activities
              </span>
            </div>

            {selectedCount > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">{selectedCount} selected:</span>
                <span className="font-bold text-orange-600 ml-1">
                  +{formatPrice(selectedTotal, currency)}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tours and experiences available. Call to add activities to your package.
          </p>
        </div>
      )}

      {/* Activities grid/list */}
      <div className="p-4">
        {compact ? (
          <div className="space-y-2">
            {displayedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                currency={currency}
                isSelected={activity.id in selectedActivities}
                onToggleSelect={onToggleActivity}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                currency={currency}
                isSelected={activity.id in selectedActivities}
                onToggleSelect={onToggleActivity}
              />
            ))}
          </div>
        )}

        {/* Show more button */}
        {activities.length > (compact ? 4 : maxItems) && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-4 py-2 text-sm text-[#003580] font-medium flex items-center justify-center gap-1 hover:underline"
          >
            Show all {activities.length} activities
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Footer with call to book */}
      <div className="px-4 py-3 bg-orange-50 border-t border-orange-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">
            Experiences & Activities
          </p>
          <a
            href={`tel:+44${BOOKING_PHONE.replace(/\s/g, "").replace(/^0/, "")}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-md hover:bg-orange-600 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            Call to book: {BOOKING_PHONE}
          </a>
        </div>
      </div>
    </div>
  );
}
