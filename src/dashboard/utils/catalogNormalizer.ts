import { catalogVersioning, products, productsV3 } from "@wix/stores";
import type { Media, MediaItem } from "@wix/auto_sdk_stores_products";
import type { Media as V3Media, ProductMedia } from "@wix/auto_sdk_stores_products-v-3";
import { appInstances } from "@wix/app-management";
import { currencies } from "@wix/ecom";
import { media } from "@wix/sdk";

/**
 * Catalog Normalizer Module
 * 
 * This module provides functionality to normalize product data from both V1 and V3 Wix Stores catalogs
 * into a consistent format.
 * 
 * Requirements:
 * - Requires "Manage Store" permission to access product data
 * - Product page URLs (productPageUrl) are only available when the Wix Blocks app is published
 * 
 * Features:
 * - Handles both V1 and V3 product formats
 * - Normalizes prices, media, variants, and other product data
 * - Validates and constructs product page URLs
 * - Supports pagination for fetching all products
 * 
 * Configuration:
 * - Currency and locale information is automatically fetched from store settings
 * - Supports custom currency symbols and formatting
 * - Handles missing or invalid data gracefully
 * 
 * @module catalogNormalizer
 */

/**
 * Safely converts a date value to ISO string format.
 * Handles cases where the date might already be a string or a Date object.
 * @param dateValue - The date value to convert (Date object or string)
 * @returns ISO string or undefined if date is invalid
 */
function safeToISOString(dateValue: any): string | undefined {
    if (!dateValue) return undefined;

    if (typeof dateValue === 'string') {
        // If it's already a string, validate it's a proper ISO date
        try {
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? undefined : dateValue;
        } catch {
            return undefined;
        }
    }

    if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? undefined : dateValue.toISOString();
    }

    // If it's neither string nor Date, try to create a Date from it
    try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? undefined : date.toISOString();
    } catch {
        return undefined;
    }
}

// --- Types ---
export type CatalogVersion = "V1_CATALOG" | "V3_CATALOG";

/**
 * THIS MODULE NEED THE MANAGE STORE PERMISSION
 * productPageUrl will return only when wix block app published
 */

/**
 * NormalizedMediaItem represents a standardized media item structure.
 */
export interface NormalizedMediaItem {
    /** Unique identifier for the media item */
    id?: string;
    /** Image URL if the media is an image */
    imageUrl?: string;
    /** Video URL if the media is a video */
    videoUrl?: string;
    /** Thumbnail URL for quick preview (optimized smaller version) */
    thumbnailUrl?: string;
    /** Media type (image, video, etc.) */
    type: 'image' | 'video' | 'unknown';
    /** Alt text for accessibility */
    altText?: string;
}

/**
 * NormalizedMedia represents a standardized media structure that works across both V1 and V3 catalogs.
 * This interface provides a consistent way to handle product media regardless of the catalog version.
 * Includes optimized thumbnail URLs for better performance in UI components.
 */
export interface NormalizedMedia {
    /** Primary/main media item for the product */
    mainMedia?: NormalizedMediaItem;
    /** Additional media items */
    items: NormalizedMediaItem[];
    /** Quick access to all media URLs as string array (includes thumbnails, for backward compatibility) */
    urls: string[];
}

/**
 * NormalizedVariant represents a standardized variant structure that works across both V1 and V3 catalogs.
 * This interface is used to ensure consistent variant data regardless of the catalog version.
 */
export interface NormalizedVariant {
    /** Unique identifier for the variant */
    id: string;
    /** Stock Keeping Unit - unique variant identifier */
    sku?: string;
    /** Current selling price */
    price: number;
    /** Discounted price if applicable */
    salePrice?: number;
    /** Original price before discount */
    compareAtPrice?: number;
    /** Whether the variant is currently in stock */
    inStock?: boolean;
    /** Variant weight in default unit */
    weight?: number;
    /** Whether the variant is visible in the store */
    visible?: boolean;
    /** Digital file information for digital products */
    digitalFile?: {
        id: string;
        fileName: string;
        fileType: string;
    };
    /** Selected options for this variant */
    options?: Array<{
        name: string;
        value: string;
        choiceId: string;
        colorCode?: string;
    }>;
}

/**
 * NormalizedProduct represents a standardized product structure that works across both V1 and V3 catalogs.
 * This interface is used to ensure consistent product data regardless of the catalog version.
 */
export interface NormalizedProduct {
    /** Unique identifier for the product */
    id: string;
    /** Product name */
    name: string;
    /** URL-friendly version of the product name */
    slug?: string;
    /** Whether the product is visible in the store */
    visible?: boolean;
    /** HTML formatted product description */
    description?: string;
    /** Plain text version of the product description */
    plainDescription?: string;
    /** Stock Keeping Unit - unique product identifier */
    sku?: string;
    /** Current selling price */
    price: number;
    /** Formatted price string with currency symbol : Optionaly Added */
    formattedPrice?: string;
    /** Base price before any discounts */
    basePrice?: number;
    /** Original price before discount */
    compareAtPrice?: number;
    /** Currency code (e.g., "USD", "EUR", "LKR") */
    currency?: string;
    /** Currency symbol (e.g., "$", "€", "₨") */
    symbol?: string;
    /** Product media with primary media and additional items */
    media: NormalizedMedia;
    /** URL of the product thumbnail */
    thumbnailUrl?: string;
    /** Whether the product is currently in stock */
    inStock?: boolean;
    /** Whether inventory tracking is enabled */
    trackInventory?: boolean;
    /** Current inventory status (e.g., "IN_STOCK", "OUT_OF_STOCK") */
    inventoryStatus?: string;
    /** Product weight in default unit */
    weight?: number;
    /** Range of weights for products with variants */
    weightRange?: { min: number; max: number };
    /** Product variants */
    variants: NormalizedVariant[];
    /** Additional information sections */
    infoSections?: Array<{ title: string; description: string }>;
    /** Product options (e.g., size, color) */
    options?: Array<{
        name: string;
        optionType: "drop_down" | "radio" | "swatch" | "text";
        choices: Array<{
            value: string;
            description?: string;
            inStock?: boolean;
            visible?: boolean;
            linkedMedia?: string[];
        }>;
    }>;
    /** Custom text fields for product customization */
    customTextFields?: Array<{
        title: string;
        maxLength: number;
        mandatory: boolean;
    }>;
    /** Product page URL information */
    productPageUrl?: { base: string; path: string };
    /** IDs of collections this product belongs to */
    collectionIds?: string[];
    /** ID of the main category */
    mainCategoryId?: string;
    /** Product ribbon text */
    ribbon?: string;
    /** Product brand */
    brand?: string;
    /** Product creation date */
    createdAt?: string;
    /** Last update date */
    updatedAt?: string;
}

/**
 * V1Product represents the legacy product structure in Wix Stores.
 * This uses the actual products.Product type from the Wix SDK.
 */
export type V1Product = products.Product;

/**
 * V3Product represents the new product structure in Wix Stores.
 * This uses the actual productsV3.V3Product type from the Wix SDK.
 */
export type V3Product = productsV3.V3Product;

// --- Utilities ---
/**
 * Parses a price string into a number.
 * @param amount - The price amount as a string
 * @returns The parsed price as a number, or 0 if invalid
 * @example
 * parsePrice("10.99") // returns 10.99
 * parsePrice("invalid") // returns 0
 */
function parsePrice(amount?: string): number {
    return amount ? parseFloat(amount) || 0 : 0;
}

/**
 * Converts a Wix media identifier to an absolute URL using the Wix Media SDK.
 * 
 * @param wixMediaIdentifier - Wix media identifier (e.g., "wix:image://v1/...")
 * @returns Promise<string | undefined> - Absolute URL or undefined if conversion fails
 * 
 * @example
 * const url = await convertWixMediaToUrl("wix:image://v1/22e53e_63dba6a8f31a4de7bfb453ed3d0a83dd~mv2.jpg/Vase-Context%20(1).jpg#originWidth=3000&originHeight=3000");
 * console.log(url); // "https://static.wixstatic.com/media/22e53e_63dba6a8f31a4de7bfb453ed3d0a83dd~mv2.jpg/v1/..."
 */
async function convertWixMediaToUrl(wixMediaIdentifier: string | undefined): Promise<string | undefined> {
    if (!wixMediaIdentifier) {
        return undefined;
    }

    // If it's already an absolute URL, return it as-is
    if (wixMediaIdentifier.startsWith('http://') || wixMediaIdentifier.startsWith('https://')) {
        return wixMediaIdentifier;
    }

    // Only convert if it's a Wix media identifier
    if (!wixMediaIdentifier.startsWith('wix:image://') &&
        !wixMediaIdentifier.startsWith('wix:video://') &&
        !wixMediaIdentifier.startsWith('wix:document://') &&
        !wixMediaIdentifier.startsWith('wix:audio://')) {
        return wixMediaIdentifier; // Return as-is if not a Wix media identifier
    }

    try {
        if (wixMediaIdentifier.startsWith('wix:image://')) {
            const result = media.getImageUrl(wixMediaIdentifier);
            return result.url;
        } else if (wixMediaIdentifier.startsWith('wix:video://')) {
            const result = media.getVideoUrl(wixMediaIdentifier);
            return result.url;
        } else if (wixMediaIdentifier.startsWith('wix:document://')) {
            const result = media.getDocumentUrl(wixMediaIdentifier);
            return result.url;
        } else if (wixMediaIdentifier.startsWith('wix:audio://')) {
            const result = media.getAudioUrl(wixMediaIdentifier);
            return result.url;
        }

        return undefined;
    } catch (error) {
        console.warn(`Failed to convert Wix media identifier: ${wixMediaIdentifier}`, error);
        return undefined;
    }
}

/**
 * Maps V3 MediaType to V1 MediaItemType
 * @param v3MediaType - The V3 media type
 * @returns The corresponding V1 media type
 */
function mapV3MediaTypeToV1(v3MediaType?: any): any {
    switch (v3MediaType) {
        case 'IMAGE':
            return 'image';
        case 'VIDEO':
            return 'video';
        case 'UNKNOWN_MEDIA_TYPE':
        default:
            return 'unspecified_media_item_type';
    }
}

/**
 * Extracts media from a product object and returns a proper NormalizedMedia structure.
 * Handles both V1 and V3 product structures and converts Wix media identifiers to absolute URLs.
 * @param product - The product object to extract media from
 * @param isV3 - Whether the product is from V3 catalog
 * @returns Promise<NormalizedMedia> object with mainMedia, items array, and urls
 * @example
 * // V1 product
 * await getProductMedia({ media: { mainMedia: { image: { url: "image.jpg" } } } }, false)
 * // returns { mainMedia: { imageUrl: "image.jpg", type: "image" }, items: [...], urls: [...] }
 * 
 * // V3 product  
 * await getProductMedia({ media: { main: { image: "wix:image://v1/..." } } }, true)
 * // returns { mainMedia: { imageUrl: "https://static.wixstatic.com/...", type: "image" }, items: [...], urls: [...] }
 */
async function getProductMedia(product: any, isV3: boolean): Promise<NormalizedMedia> {
    const normalizedItems: NormalizedMediaItem[] = [];
    let mainMedia: NormalizedMediaItem | undefined;

    if (isV3) {
        // V3 structure: { main: { id, image: "wix:image://v1/...", mediaType, uploadId } }
        const v3Media = product.media;

        // Convert V3 main media to NormalizedMediaItem
        if (v3Media?.main) {
            // Convert Wix media identifiers to absolute URLs
            const imageUrl = await convertWixMediaToUrl(v3Media.main.image);
            const videoUrl = await convertWixMediaToUrl(v3Media.main.video?.files?.[0]?.url || v3Media.main.video);
            const thumbnailUrl = await convertWixMediaToUrl(v3Media.main.thumbnail?.url) || imageUrl;

            mainMedia = {
                id: v3Media.main.id || v3Media.main._id || `main-${imageUrl || videoUrl || 'media'}`,
                imageUrl,
                videoUrl,
                thumbnailUrl,
                type: v3Media.main.mediaType === 'IMAGE' ? 'image' :
                    v3Media.main.mediaType === 'VIDEO' ? 'video' : 'unknown',
                altText: v3Media.main.image?.filename || v3Media.main.altText || undefined
            };
        }

        // Convert V3 itemsInfo to NormalizedMediaItem array
        if (v3Media?.itemsInfo?.items) {
            const convertedItems = await Promise.all(
                v3Media.itemsInfo.items.map(async (item: ProductMedia, index: number) => {
                    const imageUrl = await convertWixMediaToUrl(item.image);
                    const videoUrl = await convertWixMediaToUrl(item.video);
                    const thumbnailUrl = await convertWixMediaToUrl(
                        typeof item.thumbnail === 'string' ? item.thumbnail : item.thumbnail?.url
                    ) || imageUrl;

                    return {
                        id: item._id || `item-${index}-${imageUrl || videoUrl || 'media'}`,
                        imageUrl,
                        videoUrl,
                        thumbnailUrl,
                        type: imageUrl ? 'image' as const : videoUrl ? 'video' as const : 'unknown' as const,
                        altText: item.altText || undefined
                    };
                })
            );
            normalizedItems.push(...convertedItems);
        }
    } else {
        // V1 structure - convert SDK Media to NormalizedMedia
        const v1Media = product.media as Media;

        // Convert V1 main media to NormalizedMediaItem
        if (v1Media?.mainMedia) {
            mainMedia = {
                id: `main-${v1Media.mainMedia.image?.url || v1Media.mainMedia.video?.files?.[0]?.url || 'media'}`,
                imageUrl: v1Media.mainMedia.image?.url,
                videoUrl: v1Media.mainMedia.video?.files?.[0]?.url,
                thumbnailUrl: v1Media.mainMedia.thumbnail?.url || v1Media.mainMedia.image?.url,
                type: v1Media.mainMedia.image?.url ? 'image' : v1Media.mainMedia.video ? 'video' : 'unknown'
            };
        }

        // Convert V1 items to NormalizedMediaItem array
        if (v1Media?.items) {
            normalizedItems.push(...v1Media.items.map((item: MediaItem, index: number) => ({
                id: `item-${index}-${item.image?.url || item.video?.files?.[0]?.url || 'media'}`,
                imageUrl: item.image?.url,
                videoUrl: item.video?.files?.[0]?.url,
                thumbnailUrl: item.thumbnail?.url || item.image?.url,
                type: item.image?.url ? 'image' as const : item.video ? 'video' as const : 'unknown' as const
            })));
        }
    }

    // Generate URLs array for backward compatibility
    const urls: string[] = [];
    if (mainMedia?.imageUrl) urls.push(mainMedia.imageUrl);
    if (mainMedia?.videoUrl) urls.push(mainMedia.videoUrl);
    if (mainMedia?.thumbnailUrl && !urls.includes(mainMedia.thumbnailUrl)) urls.push(mainMedia.thumbnailUrl);

    normalizedItems.forEach(item => {
        if (item.imageUrl && !urls.includes(item.imageUrl)) urls.push(item.imageUrl);
        if (item.videoUrl && !urls.includes(item.videoUrl)) urls.push(item.videoUrl);
        if (item.thumbnailUrl && !urls.includes(item.thumbnailUrl)) urls.push(item.thumbnailUrl);
    });

    return {
        mainMedia,
        items: normalizedItems,
        urls
    };
}

/**
 * Extracts the main thumbnail URL from a NormalizedMedia object.
 * Prioritizes dedicated thumbnail URLs over full-size images for better performance.
 * @param media - The NormalizedMedia object
 * @returns The main thumbnail URL or undefined
 */
function getThumbnailUrl(media: NormalizedMedia): string | undefined {
    // First try dedicated thumbnail URL
    if (media.mainMedia?.thumbnailUrl) {
        return media.mainMedia.thumbnailUrl;
    }
    // Fallback to main image URL
    if (media.mainMedia?.imageUrl) {
        return media.mainMedia.imageUrl;
    }
    // Try first item's thumbnail
    if (media.items?.[0]?.thumbnailUrl) {
        return media.items[0].thumbnailUrl;
    }
    // Fallback to first item's image URL
    if (media.items?.[0]?.imageUrl) {
        return media.items[0].imageUrl;
    }
    return undefined;
}

/**
 * Extracts all media URLs from a NormalizedMedia object as a string array.
 * This is useful for components that still expect string arrays.
 * @param media - The NormalizedMedia object
 * @returns Array of media URLs
 */
export function getMediaUrls(media: NormalizedMedia): string[] {
    return media.urls;
}

/**
 * Extracts all thumbnail URLs from a NormalizedMedia object.
 * Prioritizes dedicated thumbnail URLs over full-size images for better performance.
 * @param media - The NormalizedMedia object
 * @returns Array of thumbnail URLs
 */
export function getThumbnailUrls(media: NormalizedMedia): string[] {
    const thumbnails: string[] = [];

    // Add main media thumbnail if available
    if (media.mainMedia?.thumbnailUrl) {
        thumbnails.push(media.mainMedia.thumbnailUrl);
    } else if (media.mainMedia?.imageUrl) {
        thumbnails.push(media.mainMedia.imageUrl);
    }

    // Add all item thumbnails if available
    media.items?.forEach((item) => {
        const thumbUrl = item.thumbnailUrl || item.imageUrl;
        if (thumbUrl && !thumbnails.includes(thumbUrl)) {
            thumbnails.push(thumbUrl);
        }
    });

    return thumbnails;
}

/**
 * Validates and constructs a product page URL
 * @param base - The base URL of the site
 * @param path - The product path
 * @returns Validated product page URL object or undefined if invalid
 */
function validateProductPageUrl(base?: string, path?: string): { base: string; path: string } | undefined {
    if (!base || !path || path.includes('undefined')) return undefined;

    try {
        // Remove trailing slash from base if present
        const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
        // Ensure path starts with a slash
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        // Validate the full URL
        new URL(`${cleanBase}${cleanPath}`);

        return {
            base: cleanBase,
            path: cleanPath
        };
    } catch (error) {
        console.error('Invalid product page URL:', { base, path, error });
        return undefined;
    }
}

/**
 * Normalizes a V1 product into the standard NormalizedProduct format.
 * @param product - The V1 product object to normalize
 * @param currency - The currency code
 * @param symbol - The currency symbol
 * @returns Normalized product object
 * @example
 * normalizeV1Product({
 *   _id: "123",
 *   name: "Product",
 *   priceData: { price: 10.99 }
 * }, "USD", "$")
 * // returns normalized product object
 */
async function normalizeV1Product(product: V1Product, currency: string, symbol: string): Promise<NormalizedProduct> {
    // console.log("Normalizing V1 product:", product, "Currency:", currency, "Symbol:", symbol);
    const variants = product.variants?.length
        ? product.variants.map((v: any) => normalizeV1Variant(v, product))
        : [{
            id: product._id || '',
            sku: product.sku || undefined,
            price: product.priceData?.price ?? 0,
            salePrice: product.priceData?.discountedPrice,
            compareAtPrice: product.discount?.value,
            inStock: product.stock?.inStock || undefined,
            visible: product.visible || undefined,
            weight: product.weight || undefined,
        }];

    const primary = variants[0];
    const media = await getProductMedia(product, false);

    // Handle ribbon - V1 typically uses ribbon string field
    const ribbonText = (product.ribbon && product.ribbon.trim()) ? product.ribbon : undefined;

    return {
        id: product._id || '',
        name: product.name || '',
        slug: product.slug || undefined,
        visible: product.visible || undefined,
        description: product.description || undefined,
        plainDescription: product.description || undefined, // V1 doesn't have plainDescription
        sku: primary?.sku || undefined,
        price: primary?.salePrice ?? primary?.price ?? 0,
        basePrice: primary?.price,
        compareAtPrice: primary?.compareAtPrice,
        formattedPrice: `${symbol}${(primary?.salePrice ?? primary?.price ?? 0).toFixed(2)}`,
        symbol,
        currency,
        media,
        thumbnailUrl: getThumbnailUrl(media),
        inStock: primary?.inStock,
        inventoryStatus: product.stock?.inventoryStatus,
        trackInventory: product.stock?.trackInventory,
        weight: product.weight || undefined,
        weightRange: product.weightRange ? {
            min: product.weightRange.minValue || 0,
            max: product.weightRange.maxValue || 0
        } : undefined,
        variants,
        infoSections: product.additionalInfoSections?.map((s: any) => ({ title: s.title, description: s.description })),
        options: product.productOptions?.map((opt: any) => ({
            name: opt.name,
            optionType: opt.optionType,
            choices: opt.choices.map((choice: any) => ({
                value: choice.value,
                description: choice.description,
                inStock: choice.inStock,
                visible: choice.visible,
                linkedMedia: choice.media?.items?.map((m: any) => m.image?.url).filter(Boolean),
            })),
        })),
        customTextFields: product.customTextFields?.map((f: any) => ({ title: f.title, maxLength: f.maxLength, mandatory: f.mandatory })),
        productPageUrl: validateProductPageUrl(product.productPageUrl?.base, product.productPageUrl?.path),
        collectionIds: product.collectionIds,
        mainCategoryId: undefined, // V1 doesn't have mainCategoryId
        ribbon: ribbonText,
        brand: product.brand || undefined,
        createdAt: safeToISOString(product._createdDate),
        updatedAt: safeToISOString(product.lastUpdated),
    };
}

/**
 * Normalizes a V1 variant into the standard NormalizedVariant format.
 * @param variant - The V1 variant object to normalize
 * @param product - The parent V1 product object
 * @returns Normalized variant object
 * @example
 * normalizeV1Variant({
 *   _id: "v1",
 *   variant: { priceData: { price: 10.99 } }
 * }, {
 *   priceData: { price: 9.99 }
 * })
 * // returns normalized variant object
 */
function normalizeV1Variant(variant: any, product: V1Product): NormalizedVariant {
    return {
        id: variant._id || '',
        sku: variant.variant?.sku ?? (product.sku || undefined),
        price: variant.variant?.priceData?.price ?? product.priceData?.price ?? 0,
        salePrice: variant.variant?.priceData?.discountedPrice,
        compareAtPrice: product.discount?.value,
        inStock: variant.stock?.inStock ?? product.stock?.inStock,
        visible: variant.variant?.visible ?? (product.visible || undefined),
        weight: variant.variant?.weight ?? (product.weight || undefined),
        digitalFile: variant.variant?.digitalFile,
    };
}

/**
 * Normalizes a V3 product into the standard NormalizedProduct format.
 * @param product - The V3 product object to normalize
 * @param currency - The currency code (e.g., "USD", "EUR")
 * @param symbol - The currency symbol (e.g., "$", "€")
 * @param site_url - The site URL for product page links
 * @returns Normalized product object
 * 
 * Price Handling:
 * - If actualPriceRange is missing, price and basePrice default to 0
 * - If actualPriceRange is missing, compareAtPrice is undefined
 * - If compareAtPriceRange is missing, compareAtPrice is undefined
 * 
 * @example
 * normalizeV3Product({
 *   _id: "123",
 *   name: "Product",
 *   actualPriceRange: { minValue: { amount: "10.99" } }
 * }, "USD", "$", "https://mysite.com")
 * // returns normalized product object
 */
async function normalizeV3Product(product: any, currency: string, symbol: string, site_url: string): Promise<NormalizedProduct> {
    const media = await getProductMedia(product, true);
    const variants = normalizeV3Variants(product, currency);
    const productPageUrl = validateProductPageUrl(site_url, `/product-page/${product.slug}`);

    // Handle missing price ranges
    const price = product.actualPriceRange?.minValue?.amount ? parsePrice(product.actualPriceRange.minValue.amount) : 0;
    const compareAtPrice = product.actualPriceRange ? (product.compareAtPriceRange?.minValue?.amount ? parsePrice(product.compareAtPriceRange.minValue.amount) : undefined) : undefined;

    return {
        id: product.id || product._id || '', // V3 uses "id", V1 uses "_id"
        name: product.name || '',
        slug: product.slug || undefined,
        visible: product.visible || undefined,
        media,
        thumbnailUrl: getThumbnailUrl(media),
        inStock: product.inventory?.availabilityStatus ? product.inventory.availabilityStatus === "IN_STOCK" : undefined,
        inventoryStatus: product.inventory?.availabilityStatus,
        price,
        formattedPrice: `${symbol}${price.toFixed(2)}`,
        basePrice: price,
        compareAtPrice,
        currency,
        symbol,
        variants,
        infoSections: product.infoSections?.map((s: any) => ({ title: s.title, description: s.description })),
        ribbon: product.ribbon?.name || undefined,
        brand: product.brand?.name || undefined,
        mainCategoryId: product.mainCategoryId || undefined,
        createdAt: safeToISOString(product.createdDate || product._createdDate), // V3 uses "createdDate", V1 uses "_createdDate"
        updatedAt: safeToISOString(product.updatedDate || product._updatedDate), // V3 uses "updatedDate", V1 uses "_updatedDate"
        productPageUrl
    };
}

/**
 * Normalizes V3 variants into the standard NormalizedVariant format.
 * Generates all possible variant combinations based on product options.
 * 
 * Price Handling:
 * - If actualPriceRange is missing, price defaults to 0
 * - If actualPriceRange is missing, compareAtPrice is undefined
 * - If compareAtPriceRange is missing, compareAtPrice is undefined
 * 
 * @param product - The V3 product object
 * @param currency - The currency code (e.g., "USD", "EUR")
 * @returns Array of normalized variant objects
 * 
 * @example
 * normalizeV3Variants({
 *   options: [{
 *     name: "Size",
 *     choicesSettings: {
 *       choices: [{ name: "Small", choiceId: "s" }]
 *     }
 *   }]
 * }, "USD")
 * // returns array of normalized variant objects
 */
function normalizeV3Variants(product: any, currency: string): NormalizedVariant[] {
    const combinations = generateVariantCombinations(product.options || []);
    const optionNames = Object.fromEntries((product.options || []).map((opt: any) => [opt.id || opt._id, opt.name]));

    // Handle missing price ranges
    const price = product.actualPriceRange?.minValue?.amount ? parsePrice(product.actualPriceRange.minValue.amount) : 0;
    const compareAtPrice = product.compareAtPriceRange?.minValue?.amount ? parsePrice(product.compareAtPriceRange.minValue.amount) : undefined;

    return combinations.map((combo: any) => ({
        id: combo.map((c: any) => c.choiceId).join("-"),
        sku: undefined, // V3 doesn't have top-level sku
        price,
        salePrice: price,
        compareAtPrice,
        inStock: product.inventory?.availabilityStatus === "IN_STOCK",
        visible: product.visible || undefined,
        weight: undefined, // V3 doesn't have weight property in physicalProperties
        options: combo.map((c: any) => ({
            name: optionNames[c.optionId] ?? "",
            value: c.value,
            choiceId: c.choiceId,
            colorCode: c.colorCode,
        })),
    }));
}

/**
 * Generates all possible combinations of variant options.
 * @param options - Array of product options
 * @returns Array of option combinations
 * @example
 * generateVariantCombinations([{
 *   _id: "size",
 *   choicesSettings: {
 *     choices: [
 *       { choiceId: "s", name: "Small" },
 *       { choiceId: "m", name: "Medium" }
 *     ]
 *   }
 * }])
 * // returns [[{ optionId: "size", choiceId: "s", value: "Small" }],
 * //          [{ optionId: "size", choiceId: "m", value: "Medium" }]]
 */
function generateVariantCombinations(options: any[]): any[][] {
    if (!options.length) return [[]];
    const [first, ...rest] = options;
    const restCombos = generateVariantCombinations(rest);
    const combos: any[][] = [];

    const choices = first.choicesSettings?.choices || [];
    const optionId = first.id || first._id; // V3 uses "id", V1 uses "_id"

    choices.forEach((choice: any) => {
        restCombos.forEach(restCombo => {
            combos.push([{
                optionId,
                choiceId: choice.choiceId,
                value: choice.name || choice.key,
                colorCode: choice.colorCode
            }, ...restCombo]);
        });
    });

    return combos;
}

/**
 * Normalizes a product into the standard format based on its catalog version.
 * @param product - The product object to normalize
 * @param version - The catalog version ("V1_CATALOG" or "V3_CATALOG")
 * @param currency - The currency code
 * @param symbol - The currency symbol
 * @param site_url - The site URL for product page links
 * @returns Normalized product object
 * @example
 * normalizeProduct({
 *   _id: "123",
 *   name: "Product",
 *   priceData: { price: 10.99 }
 * }, "V1_CATALOG", "USD", "$")
 * // returns normalized product object
 */
export async function normalizeProduct(product: any, version: CatalogVersion, currency: string, symbol: string, site_url: string): Promise<NormalizedProduct> {
    return version === "V3_CATALOG"
        ? await normalizeV3Product(product, currency, symbol, site_url)
        : await normalizeV1Product(product, currency, symbol);
}

/**
 * Retrieves the current catalog version.
 * @returns Promise resolving to the catalog version ("V1_CATALOG" or "V3_CATALOG")
 * @throws Error if unable to determine catalog version
 * @example
 * const version = await getCatalogVersion();
 * console.log(version); // "V3_CATALOG"
 */
export async function getCatalogVersion(): Promise<CatalogVersion> {
    try {
        const { catalogVersion } = await catalogVersioning.getCatalogVersion();
        return catalogVersion as CatalogVersion;
    } catch (err) {
        console.error("Error fetching catalog version:", err);
        throw new Error("Unable to determine catalog version");
    }
}

/**
 * Retrieves the store's currency information.
 * @returns Promise resolving to currency information including locale, currency code, symbol, and site URL
 * @example
 * const { locale, currency, symbol, site_url } = await getCurrency();
 * console.log(`${locale} ${currency} ${symbol} ${site_url}`); // "en USD $ https://mysite.com"
 */
export async function getCurrency(): Promise<{ locale: string; currency: string; symbol: string; site_url: string }> {
    const DEFAULT = {
        locale: "en",
        currency: "USD",
        symbol: "$",
        site_url: ""
    };

    try {
        const { site } = await appInstances.getAppInstance();
        const { currencies: list } = await currencies.listCurrencies();

        const currencyCode = site?.paymentCurrency ?? DEFAULT.currency;
        const locale = site?.locale ?? DEFAULT.locale;
        const site_url = site?.url ?? DEFAULT.site_url;

        if (!Array.isArray(list) || list.length === 0) return DEFAULT;

        const match = list.find(c => c.code === currencyCode);

        return {
            locale,
            currency: match?.code ?? DEFAULT.currency,
            symbol: match?.symbol ?? DEFAULT.symbol,
            site_url
        };
    } catch (err) {
        console.error("Error getting currency:", err);
        return DEFAULT;
    }
}

/**
 * Retrieves the appropriate product API and configuration based on the catalog version.
 * @returns Promise resolving to version information and API instance
 * @example
 * const { version, api, currency, symbol, site_url } = await useProducts();
 * const products = await api.queryProducts().find();
 */
export async function useProducts() {
    const version = await getCatalogVersion();
    const { currency, locale, symbol, site_url } = await getCurrency();
    // console.log("Catalog Version:", version, "\nLocale:", locale, "\nCurrency:", currency, "\nSymbol:", symbol, "\nSite URL:", site_url);
    return { version, currency, locale, symbol, site_url, api: version === "V3_CATALOG" ? productsV3 : products };
}

/**
 * Fetches all products from the store and normalizes them.
 * Handles pagination automatically.
 * @returns Promise resolving to array of normalized products
 * @throws Error if unable to fetch products
 * @example
 * const products = await fetchAllProducts();
 * console.log(products.length); // total number of products
 */
export async function fetchAllProducts(): Promise<NormalizedProduct[]> {
    const { version, api, symbol, currency, site_url } = await useProducts();
    const limit = 50;
    const output: NormalizedProduct[] = [];

    try {
        let result = await api.queryProducts().limit(limit).find();

        while (true) {
            const normalizedItems = await Promise.all(
                result.items.map((item: any) => normalizeProduct(item, version, currency, symbol, site_url))
            );
            output.push(...normalizedItems);
            if (!result.hasNext()) break;
            result = await result.next();
        }

        return output;
    } catch (err) {
        console.error("Error fetching products:", err);
        throw new Error("Unable to fetch products");
    }
}