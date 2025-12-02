/**
 * Wix Products Configuration
 * 
 * Centralized configuration for V1/V3 API compatibility:
 * - V3 Fieldsets optimized for AI Product Images workflow
 * - Field mapping between V1 and V3 APIs
 * - Sorting and pagination constants
 */

import { CatalogVersion } from "../../utils/catalogNormalizer";

// Essential V3 fieldsets for AI Product Images CLI - only include what's needed
export const V3_PRODUCT_FIELDSETS = [
  "MEDIA_ITEMS_INFO",              // ✅ ESSENTIAL: All media items with metadata (URLs, alt-text, dimensions, filenames, file sizes)
  "CURRENCY",                      // ✅ ESSENTIAL: Currency code and formatted price amounts
  "THUMBNAIL",                     // ✅ ESSENTIAL: Optimized thumbnail image for listings
  "PLAIN_DESCRIPTION",             // ✅ USEFUL: Product description as plain HTML text
  // "DESCRIPTION",                // ❌ NOT NEEDED: Rich content description - too complex for basic display
  // "URL",                        // ❌ NOT NEEDED: Product's public storefront URL - not used in AI product images
  // "BREADCRUMBS_INFO",           // ❌ NOT NEEDED: Category breadcrumb navigation - not needed for media processing
  // "ALL_CATEGORIES_INFO",        // ❌ NOT NEEDED: All categories including inherited parents - unnecessary complexity
  // "DIRECT_CATEGORIES_INFO",     // ❌ NOT NEEDED: Direct category assignments - not used in packshot generation
  // "VARIANT_OPTION_CHOICE_NAMES", // ❌ NOT NEEDED: Human-readable variant names - not needed for basic product display
  // "WEIGHT_MEASUREMENT_UNIT_INFO", // ❌ NOT NEEDED: Weight units - not relevant for AI product images
  // "INFO_SECTION",               // ❌ NOT NEEDED: Basic info section metadata - extra complexity
  // "INFO_SECTION_DESCRIPTION",   // ❌ NOT NEEDED: Rich info content - not used in packshot workflow
  // "INFO_SECTION_PLAIN_DESCRIPTION", // ❌ NOT NEEDED: HTML info content - not needed
  // "SUBSCRIPTION_PRICES_INFO"    // ❌ NOT NEEDED: Subscription pricing - not relevant for packshots
  // Note: MERCHANT_DATA requires SCOPE.STORES.PRODUCT_READ_ADMIN permission scope - add if needed
];

// Optional merchant fieldsets that require admin permissions
export const V3_MERCHANT_FIELDSETS = [
  "MERCHANT_DATA"                 // Merchant financial data (cost, profit, margin) - requires admin scope
];

/**
 * Get V3 fieldsets based on requirements
 * @param includeMerchantData - Whether to include merchant data (requires admin permissions)
 * @returns Array of fieldset strings for V3 API calls
 */
export function getV3Fieldsets(includeMerchantData: boolean = false): string[] {
  const fieldsets = [...V3_PRODUCT_FIELDSETS];
  if (includeMerchantData) {
    fieldsets.push(...V3_MERCHANT_FIELDSETS);
  }
  return fieldsets;
}

// Version-aware field mapping for sorting
// Keys are logical column keys used by the UI
export const SORT_FIELD_MAPPING: Record<string, { v1: string; v3: string }> = {
  name: { v1: "name", v3: "name" },
  sku: { v1: "sku", v3: "sku" },
  price: { v1: "price", v3: "actualPriceRange.minValue.amount" },
  formattedPrice: { v1: "price", v3: "actualPriceRange.minValue.amount" },
  _id: { v1: "_id", v3: "_id" },
  lastUpdated: { v1: "lastUpdated", v3: "_updatedDate" },
  updatedAt: { v1: "lastUpdated", v3: "_updatedDate" },
  createdAt: { v1: "_createdDate", v3: "_createdDate" },
};

// Fallback fields if a mapped field is not supported by query sorting
export const FALLBACK_SORT_V1 = "lastUpdated";
export const FALLBACK_SORT_V3 = "_updatedDate";

// Pagination constants
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_BATCH_SIZE = 100;
export const MIN_SEARCH_LENGTH = 3;

/**
 * Map table column keys to Wix API field names based on catalog version
 */
export const getWixSortField = (fieldName: string, version: CatalogVersion): string => {
  const mapping = SORT_FIELD_MAPPING[fieldName];
  if (mapping) {
    return version === "V3_CATALOG" ? mapping.v3 : mapping.v1;
  }
  return version === "V3_CATALOG" ? FALLBACK_SORT_V3 : FALLBACK_SORT_V1;
};
