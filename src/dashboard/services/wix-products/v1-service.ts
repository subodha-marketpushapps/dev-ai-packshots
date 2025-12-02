/**
 * Wix Products V1 Service
 * 
 * Handles V1-specific API operations including offset-based pagination
 * 
 * @see https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products
 * @see https://dev.wix.com/docs/sdk/backend-modules/stores/products/introduction
 */

import { normalizeProduct, getCurrency } from "../../utils/catalogNormalizer";
import { applyQueryModifiers } from "./query-builder";
import { SortOptions } from "./types";

/**
 * Fetch products using V1 API with offset-based pagination
 */
export async function fetchV1Products(
    queryProductsFn: any,
    {
        offset = 0,
        limit = 10,
        productIdList,
        searchTerm,
        sortOptions,
    }: {
        offset?: number;
        limit?: number;
        productIdList?: string[];
        searchTerm?: string;
        sortOptions?: SortOptions;
    }
): Promise<{ items: any[]; totalCount: number; hasMore: boolean }> {
    const startTime = performance.now();

    let query = queryProductsFn().limit(limit);
    query = (query as any).skip(offset);

    query = applyQueryModifiers(query, {
        ids: productIdList,
        searchTerm,
        sortOptions,
        version: "V1_CATALOG",
    });

    const result = await query.find();
    const items = result.items;
    const totalCount = (result as any).totalCount || 0;
    const hasMore = offset + items.length < totalCount;

    return {
        items,
        totalCount,
        hasMore,
    };
}

/**
 * Fetch all V1 products using pagination
 */
export async function fetchAllV1Products(
    queryProductsFn: any,
    productIdList?: string[]
): Promise<any[]> {
    const startTime = performance.now();

    const limit = 100;
    let allProducts: any[] = [];
    let hasMore = true;
    let offset = 0;
    let batchCount = 0;

    while (hasMore) {
        batchCount++;

        let query = queryProductsFn().limit(limit);
        query = (query as any).skip(offset);

        if (productIdList && productIdList.length) {
            query = query.in("_id", productIdList);
        }

        const result = await query.find();
        const items = result.items;
        const totalCount = (result as any).totalCount || items.length;

        allProducts = allProducts.concat(items);
        offset += limit;
        hasMore = allProducts.length < totalCount;
    }

    return allProducts;
}

/**
 * Normalize V1 products
 */
export async function normalizeV1Products(products: any[]): Promise<any[]> {
    const { currency, symbol, site_url } = await getCurrency();

    const normalizedProducts = await Promise.all(products.map((product: any) =>
        normalizeProduct(product, "V1_CATALOG", currency, symbol, site_url)
    ));

    return normalizedProducts;
}
