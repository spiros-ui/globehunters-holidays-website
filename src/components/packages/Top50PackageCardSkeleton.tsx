"use client";

import { cn } from "@/lib/utils";

interface Top50PackageCardSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton for Top50PackageCard
 * Matches the shimmer animation style from existing skeletons
 */
export function Top50PackageCardSkeleton({
  className,
}: Top50PackageCardSkeletonProps) {
  const shimmerClass =
    "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer";
  const shimmerStyle = { backgroundSize: "1000px 100%" };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row",
        className
      )}
    >
      {/* Image skeleton */}
      <div
        className={cn(
          "w-full md:w-[320px] lg:w-[360px] aspect-[16/10] md:aspect-auto md:h-[280px] flex-shrink-0",
          shimmerClass
        )}
        style={shimmerStyle}
      />

      {/* Content skeleton */}
      <div className="flex-1 p-5">
        {/* Header skeleton */}
        <div className="mb-3">
          <div
            className={cn("h-6 w-3/4 rounded mb-2", shimmerClass)}
            style={shimmerStyle}
          />
          <div className="flex gap-3">
            <div
              className={cn("h-4 w-24 rounded", shimmerClass)}
              style={shimmerStyle}
            />
            <div
              className={cn("h-4 w-20 rounded", shimmerClass)}
              style={shimmerStyle}
            />
          </div>
        </div>

        {/* Inclusions skeleton */}
        <div className="mb-4">
          <div
            className={cn("h-3 w-24 rounded mb-2", shimmerClass)}
            style={shimmerStyle}
          />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn("h-6 w-24 rounded-full", shimmerClass)}
                style={shimmerStyle}
              />
            ))}
          </div>
        </div>

        {/* Selectors skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div
            className={cn("h-16 rounded-lg", shimmerClass)}
            style={shimmerStyle}
          />
          <div
            className={cn("h-16 rounded-lg", shimmerClass)}
            style={shimmerStyle}
          />
        </div>

        {/* Price and CTA skeleton */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-100">
          <div>
            <div
              className={cn("h-3 w-16 rounded mb-1", shimmerClass)}
              style={shimmerStyle}
            />
            <div
              className={cn("h-8 w-24 rounded mb-1", shimmerClass)}
              style={shimmerStyle}
            />
            <div
              className={cn("h-3 w-14 rounded", shimmerClass)}
              style={shimmerStyle}
            />
          </div>
          <div
            className={cn("h-11 w-32 rounded-lg", shimmerClass)}
            style={shimmerStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default Top50PackageCardSkeleton;
