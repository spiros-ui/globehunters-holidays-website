"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { X, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";
import "leaflet/dist/leaflet.css";

// Booking.com style colors
const BOOKING_BLUE = "#003580";
const GH_ORANGE = "#f97316";

interface HotelMarkerData {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  price?: number;
  currency?: Currency;
  starRating?: number;
  mainImage?: string | null;
  address?: string;
}

interface HotelMapProps {
  hotels: HotelMarkerData[];
  destination?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  onHotelClick?: (hotelId: string) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  height?: string;
  selectedHotelId?: string | null;
  singleHotel?: boolean;
}

// Geocode cache to avoid repeated API calls
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

// Geocode a location using Nominatim (free)
async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(query)) {
    return geocodeCache.get(query) || null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "User-Agent": "GlobeHunters-Holidays/1.0",
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(query, result);
      return result;
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  geocodeCache.set(query, null);
  return null;
}

// Generate deterministic but varied coordinates around a center point
function generateHotelPosition(
  hotelId: string,
  center: { lat: number; lng: number },
  index: number,
  total: number
): { lat: number; lng: number } {
  // Create a deterministic hash from hotel ID
  const hash = hotelId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Generate position in a spiral pattern with some randomness
  const angle = (index / total) * 2 * Math.PI + (hash % 100) / 100;
  const distance = 0.01 + (index / total) * 0.04 + (hash % 50) / 1000;

  return {
    lat: center.lat + Math.sin(angle) * distance,
    lng: center.lng + Math.cos(angle) * distance * 1.5, // Adjust for lat/lng ratio
  };
}

export function HotelMap({
  hotels,
  destination,
  center: providedCenter,
  zoom = 13,
  onHotelClick,
  onClose,
  showCloseButton = true,
  height = "500px",
  selectedHotelId,
  singleHotel = false,
}: HotelMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [destinationCenter, setDestinationCenter] = useState<{ lat: number; lng: number } | null>(providedCenter || null);
  const [processedHotels, setProcessedHotels] = useState<Array<HotelMarkerData & { lat: number; lng: number }>>([]);

  // Geocode destination to get center
  useEffect(() => {
    if (providedCenter) {
      setDestinationCenter(providedCenter);
      return;
    }

    if (destination) {
      geocodeLocation(destination).then((coords) => {
        if (coords) {
          setDestinationCenter(coords);
        } else {
          // Default to London if geocoding fails
          setDestinationCenter({ lat: 51.5074, lng: -0.1278 });
        }
      });
    } else {
      // Default to London
      setDestinationCenter({ lat: 51.5074, lng: -0.1278 });
    }
  }, [destination, providedCenter]);

  // Process hotels to ensure they all have coordinates
  useEffect(() => {
    if (!destinationCenter) return;

    const processed = hotels.map((hotel, index) => {
      // If hotel already has valid coordinates, use them
      if (hotel.lat && hotel.lng && hotel.lat !== 0 && hotel.lng !== 0) {
        return { ...hotel, lat: hotel.lat, lng: hotel.lng };
      }

      // Generate coordinates based on destination center
      const pos = generateHotelPosition(hotel.id, destinationCenter, index, hotels.length);
      return { ...hotel, lat: pos.lat, lng: pos.lng };
    });

    setProcessedHotels(processed);
  }, [hotels, destinationCenter]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !destinationCenter || processedHotels.length === 0) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Destroy existing map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Create map
      mapRef.current = L.map(mapContainerRef.current!, {
        center: [destinationCenter.lat, destinationCenter.lng],
        zoom: singleHotel ? 15 : zoom,
        zoomControl: false,
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      // Add zoom controls in bottom right
      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add markers for each hotel
      processedHotels.forEach((hotel) => {
        const isSelected = selectedHotelId === hotel.id;

        // Create custom marker icon with price
        const markerHtml = hotel.price
          ? `<div class="hotel-marker" style="
              background: ${isSelected ? GH_ORANGE : BOOKING_BLUE};
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: all 0.2s;
              border: 2px solid ${isSelected ? 'white' : 'transparent'};
            ">${formatPrice(hotel.price, hotel.currency || "GBP")}</div>`
          : `<div class="hotel-marker" style="
              background: ${isSelected ? GH_ORANGE : BOOKING_BLUE};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
              transition: all 0.2s;
              border: 2px solid ${isSelected ? 'white' : 'transparent'};
            "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M4 11h16v10H4z"></path></svg></div>`;

        const icon = L.divIcon({
          html: markerHtml,
          className: "hotel-map-marker",
          iconSize: hotel.price ? [80, 32] : [28, 28],
          iconAnchor: hotel.price ? [40, 16] : [14, 14],
        });

        const marker = L.marker([hotel.lat, hotel.lng], { icon })
          .addTo(mapRef.current!);

        // Create popup content
        const popupContent = `
          <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
            ${hotel.mainImage ? `<img src="${hotel.mainImage}" alt="${hotel.name}" style="width: calc(100% + 40px); height: 120px; object-fit: cover; border-radius: 4px 4px 0 0; margin: -20px -20px 12px -20px;" onerror="this.style.display='none'" />` : ''}
            <div style="font-weight: bold; font-size: 14px; color: #1a1a2e; margin-bottom: 4px; line-height: 1.3;">${hotel.name}</div>
            ${hotel.starRating ? `<div style="color: #feba02; font-size: 12px; margin-bottom: 6px;">${'★'.repeat(hotel.starRating)}${'☆'.repeat(5 - hotel.starRating)}</div>` : ''}
            ${hotel.address ? `<div style="font-size: 12px; color: #666; margin-bottom: 8px; line-height: 1.3;">${hotel.address}</div>` : ''}
            ${hotel.price ? `<div style="font-weight: bold; font-size: 18px; color: ${BOOKING_BLUE}; margin-bottom: 10px;">${formatPrice(hotel.price, hotel.currency || "GBP")} <span style="font-size: 12px; font-weight: normal; color: #666;">per night</span></div>` : ''}
            <button onclick="window.dispatchEvent(new CustomEvent('hotel-map-click', { detail: '${hotel.id}' }))" style="
              width: 100%;
              background: ${GH_ORANGE};
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 13px;
              cursor: pointer;
            ">View Hotel</button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          className: "hotel-map-popup",
        });

        // Open popup for selected hotel
        if (isSelected) {
          setTimeout(() => marker.openPopup(), 100);
        }

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      if (processedHotels.length > 1 && !singleHotel) {
        const bounds = L.latLngBounds(processedHotels.map(h => [h.lat, h.lng]));
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (processedHotels.length === 1) {
        mapRef.current.setView([processedHotels[0].lat, processedHotels[0].lng], 15);
      }

      setIsLoading(false);
    };

    initMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [destinationCenter, processedHotels, selectedHotelId, zoom, singleHotel]);

  // Listen for hotel click events from popup buttons
  useEffect(() => {
    const handleHotelClick = (e: CustomEvent<string>) => {
      if (onHotelClick) {
        onHotelClick(e.detail);
      }
    };

    window.addEventListener("hotel-map-click", handleHotelClick as EventListener);
    return () => {
      window.removeEventListener("hotel-map-click", handleHotelClick as EventListener);
    };
  }, [onHotelClick]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-lg" style={{ height }}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#003580]" />
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* Close button */}
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Close map"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Hotel count badge */}
      {!singleHotel && processedHotels.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000] bg-white rounded-lg px-3 py-2 shadow-md">
          <span className="text-sm font-semibold text-gray-900">
            {processedHotels.length} {processedHotels.length === 1 ? "property" : "properties"}
          </span>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style jsx global>{`
        .hotel-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .hotel-map-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .hotel-map-popup .leaflet-popup-content {
          margin: 20px;
        }
        .hotel-map-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #333 !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f5f5f5 !important;
        }
      `}</style>
    </div>
  );
}

export default HotelMap;
