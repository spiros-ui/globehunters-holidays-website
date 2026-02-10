/**
 * Data access utilities for packages and activities
 * Provides typed access to the hard-coded package and activity data
 */

import type {
  PackageData,
  ActivityData,
  PackageFilters,
  ActivityFilters,
  FeaturedPackagesFile,
  Top50PackagesFile,
  DestinationActivitiesFile,
  PackageTheme,
  DestinationId,
} from "./types";

// Import JSON data
import featuredPackagesData from "./featured-packages.json";
import top50PackagesData from "./top50-packages.json";
import destinationActivitiesData from "./destination-activities.json";

// Cast to typed interfaces
const featuredPackages = featuredPackagesData as FeaturedPackagesFile;
const top50Packages = top50PackagesData as Top50PackagesFile;
const destinationActivities = destinationActivitiesData as DestinationActivitiesFile;

// ============ PACKAGE FUNCTIONS ============

/**
 * Get the top 15 featured packages (for homepage showcase)
 */
export function getFeaturedPackages(): PackageData[] {
  return featuredPackages.featuredPackages;
}

/**
 * Get all top 50 packages
 */
export function getTop50Packages(): PackageData[] {
  return top50Packages.packages;
}

/**
 * Get a single package by ID
 */
export function getPackageById(id: string): PackageData | undefined {
  return top50Packages.packages.find((pkg) => pkg.id === id);
}

/**
 * Get packages by destination ID
 */
export function getPackagesByDestination(destinationId: string): PackageData[] {
  return top50Packages.packages.filter(
    (pkg) => pkg.destinationId === destinationId
  );
}

/**
 * Get packages by theme
 */
export function getPackagesByTheme(theme: PackageTheme): PackageData[] {
  return top50Packages.packages.filter((pkg) => pkg.theme === theme);
}

/**
 * Get packages by region
 */
export function getPackagesByRegion(region: string): PackageData[] {
  return top50Packages.packages.filter((pkg) => pkg.region === region);
}

/**
 * Filter packages with multiple criteria
 */
export function filterPackages(filters: PackageFilters): PackageData[] {
  let results = [...top50Packages.packages];

  if (filters.theme) {
    results = results.filter((pkg) => pkg.theme === filters.theme);
  }

  if (filters.region) {
    results = results.filter((pkg) => pkg.region === filters.region);
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((pkg) => pkg.startingPrice >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    results = results.filter((pkg) => pkg.startingPrice <= filters.maxPrice!);
  }

  if (filters.minNights !== undefined) {
    results = results.filter((pkg) => pkg.nights >= filters.minNights!);
  }

  if (filters.maxNights !== undefined) {
    results = results.filter((pkg) => pkg.nights <= filters.maxNights!);
  }

  if (filters.minRating !== undefined) {
    results = results.filter((pkg) => pkg.rating >= filters.minRating!);
  }

  if (filters.featured !== undefined) {
    results = results.filter((pkg) => pkg.featured === filters.featured);
  }

  return results;
}

/**
 * Search packages by query string (searches name, country, tagline)
 */
export function searchPackages(query: string): PackageData[] {
  const lowerQuery = query.toLowerCase();
  return top50Packages.packages.filter(
    (pkg) =>
      pkg.destinationName.toLowerCase().includes(lowerQuery) ||
      pkg.country.toLowerCase().includes(lowerQuery) ||
      pkg.tagline.toLowerCase().includes(lowerQuery) ||
      pkg.title.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get available themes with definitions
 */
export function getThemes() {
  return top50Packages.themes;
}

/**
 * Get available regions with definitions
 */
export function getRegions() {
  return top50Packages.regions;
}

// ============ ACTIVITY FUNCTIONS ============

/**
 * Get all activities for a destination
 */
export function getActivitiesByDestination(
  destinationId: DestinationId | string
): ActivityData[] {
  return destinationActivities.activities[destinationId] || [];
}

/**
 * Get a single activity by ID
 */
export function getActivityById(activityId: string): ActivityData | undefined {
  for (const destination of Object.keys(destinationActivities.activities)) {
    const activity = destinationActivities.activities[destination].find(
      (act) => act.id === activityId
    );
    if (activity) return activity;
  }
  return undefined;
}

/**
 * Get multiple activities by their IDs
 */
export function getActivitiesByIds(activityIds: string[]): ActivityData[] {
  const activities: ActivityData[] = [];
  for (const id of activityIds) {
    const activity = getActivityById(id);
    if (activity) activities.push(activity);
  }
  return activities;
}

/**
 * Get activities for a package
 */
export function getActivitiesForPackage(packageId: string): ActivityData[] {
  const pkg = getPackageById(packageId);
  if (!pkg) return [];
  return getActivitiesByIds(pkg.activities);
}

/**
 * Filter activities for a destination
 */
export function filterActivities(
  destinationId: DestinationId | string,
  filters: ActivityFilters
): ActivityData[] {
  let results = getActivitiesByDestination(destinationId);

  if (filters.category) {
    results = results.filter((act) => act.category === filters.category);
  }

  if (filters.minPrice !== undefined) {
    results = results.filter((act) => act.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    results = results.filter((act) => act.price <= filters.maxPrice!);
  }

  if (filters.minRating !== undefined) {
    results = results.filter((act) => act.rating >= filters.minRating!);
  }

  return results;
}

/**
 * Get all available activity categories
 */
export function getActivityCategories() {
  return destinationActivities.categories;
}

/**
 * Get all destinations that have activities
 */
export function getDestinationsWithActivities(): string[] {
  return Object.keys(destinationActivities.activities);
}

// ============ COMBINED FUNCTIONS ============

/**
 * Get a package with its full activity details
 */
export function getPackageWithActivities(packageId: string): {
  package: PackageData;
  activities: ActivityData[];
} | null {
  const pkg = getPackageById(packageId);
  if (!pkg) return null;

  return {
    package: pkg,
    activities: getActivitiesForPackage(packageId),
  };
}

/**
 * Get featured packages with their activity details (limited to first 3 activities)
 */
export function getFeaturedPackagesWithActivities(): Array<{
  package: PackageData;
  activities: ActivityData[];
}> {
  return getFeaturedPackages().map((pkg) => ({
    package: pkg,
    activities: getActivitiesForPackage(pkg.id).slice(0, 3),
  }));
}

// ============ STATISTICS ============

/**
 * Get statistics about the data
 */
export function getDataStats() {
  const allActivities = Object.values(destinationActivities.activities).flat();

  return {
    totalPackages: top50Packages.packages.length,
    featuredPackages: featuredPackages.featuredPackages.length,
    totalActivities: allActivities.length,
    destinationsWithActivities: Object.keys(destinationActivities.activities).length,
    themes: top50Packages.themes.length,
    regions: top50Packages.regions.length,
    categories: destinationActivities.categories.length,
    priceRange: {
      min: Math.min(...top50Packages.packages.map((p) => p.startingPrice)),
      max: Math.max(...top50Packages.packages.map((p) => p.startingPrice)),
    },
    nightsRange: {
      min: Math.min(...top50Packages.packages.map((p) => p.nights)),
      max: Math.max(...top50Packages.packages.map((p) => p.nights)),
    },
  };
}

// Export types
export type {
  PackageData,
  ActivityData,
  PackageFilters,
  ActivityFilters,
  PackageTheme,
  DestinationId,
} from "./types";
