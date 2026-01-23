import {
  pgTable,
  text,
  timestamp,
  jsonb,
  decimal,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

// ============ CONTENT MANAGEMENT ============

export const contentBlocks = pgTable("content_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "text", "html", "json"
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

export const destinations = pgTable("destinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  airportCode: text("airport_code").notNull(),
  country: text("country").notNull(),
  heroImage: text("hero_image"),
  description: text("description"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  startingPrice: decimal("starting_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("GBP"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const destinationGallery = pgTable("destination_gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  destinationId: uuid("destination_id").references(() => destinations.id),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").default(0),
});

// ============ PHONE CONFIGURATION ============

export const phoneNumbers = pgTable("phone_numbers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  number: text("number").notNull(),
  displayNumber: text("display_number"),
  country: text("country"),
  destinationSlug: text("destination_slug"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  trackingId: text("tracking_id"),
});

// ============ PRICING RULES ============

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "percentage", "fixed", "tiered"
  vertical: text("vertical"), // "flights", "hotels", "activities", null=all
  destinationSlug: text("destination_slug"),
  providerCode: text("provider_code"),

  // Rule values
  percentageMarkup: decimal("percentage_markup", { precision: 5, scale: 2 }),
  fixedMarkup: decimal("fixed_markup", { precision: 10, scale: 2 }),
  tieredRules: jsonb("tiered_rules"),

  // Constraints
  minMargin: decimal("min_margin", { precision: 10, scale: 2 }),
  roundTo: decimal("round_to", { precision: 5, scale: 2 }),

  // Validity
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

// ============ SCRIPTS MANAGEMENT ============

export const scripts = pgTable("scripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  placement: text("placement").notNull(), // "head", "body_start", "body_end"
  environment: text("environment").notNull(), // "all", "production", "staging", "development"
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

export const scriptVersions = pgTable("script_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  scriptId: uuid("script_id").references(() => scripts.id),
  version: integer("version").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
});

// ============ ADMIN USERS ============

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull(), // "admin", "editor", "analyst"
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ AUDIT LOG ============

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(), // "create", "update", "delete"
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  changes: jsonb("changes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ CACHE METADATA ============

export const cacheMetadata = pgTable("cache_metadata", {
  key: text("key").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
