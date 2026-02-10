"use client";

import { cn } from "@/lib/utils";

interface FeaturedPackageCardSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton for FeaturedPackageCard
 * Matches the shimmer animation style from HotelCardSkeleton
 */
export function FeaturedPackageCardSkeleton({
  className,
}: FeaturedPackageCardSkeletonProps) {
  const shimmerClass =
    "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer";
  const shimmerStyle = { backgroundSize: "1000px 100%" };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gray-100",
        className
      )}
    >
      {/* Image placeholder - compact square */}
      <div
        className={cn("aspect-square w-full", shimmerClass)}
        style={shimmerStyle}
      />

      {/* Content overlay skeleton */}
      <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
        {/* Price skeleton */}
        <div
          className={cn("h-6 w-24 rounded", shimmerClass)}
          style={shimmerStyle}
        />

        {/* Title skeleton */}
        <div
          className={cn("h-5 w-3/4 rounded", shimmerClass)}
          style={shimmerStyle}
        />

        {/* Meta skeleton */}
        <div className="flex gap-3">
          <div
            className={cn("h-4 w-20 rounded", shimmerClass)}
            style={shimmerStyle}
          />
          <div
            className={cn("h-4 w-16 rounded", shimmerClass)}
            style={shimmerStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default FeaturedPackageCardSkeleton;
