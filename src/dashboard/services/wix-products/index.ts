/**
 * Wix Products Module
 * 
// Type exports
export type {
  PaginatedProductsResponse,
  SortOptions
} from "./types";an modular architecture for Wix store products handling with V1/V3 compatibility.
 * 
 * This module replaces the monolithic wix-store-products.ts file with focused,
 * maintainable modules each handling specific responsibilities:
 * 
 * - config: V3 fieldsets, field mapping, and constants
 * - types: Interface definitions and type contracts
 * - query-builder: Query construction and version detection
 * - v1-service: V1-specific API operations with offset pagination
 * - v3-service: V3-specific API operations with cursor pagination
 * - product-service: High-level unified API
 */

// Main API exports - these replace the old wix-store-products.ts exports
export {
  fetchWixStoreProducts,
  fetchWixStoreProductsPaginated,
  fetchWixStoreProduct
} from "./product-service";

// Configuration exports
export {
  getV3Fieldsets,
  getWixSortField,
  V3_PRODUCT_FIELDSETS,
  V3_MERCHANT_FIELDSETS
} from "./config";

// Type exports
export type {
  PaginatedProductsResponse,
  SortOptions
} from "./types";

// Re-export from catalog normalizer for backward compatibility
export { getCatalogVersion, type CatalogVersion } from "../../utils/catalogNormalizer";
