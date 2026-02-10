"use client";

import Image from "next/image";
import { Star, Clock, Check, Plus, Phone, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

// Booking phone number for activities
const BOOKING_PHONE = "020 8944 4555";

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    description?: string;
    shortDescription?: string;
    images: Array<{ url: string; caption?: string }>;
    duration: string;
    price: { amount: number; currency: Currency };
    rating?: number;
    reviewCount?: number;
    categories: string[];
    includes?: string[];
    bookingUrl?: string;
  };
  currency: Currency;
  isSelected?: boolean;
  onToggleSelect?: (id: string, price: number) => void;
  compact?: boolean;
}

const ACTIVITY_PLACEHOLDER = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&h=400&fit=crop&q=80";

export function ActivityCard({
  activity,
  currency,
  isSelected = false,
  onToggleSelect,
  compact = false,
}: ActivityCardProps) {
  const imageUrl = activity.images?.[0]?.url || ACTIVITY_PLACEHOLDER;
  const displayDescription = activity.shortDescription || activity.description || "";

  if (compact) {
    // Compact version for package listings
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? "border-orange-400 bg-orange-50 shadow-sm"
            : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
        }`}
        onClick={() => onToggleSelect?.(activity.id, activity.price.amount)}
      >
        {/* Small image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
          <Image
            src={imageUrl}
            alt={activity.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-medium text-sm text-gray-900 truncate">{activity.title}</h4>
          </div>
          {activity.categories?.[0] && (
            <span className="inline-flex items-center text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {activity.categories[0]}
            </span>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {activity.rating && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {activity.rating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {activity.duration}
            </span>
          </div>
        </div>

        {/* Price and action */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="font-bold text-sm text-gray-900">
              {formatPrice(activity.price.amount, currency)}
            </div>
            <div className="text-[10px] text-gray-500">per person</div>
          </div>
          {onToggleSelect && (
            <button
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              {isSelected ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full card version
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-40 bg-gray-100">
        <Image
          src={imageUrl}
          alt={activity.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
        />
        {activity.categories?.[0] && (
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded">
              {activity.categories[0]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
          {activity.title}
        </h3>

        {displayDescription && (
          <p className="text-xs text-gray-500 mb-2">
            {displayDescription}
          </p>
        )}

        {/* Rating and duration */}
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          {activity.rating && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{activity.rating.toFixed(1)}</span>
              {activity.reviewCount && (
                <span className="text-gray-400">({activity.reviewCount.toLocaleString()})</span>
              )}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {activity.duration}
          </span>
        </div>

        {/* Includes preview */}
        {activity.includes && activity.includes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {activity.includes.slice(0, 2).map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded"
              >
                <Check className="h-2.5 w-2.5 mr-0.5" />
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(activity.price.amount, currency)}
            </div>
            <div className="text-[10px] text-gray-500">per person</div>
          </div>

          {onToggleSelect ? (
            <button
              onClick={() => onToggleSelect(activity.id, activity.price.amount)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-orange-500 text-white"
                  : "bg-orange-100 text-orange-700 hover:bg-orange-200"
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3 inline mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 inline mr-1" />
                  Add
                </>
              )}
            </button>
          ) : (
            <a
              href={`tel:+44${BOOKING_PHONE.replace(/\s/g, "").replace(/^0/, "")}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <Phone className="h-3 w-3" />
              Call to Book
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
