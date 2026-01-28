"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Info } from "lucide-react";

interface ReferenceNumberProps {
  searchType: "flights" | "hotels" | "packages";
  searchParams?: Record<string, string>;
  selectedItemId?: string;
  selectedItemData?: Record<string, unknown>;
}

export function ReferenceNumber({
  searchType,
  searchParams,
  selectedItemId,
  selectedItemData,
}: ReferenceNumberProps) {
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we already have a reference number in sessionStorage
    const storageKey = `gh_ref_${searchType}_${window.location.pathname}`;
    const existingRef = sessionStorage.getItem(storageKey);

    if (existingRef) {
      setReferenceNumber(existingRef);
      setLoading(false);
      // Update the session with current URL
      updateSession(existingRef);
    } else {
      // Create new session
      createSession();
    }

    async function createSession() {
      try {
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchType,
            searchParams,
            selectedItemId,
            selectedItemData,
            url: window.location.href,
          }),
        });
        const data = await response.json();
        if (data.referenceNumber) {
          setReferenceNumber(data.referenceNumber);
          sessionStorage.setItem(storageKey, data.referenceNumber);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      } finally {
        setLoading(false);
      }
    }

    async function updateSession(ref: string) {
      try {
        await fetch("/api/sessions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceNumber: ref,
            selectedItemId,
            selectedItemData,
            url: window.location.href,
          }),
        });
      } catch (error) {
        console.error("Failed to update session:", error);
      }
    }
  }, [searchType, searchParams, selectedItemId, selectedItemData]);

  const handleCopy = async () => {
    if (referenceNumber) {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !referenceNumber) {
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
