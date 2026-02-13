"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, Info } from "lucide-react";

interface SessionDetails {
  packageId?: string;
  packageName?: string;
  selectedHotelTier?: string;
  selectedAirline?: string;
  selectedBoardBasis?: string;
  selectedActivities?: string[];
}

interface ReferenceNumberProps {
  searchType: "flights" | "hotels" | "packages";
  searchParams?: Record<string, string>;
  selectedItemId?: string;
  selectedItemData?: Record<string, unknown>;
  session?: SessionDetails;
}

// Base62 characters for encoding (easy to read over phone)
const BASE62 = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

// Encode URL to a short reference code
function encodeUrlToRef(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const search = urlObj.search;

    // Create a compact representation
    const data = path + search;

    // Simple compression: convert to base62
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Make hash positive
    hash = Math.abs(hash);

    // Convert to base62
    let result = "";
    while (hash > 0) {
      result = BASE62[hash % 34] + result;
      hash = Math.floor(hash / 34);
    }

    // Pad to 6 chars
    while (result.length < 6) {
      result = "0" + result;
    }

    return result.substring(0, 6);
  } catch {
    // Fallback to random
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += BASE62.charAt(Math.floor(Math.random() * BASE62.length));
    }
    return code;
  }
}

export function ReferenceNumber({
  searchType,
  session,
}: ReferenceNumberProps) {
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const refRef = useRef<string>("");
  const urlRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);

    // Generate unique reference based on the FULL URL (path + params)
    // This makes each page have a unique reference
    const fullUrl = window.location.href;
    const urlHash = encodeUrlToRef(fullUrl);
    const ref = `GH-${urlHash}`;
    setReferenceNumber(ref);
    refRef.current = ref;
    urlRef.current = fullUrl;

    // Store mapping on server for backoffice lookup
    fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: ref, url: fullUrl, session }),
    }).catch(() => {
      // Retry once after 2 seconds if first attempt fails
      setTimeout(() => {
        fetch("/api/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref, url: fullUrl, session }),
        }).catch(() => {});
      }, 2000);
    });
  }, [searchType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update session data on server when selections change
  useEffect(() => {
    if (!refRef.current || !urlRef.current || !session) return;

    fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: refRef.current,
        url: urlRef.current,
        session,
      }),
    }).catch(() => {});
  }, [session]);

  const handleCopy = async () => {
    if (referenceNumber) {
      try {
        await navigator.clipboard.writeText(referenceNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API not available
      }
    }
  };

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-gray-600">Web Reference: </span>
            <span className="font-bold text-[#003580]">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <div className="text-sm">
          <span className="text-gray-600">Web Reference: </span>
          <span className="font-bold text-[#003580]">{referenceNumber}</span>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-100"
        title="Copy reference number"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
