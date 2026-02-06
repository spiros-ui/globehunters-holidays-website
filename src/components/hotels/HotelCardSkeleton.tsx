"use client";

/**
 * Skeleton loading card with shimmer effect
 */
export function HotelCardSkeleton() {
  const shimmerClass = "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer";
  const shimmerStyle = { backgroundSize: "1000px 100%" };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className={`w-full md:w-[280px] lg:w-[320px] h-52 md:h-[220px] ${shimmerClass}`} style={shimmerStyle} />
        <div className="flex-1 p-4">
          <div className="flex justify-between mb-3">
            <div className={`h-5 rounded w-2/3 ${shimmerClass}`} style={shimmerStyle} />
            <div className={`h-8 w-12 rounded ${shimmerClass}`} style={shimmerStyle} />
          </div>
          <div className={`h-4 rounded w-1/2 mb-3 ${shimmerClass}`} style={shimmerStyle} />
          <div className={`h-4 rounded w-1/3 mb-3 ${shimmerClass}`} style={shimmerStyle} />
          <div className="flex gap-2 mb-3">
            <div className={`h-4 rounded w-20 ${shimmerClass}`} style={shimmerStyle} />
            <div className={`h-4 rounded w-24 ${shimmerClass}`} style={shimmerStyle} />
          </div>
          <div className={`h-4 rounded w-1/4 ${shimmerClass}`} style={shimmerStyle} />
        </div>
        <div className="md:w-40 p-4 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/50 flex flex-col items-end justify-end">
          <div className={`h-6 rounded w-20 mb-2 ${shimmerClass}`} style={shimmerStyle} />
          <div className={`h-4 rounded w-16 mb-3 ${shimmerClass}`} style={shimmerStyle} />
          <div className={`h-10 rounded w-full ${shimmerClass}`} style={shimmerStyle} />
        </div>
      </div>
    </div>
  );
}
