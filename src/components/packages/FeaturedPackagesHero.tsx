"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FeaturedPackageCard } from "./FeaturedPackageCard";
import { FeaturedPackageCardSkeleton } from "./FeaturedPackageCardSkeleton";
import type { FeaturedPackage } from "./types";

interface FeaturedPackagesHeroProps {
  packages: FeaturedPackage[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Hero section component for Top 50 featured packages
 * Displays packages in an auto-scrolling carousel with infinite loop
 */
export function FeaturedPackagesHero({
  packages,
  title = "Featured Packages",
  subtitle = "Handpicked holiday packages with the best value",
  loading = false,
  className,
}: FeaturedPackagesHeroProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);

  const checkScrollability = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  }, []);

  React.useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [checkScrollability, packages]);

  const scroll = React.useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = container.querySelector("a")?.offsetWidth || 280;
      const scrollAmount = cardWidth + 16; // card width + gap
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (direction === "right") {
        // If at or near the end, loop back to start
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      } else {
        // If at start, loop to end
        if (container.scrollLeft <= 10) {
          container.scrollTo({ left: maxScroll, behavior: "smooth" });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      }
      // Check scrollability after animation
      setTimeout(checkScrollability, 350);
    }
  }, [checkScrollability]);

  // Auto-scroll functionality
  const startAutoScroll = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      scroll("right");
    }, 3500);
  }, [scroll]);

  const stopAutoScroll = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize auto-scroll on mount
  React.useEffect(() => {
    if (!loading && packages.length > 0) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [loading, packages.length, startAutoScroll, stopAutoScroll]);

  // Handle hover pause
  const handleMouseEnter = () => {
    setIsPaused(true);
    stopAutoScroll();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startAutoScroll();
  };

  // Show 4 skeletons when loading
  const skeletonCount = 4;

  return (
    <section className={cn("section", className)}>
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-display text-white font-bold mb-2" style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)" }}>{title}</h2>
            <p className="text-white/90 font-medium" style={{ textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)" }}>{subtitle}</p>
          </div>

          {/* Navigation arrows - hidden on mobile */}
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={loading}
              aria-label="Scroll left"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={loading}
              aria-label="Scroll right"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable card container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0 snap-x snap-mandatory"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {loading
            ? // Loading skeletons
              Array.from({ length: skeletonCount }).map((_, index) => (
                <FeaturedPackageCardSkeleton
                  key={`skeleton-${index}`}
                  className="flex-none w-[200px] sm:w-[180px] md:w-[200px] lg:w-[220px] snap-start"
                />
              ))
            : // Actual packages - compact cards
              packages.map((pkg, index) => (
                <FeaturedPackageCard
                  key={pkg.id}
                  package={pkg}
                  priority={index < 4}
                  className="flex-none w-[200px] sm:w-[180px] md:w-[200px] lg:w-[220px] snap-start"
                />
              ))}
        </div>

        {/* View all link */}
        {!loading && packages.length > 0 && (
          <div className="text-center mt-6 sm:hidden">
            <Button variant="outline" asChild>
              <a href="/packages">View All Packages</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedPackagesHero;
