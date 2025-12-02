import { dashboard } from "@wix/dashboard";
import { getCatalogVersion, type CatalogVersion } from "../catalogNormalizer";

const WIX_STORE_PAGE_ID = "0845ada2-467f-4cab-ba40-2f07c812343d";

// Legacy type for backward compatibility
export type LegacyCatalogVersion = "v1" | "v3";

/**
 * Converts CatalogVersion from catalogNormalizer to the format expected by Wix dashboard URLs
 */
function catalogVersionToUrlVersion(version: CatalogVersion): LegacyCatalogVersion {
  return version === "V3_CATALOG" ? "v3" : "v1";
}

/**
 * Open the Wix Stores product editor for a given product ID.
 * Automatically detects the catalog version or uses the provided version.
 * - V1: /store/products/product/{id}
 * - V3: /wix-stores/products/product/{id}
 * 
 * @param options - Configuration object
 * @param options.productId - The product ID to edit
 * @param options.version - Optional catalog version override
 */
export async function openProductEditPage(options: {
  productId: string | undefined;
  version?: CatalogVersion;
}): Promise<void>;

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use the options object format instead
 */
export async function openProductEditPage(
  productId: string | undefined,
  version?: LegacyCatalogVersion
): Promise<void>;

export async function openProductEditPage(
  productIdOrOptions: string | undefined | { productId: string | undefined; version?: CatalogVersion },
  legacyVersion?: LegacyCatalogVersion
): Promise<void> {
  try {
    let productId: string | undefined;
    let catalogVersion: CatalogVersion;

    // Handle both new options object and legacy parameters
    if (typeof productIdOrOptions === "object" && productIdOrOptions !== null) {
      // New options object format
      productId = productIdOrOptions.productId;
      catalogVersion = productIdOrOptions.version || await getCatalogVersion();
    } else {
      // Legacy parameter format
      productId = productIdOrOptions;
      if (legacyVersion) {
        catalogVersion = legacyVersion === "v3" ? "V3_CATALOG" : "V1_CATALOG";
      } else {
        catalogVersion = await getCatalogVersion();
      }
    }

    if (!productId || !productId.trim()) {
      console.warn("openProductEditPage: missing productId");
      alert("No product selected. Please choose a product and try again.");
      return;
    }

    const urlVersion = catalogVersionToUrlVersion(catalogVersion);
    const relativeUrl = `products/product/${productId}`;

    let pageUrl = await dashboard.getPageUrl({
      pageId: WIX_STORE_PAGE_ID,
      relativeUrl,
    });

    // Replace /store/ with /wix-stores/ for V3 catalog
    if (urlVersion === "v3") {
      pageUrl = pageUrl.replace("/store/", "/wix-stores/");
    }

    window.open(pageUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Failed to open product edit page:", error);
    alert("Couldn't open the product editor. Please try again or refresh.");
  }
}