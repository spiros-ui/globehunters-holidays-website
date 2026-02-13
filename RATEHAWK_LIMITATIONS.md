# RateHawk API — Issues & Feedback Report

**From:** GlobeHunters Holidays (globehunters.com)
**Date:** 11 February 2026
**API Version:** B2B v3 (`api.worldota.net/api/b2b/v3`)

---

Dear RateHawk Team,

We are an active RateHawk B2B partner running a live travel website. We've been integrating your API extensively and wanted to share a detailed report of the issues we've encountered during development and production use. We believe resolving these would significantly improve the developer experience and data reliability for your partners.

---

## 1. Autocomplete Returns Incorrect Results

**Endpoint:** `POST /search/multicomplete/`

When searching for a specific hotel by name, the first result returned is frequently incorrect.

**Examples we've documented:**

| Search Query | Expected Result | Actual First Result |
|-------------|----------------|-------------------|
| "Grace Santorini" | Grace Hotel, Santorini (Greece) | "Santorini Grace Villa No. 2" (unrelated villa) |
| "Athens" | Athens, Greece | Athens, Georgia (USA) |
| "Paris" | Paris, France | Paris, Texas (USA) |

The correct hotel was often the 4th or 5th result, not the 1st. For European city names, American cities with the same name frequently appear higher in the results.

Additionally, the endpoint mixes **regions and hotels** in the same response without clear ranking or type priority. When we search for a hotel name, we sometimes get city/region results instead, with no reliable way to filter them apart.

**Our request:** Could the autocomplete ranking be improved to prioritise exact name matches and deprioritise US locations when the search context is clearly European? A `type` filter parameter (e.g., `type=hotel` vs `type=region`) would also be very helpful.

---

## 2. Rate Limit on `/hotel/info/` Is Very Restrictive

**Endpoint:** `POST /hotel/info/`
**Current limit:** 30 requests per 60 seconds

This endpoint provides essential data (hotel name, images, amenities, full description) that is not available elsewhere. However, the 30 req/min limit means that displaying a single page of 30 hotel results consumes the entire rate allowance. If two users search simultaneously, the second user receives incomplete data.

Before we implemented a workaround, our hotel search took **~35 seconds** because we had to wait for rate limit windows to clear. We've since switched to using SERP inline data as the primary source, which reduced load time to ~6 seconds — but this means we can no longer show detailed amenities or full descriptions on search results pages.

**Our request:** Could the rate limit on `/hotel/info/` be increased? Even 100 req/min would make a significant difference. Alternatively, could the SERP response include more fields (full description, detailed amenities) so that `/hotel/info/` calls are not required for basic display?

---

## 3. No Retry Guidance for 429 Responses

When the rate limit is hit, the API returns a 429 status code. However, the response does not include a `Retry-After` header or any indication of when the limit resets.

**Our request:** Could 429 responses include a `Retry-After` header (in seconds) so we can implement proper backoff logic? This is standard practice for rate-limited APIs and would help us handle limits gracefully rather than failing requests.

---

## 4. Image URLs Contain `{size}` Placeholder

Hotel image URLs are returned with a `{size}` placeholder (e.g., `https://cdn.worldota.net/t/{size}/content/12345.jpg`) that must be manually replaced with a dimension string like `640x400`.

This is undocumented behaviour that we had to discover through trial and error. The valid dimension values are not listed in the API documentation, and different endpoints return images in different formats (`images[]`, `images_ext`, `main_photo_url`), each requiring different handling.

**Our request:** Could the API return fully-formed image URLs, or at minimum document the valid `{size}` values? It would also help if there was a single consistent image format across all endpoints rather than three different structures.

---

## 5. Review Scores Are Returned Inconsistently

Hotel review/rating data appears in different fields depending on the endpoint and the specific hotel:

| Location in Response | Format |
|---------------------|--------|
| `metapolicy_extra_info.rating.value` | Numeric score |
| `rating.booking.rating` | Numeric score |
| `rating.total` | Numeric score |
| `serp_filters` containing `"high_rating"` | Boolean flag (no actual score) |

We have to check all four paths to find a rating, and many hotels have no score in any of them. There is no single reliable field for review score or review count.

**Our request:** Could review scores be normalised to a single consistent field in the response? A top-level `review_score` and `review_count` field on every hotel object would be ideal.

---

## 6. Incomplete Data Returned for Many Hotels

A significant number of hotels in search results are returned with missing fields:

| Field | Issue |
|-------|-------|
| `name` | Occasionally missing entirely |
| `star_rating` | Missing for many properties (returns `null` or `0`) |
| `latitude` / `longitude` | Missing for some hotels, returned as `0` |
| `check_in_time` / `check_out_time` | Frequently empty |
| `amenity_groups` | Empty array for a large portion of hotels |

When coordinates are missing and default to `0`, the hotel plots at latitude 0, longitude 0 on a map — which is in the middle of the Atlantic Ocean. There's no way to distinguish "coordinates not available" from "coordinates are genuinely 0,0."

**Our request:** Could missing fields return `null` explicitly rather than `0` or empty values? This would allow us to differentiate between "no data" and "zero" and handle the UI accordingly. Additionally, is there a way to request only hotels with complete data, or flag which fields are populated?

---

## 7. `/hotel/info/` Has No Retry-Safe Behaviour

The `/hotel/info/` endpoint has no built-in idempotency or retry safety. If a request times out after 14 seconds but was actually received by RateHawk's servers, we cannot safely retry without risking counting against the rate limit twice.

Combined with the strict 30 req/min limit and no `Retry-After` header, this creates a situation where timeout + retry can cascade into rate limit exhaustion.

**Our request:** Could timed-out requests not count against the rate limit? Or could the rate limit response include the current limit state (e.g., `X-RateLimit-Remaining: 5`, `X-RateLimit-Reset: 1707654321`)?

---

## 8. Region Search Returns Overlapping Results

**Endpoint:** `POST /search/serp/region/`

When we search for a specific destination (e.g., "Crete"), the multicomplete endpoint returns multiple region IDs for the same country. Searching all of them returns overlapping hotel sets with duplicates.

For example, searching "Crete" returns region IDs for Crete, Heraklion, Chania, and Rethymno — all of which overlap geographically. We end up deduplicating hundreds of hotels client-side.

**Our request:** Could the SERP endpoint accept multiple region IDs in a single request and handle deduplication server-side? Or could the multicomplete response indicate which regions are subsets of others so we can avoid redundant searches?

---

## 9. No Batch Endpoint for Hotel Content

To display a page of 30 hotels with full details, we must make 30 individual `/hotel/info/` requests. There is no batch endpoint that accepts multiple hotel IDs and returns content for all of them in a single call.

This is the primary reason the 30 req/min rate limit is so painful — a single page load requires the entire allowance.

**Our request:** A batch endpoint (e.g., `POST /hotel/info/bulk/` accepting an array of hotel IDs) would dramatically reduce the number of API calls and improve response times for our users.

---

## 10. Amenity Data Lacks Standardised Categories

Hotel amenities are returned as free-text strings within `amenity_groups`. The naming is inconsistent across hotels — the same amenity might appear as "Wi-Fi", "WiFi", "Free WiFi", "Wireless Internet", or "WLAN" depending on the property.

We've had to build a normalisation layer mapping hundreds of string variations to 23 standardised categories. This is fragile and requires ongoing maintenance as new variations appear.

**Our request:** Could amenities be returned with standardised category codes alongside the display strings? For example: `{ "code": "WIFI", "name": "Free Wi-Fi in all rooms", "category": "internet" }`. This would allow partners to reliably filter and display amenities without custom normalisation logic.

---

## Summary

| # | Issue | Impact on Our Users |
|---|-------|-------------------|
| 1 | Autocomplete returns wrong hotels/regions | Users directed to wrong properties |
| 2 | 30 req/min limit on `/hotel/info/` | Slow page loads, incomplete results |
| 3 | No `Retry-After` header on 429 responses | Difficult to implement proper backoff |
| 4 | Image URLs contain `{size}` placeholder | Undocumented, fragile integration |
| 5 | Review scores in inconsistent fields | Unable to show reliable ratings |
| 6 | Missing data returned as 0/empty instead of null | Misleading hotel information |
| 7 | No retry safety on rate-limited endpoints | Cascading failures under load |
| 8 | Overlapping region results | Duplicate hotels, wasted API calls |
| 9 | No batch hotel info endpoint | 30 calls needed for one page of results |
| 10 | Amenity strings not standardised | Requires extensive client-side normalisation |

We remain committed to the RateHawk partnership and our integration is live in production. We're sharing this feedback because we want the integration to be as good as it can be for our mutual customers. We're happy to jump on a call to discuss any of these points in more detail or provide request/response samples.

Best regards,
**GlobeHunters Holidays**
globehunters.com

---
