# UX Audit Report: GlobeHunters Holidays Homepage

**Date:** 2026-02-09
**Auditor:** UX/UI Expert Review
**Scope:** Homepage (`src/app/page.tsx`) and related package components

---

## Executive Summary

The homepage suffers from **significant content redundancy and visual clutter**, particularly in the Above the Fold (ATF) area. The same package information is displayed twice (hero section AND "Top 15 Featured Packages" section below), creating user confusion and excessive page length. Trust indicators are repeated across 4 different sections, diluting their impact.

### Key Findings
- **Packages shown TWICE**: 6 packages in hero + all 15 packages in "Top 15" section = redundant content
- **Trust indicators repeated 4 times**: Hero area, "Why Travelers Choose Us", "Book With Confidence", "Experience the Difference" - all showing variations of the same trust messaging
- **Search form positioned below the fold**: Should be more prominent if it's a primary conversion goal
- **11 distinct sections on homepage**: Too many sections competing for attention

---

## Visual Hierarchy Map

```
Current Homepage Flow (TOP to BOTTOM):
=====================================

[ABOVE THE FOLD - CLUTTERED]
|
+-- Hero Section (700-800px height)
|   +-- Badge: "Premium Holiday Experiences"
|   +-- H1: "Experience Luxury Holidays for Less"
|   +-- Subtext + CTA Button
|   +-- Trust indicators (ATOL, 14+ Years) <-- REPETITION #1
|   +-- 6 Package Cards (right side) <-- PACKAGES SHOWN HERE
|
[BELOW THE FOLD]
|
+-- Search Form Section <-- Primary action buried?
|
+-- "Why Travelers Choose Us" (4 trust cards) <-- REPETITION #2
|   - Trusted Experts (14+ years)
|   - Best Price Guarantee
|   - 24/7 Support
|   - Secure Booking
|
+-- "Fly & Stay With The World's Best" (Partner logos)
|
+-- "Top 15 Featured Packages" <-- SAME PACKAGES AGAIN (15 cards)
|   - Shows Barcelona, Paris, Dubai, Istanbul, Athens, Mauritius...
|   - EXACT SAME DATA as hero section
|
+-- "Book With Confidence" (Trust badges) <-- REPETITION #3
|   - ATOL Protected
|   - ABTA Bonded
|   - SSL Secured
|   - Travel Awards
|
+-- "Our Awards & Achievements" <-- REPETITION #4
|   - Best Travel Agency
|   - Customer Choice
|   - 50k+ Travelers
|
+-- "Experience the Difference" (Stats)
|   - 14+ Years <-- REPEATED FROM HERO
|   - 50k+ Customers <-- REPEATED FROM AWARDS
|   - 24/7 Support <-- REPEATED FROM "WHY CHOOSE US"
|   - 100% Secure <-- REPEATED FROM "BOOK WITH CONFIDENCE"
|
+-- "Not Sure Where to Go?" CTA
```

---

## Issues Found

### HIGH PRIORITY

#### 1. Redundant Package Display (CRITICAL)
**Location:** Hero section + "Top 15 Featured Packages" section
**Issue:** The homepage displays packages in TWO places:
- Hero: 6 packages using `PackageCard` component
- Below: All 15 packages using the same `PackageCard` component

The exact same `featuredPackages` array is used for both. The first 6 packages in the hero are **identical** to the first 6 in the "Top 15" section.

**Impact:**
- Page feels repetitive and overwhelming
- Increased page load time (21 package cards total instead of 15)
- Confuses users about where to focus
- Scroll fatigue before reaching conversion points

**Recommendation:**
- **REMOVE** the package grid from the hero section
- Keep hero focused on messaging + single CTA
- Let "Top 15 Featured Packages" section be the primary package showcase

#### 2. Trust Indicator Overload (CRITICAL)
**Location:** 4 separate sections with overlapping content
**Issue:** Trust messaging appears in:
1. Hero (ATOL Protected, 14+ Years)
2. "Why Travelers Choose Us" (Trusted Experts 14+ years, 24/7 Support, Secure Booking)
3. "Book With Confidence" (ATOL, ABTA, SSL, Awards)
4. "Experience the Difference" (14+ Years, 50k+ Customers, 24/7 Support, 100% Secure)

**Impact:**
- Diminishes trust signal effectiveness through repetition
- Adds 3-4 sections that provide no new information
- Increases cognitive load

**Recommendation:**
- Consolidate trust messaging into ONE prominent section
- Move ATOL/ABTA badges to footer (industry standard)
- Remove "Our Awards & Achievements" or merge with "Book With Confidence"
- Remove "Experience the Difference" stats section entirely (duplicates everything)

#### 3. Search Form Below the Fold
**Location:** Second section after hero
**Issue:** If package search is the primary conversion action, it's buried below 700-800px of hero content.

**Recommendation:**
- Either integrate search into hero section (replacing package grid)
- Or add a compact "quick search" in the hero that expands

---

### MEDIUM PRIORITY

#### 4. Hero Section Overloaded
**Location:** `src/app/page.tsx` lines 249-342
**Issue:** The hero contains:
- Badge
- H1 heading
- Subtext paragraph
- Primary CTA button
- Trust indicators
- Section title "Top Featured Packages"
- 6 full package cards in a grid

**Impact:** Too many elements competing for attention. Users don't know where to look first.

**Recommendation:**
- Remove package grid from hero
- Keep hero clean: Heading + Subtext + Single CTA + Minimal trust indicators

#### 5. Inconsistent Package Card Usage
**Location:** Multiple components exist for packages
**Issue:** The codebase has 3 different package card components:
- `PackageCard` (used in homepage hero and Top 15 section)
- `FeaturedPackageCard` (exists but NOT used on homepage)
- `Top50PackageCard` (exists but NOT used on homepage)

**Impact:** Confusion about which component to use. `FeaturedPackageCard` and `Top50PackageCard` seem designed for specific purposes but aren't utilized.

**Recommendation:** Use `FeaturedPackageCard` for hero/featured display if needed, or consolidate components.

#### 6. Partner Logos Section Placement
**Location:** "Fly & Stay With The World's Best"
**Issue:** Positioned between trust features and packages, breaking the flow.

**Recommendation:** Move to footer or just above footer as secondary credibility indicator.

---

### LOW PRIORITY

#### 7. "Not Sure Where to Go?" CTA at Bottom
**Location:** Final section
**Issue:** Good section but phone number CTA might not be the primary action users want.

**Recommendation:** Consider adding email/chat options alongside phone.

#### 8. Awards Section Uses Placeholder Icons
**Location:** "Our Awards & Achievements"
**Issue:** Uses generic Lucide icons instead of actual award logos.

**Recommendation:** Replace with actual award images or remove section.

#### 9. Stats Section Data Overlap
**Location:** "Experience the Difference"
**Issue:** "14+" years, "50k+" customers, "24/7" support, "100%" secure are all mentioned elsewhere.

**Recommendation:** Remove this section entirely - it adds no new information.

---

## Recommended Homepage Structure (After Fixes)

```
[HERO - Clean & Focused]
+-- Badge + H1 + Subtext
+-- Primary CTA: "Explore Packages"
+-- Compact Search Form (optional)

[PACKAGES - Single Prominent Section]
+-- "Featured Packages" (8-12 cards max)
+-- "View All" link to /packages

[TRUST - Consolidated]
+-- "Why Book With Us" (4 key points)
+-- Partner logos (optional, compact)

[CONVERSION CTA]
+-- "Need Help Planning?" with phone/chat options

[FOOTER]
+-- ATOL/ABTA badges (industry standard location)
```

---

## Implementation Plan

### Phase 1: Remove Redundancy (HIGH PRIORITY)
1. Remove package grid from hero section
2. Keep hero as: Heading + Subtext + CTA + Trust badges
3. Consolidate trust sections

### Phase 2: Restructure Information Architecture
1. Make "Featured Packages" section the primary package showcase
2. Reduce from 15 to 8-10 packages
3. Move partner logos to footer

### Phase 3: Enhance Conversion Points
1. Evaluate search form positioning
2. Improve CTA hierarchy

---

## Files Modified

- `src/app/page.tsx` - Homepage restructuring
- Trust sections consolidated
- Package display streamlined

---

## Changes Implemented (HIGH Priority Fixes)

### 1. Hero Section Decluttered
**Before:** Hero contained badge, heading, subtext, CTA, trust indicators, PLUS 6 package cards in a grid
**After:** Hero is clean and focused with:
- Badge
- H1 heading (larger typography for impact)
- Subtext
- Two CTAs (Browse Packages + Call button)
- Compact trust indicators in a row

**Height reduced** from 700-800px to 500-600px, giving users a cleaner Above the Fold experience.

### 2. Redundant Package Display Removed
**Before:** Packages shown TWICE (6 in hero + 15 in "Top 15" section = 21 total cards)
**After:** Single "Featured Holiday Packages" section showing 10 packages

**Impact:**
- Eliminated content duplication
- Reduced page load time (10 cards vs 21)
- Clearer user journey

### 3. Trust Sections Consolidated
**Before:** 4 separate sections with repetitive trust messaging:
- Hero trust indicators
- "Why Travelers Choose Us"
- "Book With Confidence"
- "Our Awards & Achievements"
- "Experience the Difference" stats

**After:** 2 streamlined sections:
- "Why Travelers Choose Us" (4 consolidated trust cards)
- "Protection & Trust Badges" (compact inline section)

**Removed entirely:**
- "Book With Confidence" (redundant with other trust sections)
- "Our Awards & Achievements" (placeholder icons, no real value)
- "Experience the Difference" stats (100% duplicate information)

### 4. Improved Visual Hierarchy
- Hero now has clear focus: one message, one primary CTA
- Secondary CTA (phone) included for users ready to talk
- Trust indicators compact and non-intrusive
- Packages section is now the clear focal point below search

---

## New Homepage Structure (After Fixes)

```
[HERO - Clean & Focused] ~500-600px
+-- Badge + H1 + Subtext
+-- Primary CTA: "Browse Packages"
+-- Secondary CTA: "Call" button
+-- Compact trust row

[SEARCH FORM]
+-- Full booking engine

[WHY CHOOSE US] - Single trust section
+-- 4 consolidated trust features

[PARTNER LOGOS]
+-- Airlines & Hotels

[FEATURED PACKAGES] - Single package showcase
+-- 10 packages (down from 21)
+-- "View All" link

[PROTECTION BADGES] - Compact inline
+-- ATOL, ABTA, SSL + Reviews link

[NEED HELP CTA]
+-- Phone + Contact options
```

**Total sections reduced from 11 to 7**

---

## Metrics to Track Post-Implementation

1. Scroll depth (should increase to key sections)
2. Time on page (should decrease but with better engagement)
3. Click-through rate on "Featured Packages"
4. Bounce rate (should decrease with cleaner design)
5. Conversion rate on search/package views
6. Page load time (fewer package cards = faster load)
