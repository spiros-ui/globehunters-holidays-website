"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Plane, Building, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchForm } from "./SearchForm";

export function CollapsibleSearchSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Collapsed teaser bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full group transition-all duration-300",
          isExpanded
            ? "mb-0"
            : "mb-0"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border/50 transition-all duration-300",
            isExpanded
              ? "bg-white/80 backdrop-blur-md shadow-xl border-accent/20"
              : "bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-accent/30"
          )}
        >
          {/* Teaser bar — always visible */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                <Search className="h-5 w-5 text-accent" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-serif font-semibold text-foreground">
                  Search for Your Perfect Holiday
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" /> Packages
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1">
                    <Plane className="h-3 w-3" /> Flights
                  </span>
                  <span className="text-border">|</span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" /> Hotels
                  </span>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium text-accent transition-transform duration-300",
                isExpanded ? "rotate-180" : ""
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>
      </button>

      {/* Expandable search form */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isExpanded
            ? "max-h-[800px] opacity-100 mt-4"
            : "max-h-0 opacity-0 mt-0"
        )}
      >
        <div className="rounded-2xl shadow-xl border border-border/30 overflow-hidden backdrop-blur-md bg-white/95">
          <SearchForm />
        </div>
      </div>
    </div>
  );
}

export default CollapsibleSearchSection;
