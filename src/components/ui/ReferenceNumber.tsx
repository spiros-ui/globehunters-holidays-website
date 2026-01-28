"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Info } from "lucide-react";

interface ReferenceNumberProps {
  searchType: "flights" | "hotels" | "packages";
  searchParams?: Record<string, string>;
  selectedItemId?: string;
  selectedItemData?: Record<string, unknown>;
}

// Generate a reference number client-side
function generateReferenceNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GH-${code}`;
}

export function ReferenceNumber({
  searchType,
}: ReferenceNumberProps) {
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if we already have a reference number in sessionStorage for this search
    const storageKey = `gh_ref_${searchType}`;
    const existingRef = sessionStorage.getItem(storageKey);

    if (existingRef) {
      setReferenceNumber(existingRef);
    } else {
      // Generate new reference number
      const newRef = generateReferenceNumber();
      setReferenceNumber(newRef);
      sessionStorage.setItem(storageKey, newRef);
    }
  }, [searchType]);

  const handleCopy = async () => {
    if (referenceNumber) {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!referenceNumber) {
    return null;
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
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
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
