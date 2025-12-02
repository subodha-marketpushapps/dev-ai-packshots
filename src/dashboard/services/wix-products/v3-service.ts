/**
 * Wix Products V3 Service
 *
 * Handles V3-specific API operations including cursor-based pagination and searchProducts
 *
 * @see https://dev.wix.com/docs/sdk/backend-modules/stores/catalog-v3/products-v3/products-query-builder
 * @see https://dev.wix.com/docs/sdk/backend-modules/stores/catalog-v3/products-v3/query-products
 * @see https://dev.wix.com/docs/sdk/backend-modules/stores/catalog-v3/products-v3/search-products
 * @see https://dev.wix.com/docs/sdk/backend-modules/stores/catalog-v3/products-v3/count-products
 */

import { normalizeProduct, getCurrency } from "../../utils/catalogNormalizer";
import {
  getWixSortField,
  FALLBACK_SORT_V3,
  DEFAULT_BATCH_SIZE,
  MIN_SEARCH_LENGTH,
} from "./config";
import {
  ProductSearchOptions,
  ProductQueryOptions,
  SortOptions,
} from "./types";

// Cache for search results to avoid repeated API calls
const searchCache = new Map<
  string,
  { products: any[]; totalCount: number; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to generate cache key
function getCacheKey(searchTerm: string, sortOptions?: SortOptions): string {
  const sortKey = sortOptions
    ? `${sortOptions.fieldName}_${sortOptions.order}`
    : "default";
  return `${searchTerm.trim().toLowerCase()}_${sortKey}`;
}

/**
 * Fetch products using V3 searchProducts API with offset-based pagination
 */
export async function fetchV3ProductsWithSearch(
  searchProductsFn: any,
  searchOptions: ProductSearchOptions
): Promise<{ items: any[]; hasMore: boolean; totalCount: number }> {
  const {
    searchTerm,
    sortOptions,
    fieldsets,
    limit = DEFAULT_BATCH_SIZE,
    offset = 0,
  } = searchOptions;

  if (searchTerm.trim().length < MIN_SEARCH_LENGTH) {
    throw new Error(
      `Search term must be at least ${MIN_SEARCH_LENGTH} characters`
    );
  }

  // Check cache first
  const cacheKey = getCacheKey(searchTerm, sortOptions);
  const cached = searchCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedProducts = cached.products.slice(startIndex, endIndex);
    const hasMore = endIndex < cached.totalCount;

    return {
      items: paginatedProducts,
      hasMore,
      totalCount: cached.totalCount,
    };
  }

  // If not cached or cache expired, make API call
  // Prepare search parameter according to official V3 schema
  const search: any = {
    search: {
      expression: searchTerm.trim(),
    },
    // Use cursor-based pagination (max 100 per official docs)
    cursorPaging: { limit: 100 },
  };

  // Add sorting to search if specified
  if (sortOptions) {
    const field = getWixSortField(sortOptions.fieldName, "V3_CATALOG");
    search.sort = [
      {
        fieldName: field,
        order: sortOptions.order === "asc" ? "ASC" : "DESC",
      },
    ];
  }

  // Prepare options parameter with fields
  const options = {
    fields: fieldsets,
  };

  try {
    // Use proper parameter structure: searchProducts(search, options)
    const searchResponse = await searchProductsFn(search, options);

    let allProducts = searchResponse.products || [];
    let totalCount = allProducts.length;

    // If we have cursor pagination and more results available, fetch them
    // Note: For search results we fetch multiple pages to build complete cache
    if (
      searchResponse.pagingMetadata?.hasNext &&
      searchResponse.pagingMetadata?.cursors?.next
    ) {
      let nextCursor = searchResponse.pagingMetadata.cursors.next;
      let pageCount = 1;
      const maxPages = 10; // Limit to prevent excessive API calls

      while (nextCursor && pageCount < maxPages) {
        const nextSearch = {
          ...search,
          cursorPaging: {
            limit: 100,
            cursor: nextCursor,
          },
        };

        try {
          const nextResponse = await searchProductsFn(nextSearch, options);
          const nextProducts = nextResponse.products || [];
          allProducts = [...allProducts, ...nextProducts];

          // Update pagination info
          nextCursor = nextResponse.pagingMetadata?.cursors?.next;
          pageCount++;

          // Break if no more products
          if (nextProducts.length === 0) {
            break;
          }
        } catch (paginationError) {
          console.warn("❌ V3 Search - Pagination error:", paginationError);
          break;
        }
      }

      totalCount = allProducts.length;
    }

    // Store in cache
    searchCache.set(cacheKey, {
      products: allProducts,
      totalCount,
      timestamp: now,
    });

    // Apply pagination to the full result set
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);
    const hasMore = endIndex < totalCount;

    return {
      items: paginatedProducts,
      hasMore,
      totalCount,
    };
  } catch (error) {
    console.error(
      "❌ V3 Search - Error:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Fetch products using V3 queryProducts API with cursor-based pagination
 */
export async function fetchV3ProductsWithQuery(
  queryProductsFn: any,
  queryOptions: ProductQueryOptions
): Promise<{ items: any[]; hasMore: boolean }> {
  const {
    productIdList,
    sortOptions,
    fieldsets,
    limit = DEFAULT_BATCH_SIZE,
  } = queryOptions;

  let query = queryProductsFn({ fields: fieldsets }).limit(limit);

  // Apply ID filters
  if (productIdList && productIdList.length) {
    query = query.in("_id", productIdList);
  }

  // Apply sorting
  if (sortOptions) {
    const field = getWixSortField(sortOptions.fieldName, "V3_CATALOG");
    try {
      query =
        sortOptions.order === "asc"
          ? query.ascending(field)
          : query.descending(field);
    } catch (e) {
      const defaultField = FALLBACK_SORT_V3;
      query = query.descending(defaultField);
    }
  } else {
    const defaultField = FALLBACK_SORT_V3;
    query = query.descending(defaultField);
  }

  let queryResponse = await query.find();
  let allItems = [...queryResponse.items];

  // Continue fetching until we have enough data or no more available
  while (
    queryResponse.hasNext &&
    queryResponse.hasNext() &&
    allItems.length < limit
  ) {
    queryResponse = await queryResponse.next();
    allItems = [...allItems, ...queryResponse.items];
  }

  return {
    items: allItems,
    hasMore: queryResponse.hasNext ? queryResponse.hasNext() : false,
  };
}

/**
 * Normalize V3 products with proper media conversion
 */
export async function normalizeV3Products(products: any[]): Promise<any[]> {
  const { currency, symbol, site_url } = await getCurrency();

  return await Promise.all(
    products.map((product: any) =>
      normalizeProduct(product, "V3_CATALOG", currency, symbol, site_url)
    )
  );
}
