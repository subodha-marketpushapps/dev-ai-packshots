/**
 * Wix Products Query Builder
 * 
 * Handles query construction and modification for V1 and V3 APIs
 */

import { products, productsV3 } from "@wix/stores";
import { getCatalogVersion, type CatalogVersion } from "../../utils/catalogNormalizer";
import { getWixSortField, FALLBACK_SORT_V1, FALLBACK_SORT_V3 } from "./config";
import { SortOptions } from "./types";

// Internal catalog version cache
let __catalogVersion: CatalogVersion | null = null;

async function ensureCatalogVersion(): Promise<CatalogVersion> {
    if (!__catalogVersion) {
        __catalogVersion = await getCatalogVersion();
    }
    return __catalogVersion;
}

/**
 * Get the proper query builder for the active catalog
 */
export async function getQueryBuilder() {
    const version = await ensureCatalogVersion();

    return {
        version,
        queryProductsFn:
            version === "V3_CATALOG"
                ? productsV3.queryProducts // V3
                : products.queryProducts,  // V1
        searchProductsFn:
            version === "V3_CATALOG"
                ? productsV3.searchProducts // V3 search function
                : null, // V1 doesn't have searchProducts
        countProductsFn:
            version === "V3_CATALOG"
                ? productsV3.countProducts // V3 count function
                : null, // V1 doesn't have countProducts
        getProductFn:
            version === "V3_CATALOG"
                ? productsV3.getProduct // V3 single product getter
                : products.getProduct,  // V1 single product getter
    };
}

/**
 * Apply query modifiers (filters, search, sorting) based on catalog version
 * Note: For V3, search should be handled via searchProducts(), not query filters
 */
export function applyQueryModifiers(
    q: any,
    {
        ids,
        searchTerm,
        sortOptions,
        version,
    }: {
        ids?: string[];
        searchTerm?: string;
        sortOptions?: SortOptions;
        version: CatalogVersion;
    }
) {
    // Apply ID filters
    if (ids && ids.length) {
        q = q.in("_id", ids);
    }

    // For V3, search should be handled via searchProducts() instead of query filters
    if (searchTerm && searchTerm.trim() && version !== "V3_CATALOG") {
        const term = searchTerm.trim();

        // V1 search options - try different approaches for better compatibility
        try {
            // Try contains first (more flexible than startsWith)
            q = q.contains("name", term);
        } catch (e1) {
            try {
                // Fallback to startsWith
                q = q.startsWith("name", term);
            } catch (e2) {
                try {
                    // Last fallback to exact match
                    q = q.eq("name", term);
                } catch (e3) {
                    console.error('❌ V1 Search - All search methods failed:', { e1, e2, e3 });
                    // Continue without search filter
                }
            }
        }
    }

    // Apply sorting
    if (sortOptions) {
        const field = getWixSortField(sortOptions.fieldName, version);
        try {
            q = sortOptions.order === "asc" ? q.ascending(field) : q.descending(field);
        } catch (e) {
            // If the field is not supported for sorting, fall back to default
            const defaultField = version === "V3_CATALOG" ? FALLBACK_SORT_V3 : FALLBACK_SORT_V1;
            q = q.descending(defaultField);
        }
    } else {
        // Default: newest first
        const defaultField = version === "V3_CATALOG" ? FALLBACK_SORT_V3 : FALLBACK_SORT_V1;
        q = q.descending(defaultField);
    }

    return q;
}
