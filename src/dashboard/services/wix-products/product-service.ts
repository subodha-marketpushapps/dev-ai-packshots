/**
 * Wix Products Service
 *
 * High-level API for fetching Wix store products with universal V1/V3 compatibility.
 * This is the main entry point that orchestrates the different service modules.
 */

import { getQueryBuilder } from "./query-builder";
import { getV3Fieldsets } from "./config";
import {
  fetchV3ProductsWithSearch,
  fetchV3ProductsWithQuery,
  normalizeV3Products,
} from "./v3-service";
import {
  fetchV1Products,
  fetchAllV1Products,
  normalizeV1Products,
} from "./v1-service";
import { PaginatedProductsResponse, SortOptions } from "./types";
import { NormalizedProduct } from "../../utils/catalogNormalizer";

// Cache total count to avoid repeated full fetches
let totalProductsCache: { count: number; timestamp: number } | null = null;
const TOTAL_COUNT_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Get total product count efficiently using V3 countProducts API
 * This function uses the proper countProducts API to get accurate total count
 */
async function getTotalProductCount(countProductsFn: any): Promise<number> {
  try {
    const countResponse = await countProductsFn();

    if (countResponse && typeof countResponse.count === "number") {
      return countResponse.count;
    }

    return -1; // Indicates we need to estimate
  } catch (error) {
    return -1; // Indicates we need to estimate
  }
}

/**
 * Fetch all Wix Store products with comprehensive field support
 *
 * @param productIdList - Optional array of specific product IDs to fetch
 * @param includeMerchantData - Whether to include merchant data (requires SCOPE.STORES.PRODUCT_READ_ADMIN)
 * @returns Promise<NormalizedProduct[]> - Array of normalized products
 *
 * Features:
 * - Supports both V1 and V3 catalog APIs with automatic version detection
 * - For V3: Uses optimized fieldsets for AI Product Images (media, currency, thumbnails, descriptions)
 * - For V1: Uses standard product fields with backwards compatibility
 * - Returns normalized product structure for consistent UI integration
 * - Handles pagination automatically for large product sets
 */
export async function fetchWixStoreProducts(
  productIdList?: string[],
  includeMerchantData: boolean = false
): Promise<NormalizedProduct[]> {
  try {
    const { version, queryProductsFn } = await getQueryBuilder();
    let productsFromWix: any[] = [];

    if (version === "V3_CATALOG") {
      const fieldsets = getV3Fieldsets(includeMerchantData);

      if (productIdList && productIdList.length) {
        // Fetch specific products
        const { items } = await (queryProductsFn as any)({ fields: fieldsets })
          .in("_id", productIdList)
          .find();
        productsFromWix = items;
      } else {
        // Fetch all products using cursor-based pagination
        const { items } = await fetchV3ProductsWithQuery(queryProductsFn, {
          fieldsets,
          limit: 100,
        });
        productsFromWix = items;
      }

      return await normalizeV3Products(productsFromWix);
    } else {
      // V1 implementation
      if (productIdList && productIdList.length) {
        const { items } = await queryProductsFn()
          .in("_id", productIdList)
          .find();
        productsFromWix = items;
      } else {
        productsFromWix = await fetchAllV1Products(queryProductsFn);
      }

      return await normalizeV1Products(productsFromWix);
    }
  } catch (e: any) {
    console.error("Error fetching Wix store products:", e);
    throw new Error(e.message || "Error fetching Wix store products");
  }
}

/**
 * Fetch Wix Store products with pagination and comprehensive field support
 *
 * @param offset - Starting position for pagination (default: 0)
 * @param limit - Maximum number of products to return (default: 10)
 * @param productIdList - Optional array of specific product IDs to fetch
 * @param searchTerm - Optional search term to filter products by name
 * @param sortOptions - Optional sorting configuration
 * @param includeMerchantData - Whether to include merchant data (requires admin permissions)
 * @returns Promise<PaginatedProductsResponse> - Paginated products with metadata
 *
 * Features:
 * - Supports offset-based pagination for V1 and cursor-based for V3
 * - Full-text search on product names using searchProducts for V3
 * - Flexible sorting with fallback handling
 * - Optimized V3 fieldsets for AI Product Images workflow
 * - Handles large datasets efficiently with proper V3 cursor pagination
 */
export async function fetchWixStoreProductsPaginated(
  offset: number = 0,
  limit: number = 10,
  productIdList?: string[],
  searchTerm?: string,
  sortOptions?: SortOptions,
  includeMerchantData: boolean = false
): Promise<PaginatedProductsResponse> {
  try {
    const { version, queryProductsFn, searchProductsFn, countProductsFn } =
      await getQueryBuilder();

    if (version === "V3_CATALOG") {
      const fieldsets = getV3Fieldsets(includeMerchantData);

      // Handle search vs regular query for V3
      if (searchTerm && searchTerm.trim() && searchTerm.trim().length >= 3) {
        const { items, hasMore, totalCount } = await fetchV3ProductsWithSearch(
          searchProductsFn,
          {
            searchTerm,
            sortOptions,
            fieldsets,
            limit,
            offset,
          }
        );

        const normalizedItems = await normalizeV3Products(items);
        return {
          items: normalizedItems,
          totalCount,
          hasMore,
          nextOffset: offset + limit,
        };
      } else {
        // For V3 query (no search)
        const idealBatchSize = Math.max(100, (offset + limit) * 2);
        const batchSize = Math.min(idealBatchSize, 100); // Cap at V3 API limit

        let finalItems: any[] = [];
        let finalHasMore = true;

        if (offset >= 95) {
          // High offset handling with cursor-based pagination
          let currentOffset = 0;
          let accumulatedItems: any[] = [];

          while (
            currentOffset < offset + limit &&
            accumulatedItems.length < offset + limit
          ) {
            const fetchLimit = Math.min(100, offset + limit - currentOffset);
            const { items: batchItems, hasMore: batchHasMore } =
              await fetchV3ProductsWithQuery(queryProductsFn, {
                productIdList,
                sortOptions,
                fieldsets,
                limit: fetchLimit,
              });

            accumulatedItems = [...accumulatedItems, ...batchItems];
            currentOffset += batchItems.length;
            finalHasMore = batchHasMore;

            if (!batchHasMore || batchItems.length < fetchLimit) break;
          }

          finalItems = accumulatedItems.slice(offset, offset + limit);
        } else {
          // Normal case - offset within batch capability
          const { items, hasMore } = await fetchV3ProductsWithQuery(
            queryProductsFn,
            {
              productIdList,
              sortOptions,
              fieldsets,
              limit: batchSize,
            }
          );
          finalItems = items.slice(offset, offset + limit);
          finalHasMore = hasMore;
        }

        const normalizedItems = await normalizeV3Products(finalItems);

        // Get total count efficiently
        const now = Date.now();
        let totalCount = finalItems.length;
        let calculatedHasMore = finalHasMore;

        if (
          totalProductsCache &&
          now - totalProductsCache.timestamp < TOTAL_COUNT_CACHE_DURATION
        ) {
          totalCount = totalProductsCache.count;
          calculatedHasMore = offset + limit < totalCount;
        } else if (countProductsFn) {
          const count = await getTotalProductCount(countProductsFn);
          if (count > 0) {
            totalProductsCache = { count, timestamp: now };
            totalCount = count;
            calculatedHasMore = offset + limit < totalCount;
          }
        }

        return {
          items: normalizedItems,
          totalCount,
          hasMore: calculatedHasMore,
          nextOffset: offset + limit,
        };
      }
    } else {
      // V1 implementation
      const { items, totalCount, hasMore } = await fetchV1Products(
        queryProductsFn,
        {
          offset,
          limit,
          productIdList,
          searchTerm,
          sortOptions,
        }
      );

      const normalizedItems = await normalizeV1Products(items);

      return {
        items: normalizedItems,
        totalCount,
        hasMore,
        nextOffset: offset + limit,
      };
    }
  } catch (e: any) {
    console.error("❌ Product Service Error:", e?.message || String(e));
    throw new Error(e?.message || "Error fetching Wix store products");
  }
}

/**
 * Fetch a single product by ID with comprehensive field support
 * Uses the efficient getProduct APIs instead of query-based approach for better performance
 * @param productId - The product ID to fetch
 * @param includeMerchantData - Whether to include merchant data (requires admin permissions)
 * @returns Single normalized product or null if not found
 */
export async function fetchWixStoreProduct(
  productId: string,
  includeMerchantData: boolean = false
): Promise<NormalizedProduct | null> {
  try {
    const { version, getProductFn } = await getQueryBuilder();

    if (version === "V3_CATALOG") {
      // Use V3 getProduct API with optimized fieldsets
      const fieldsets = getV3Fieldsets(includeMerchantData);

      try {
        const product = await (getProductFn as any)(productId, {
          fields: fieldsets,
        });
        if (product) {
          const normalized = await normalizeV3Products([product]);
          return normalized.length > 0 ? normalized[0] : null;
        }
        return null;
      } catch (error: any) {
        // Handle common V3 errors
        if (
          error?.details?.applicationError?.code === "PRODUCT_NOT_FOUND" ||
          error?.message?.includes("not found") ||
          error?.status === 404
        ) {
          return null;
        }
        throw error;
      }
    } else {
      // Use V1 getProduct API
      try {
        const response = await (getProductFn as any)(productId, {
          includeMerchantSpecificData: includeMerchantData,
        });

        if (response?.product) {
          const normalized = await normalizeV1Products([response.product]);
          return normalized.length > 0 ? normalized[0] : null;
        }
        return null;
      } catch (error: any) {
        // Handle common V1 errors
        if (
          error?.details?.applicationError?.code === "PRODUCT_NOT_FOUND" ||
          error?.message?.includes("not found") ||
          error?.status === 404
        ) {
          return null;
        }
        throw error;
      }
    }
  } catch (e: any) {
    console.error("Error fetching Wix store product:", e);
    throw new Error(e.message || "Error fetching Wix store product");
  }
}
