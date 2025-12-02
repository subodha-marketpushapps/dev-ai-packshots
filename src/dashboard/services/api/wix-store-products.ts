/**
 * @deprecated This file has been replaced by the modular wix-products architecture
 * 
 * The monolithic wix-store-products.ts has been refactored into focused modules:
 * 
 * NEW LOCATION: src/dashboard/services/wix-products/
 * 
 * Modules:
 * - config.ts: V3 fieldsets, constants, and configuration
 * - types.ts: Interface definitions and type contracts  
 * - query-builder.ts: Query construction and version detection
 * - v1-service.ts: V1-specific API operations
 * - v3-service.ts: V3-specific API operations  
 * - product-service.ts: High-level unified API
 * - index.ts: Clean exports
 * 
 * Migration:
 * All exports remain the same, just update your import paths:
 * 
 * OLD: import { fetchWixStoreProducts } from "../../services/api/wix-store-products";
 * NEW: import { fetchWixStoreProducts } from "../../services/wix-products";
 * 
 * Benefits of new modular structure:
 * ✅ Better maintainability - focused responsibilities
 * ✅ Easier testing - smaller, isolated modules
 * ✅ Improved readability - clear separation of concerns
 * ✅ Enhanced extensibility - easier to add new features
 * ✅ Better TypeScript support - clearer type boundaries
 */

// Re-export everything from the new modular structure for backward compatibility
export * from "../wix-products";