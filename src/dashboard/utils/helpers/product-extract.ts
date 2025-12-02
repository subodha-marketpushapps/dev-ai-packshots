import { products } from "@wix/stores";
import { NormalizedProduct } from "../catalogNormalizer";
import { getMediaUrls } from "../catalogNormalizer";

// Utility type to accept both Product and NormalizedProduct
type ProductUnion = products.Product | NormalizedProduct;

export const extractProductName = (product: ProductUnion | undefined) => {
  if (!product) return "";
  
  // Both NormalizedProduct and raw products have 'name' field
  return (product as any)?.name || "";
};

export const extractProductSlug = (product: ProductUnion | undefined) => {
  if (!product) return "";
  
  // Both NormalizedProduct and raw products have 'slug' field
  return (product as any)?.slug || "";
};

export const extractImageUrl = (product: ProductUnion | undefined) => {
  if (!product) return "";
  
  // Check if it's a NormalizedProduct (has thumbnailUrl or media object)
  if ('thumbnailUrl' in product || ('media' in product && typeof product.media === 'object')) {
    const normalized = product as NormalizedProduct;
    return normalized.thumbnailUrl || getMediaUrls(normalized.media)[0] || "";
  }
  
  // Fallback to V1 Product structure
  const v1Product = product as products.Product;
  return v1Product?.media?.mainMedia?.thumbnail?.url ?? "";
};

export const extractFormattedPrice = (
  product: ProductUnion | undefined
) => {
  if (!product) return "";
  
  // Check if it's a NormalizedProduct (has formattedPrice)
  if ('formattedPrice' in product) {
    const normalized = product as NormalizedProduct;
    return normalized.formattedPrice || "";
  }
  
  // Fallback to V1 Product structure
  const v1Product = product as products.Product;
  return v1Product?.convertedPriceData?.formatted?.price ?? "";
};

export const extractProductId = (product: ProductUnion | undefined) => {
  if (!product) return "";
  
  // Check if it's a NormalizedProduct (has id)
  if ('id' in product) {
    const normalized = product as NormalizedProduct;
    return normalized.id || "";
  }
  
  // Handle both V1 and V3 Product structures
  const rawProduct = product as any;
  return rawProduct?.id || rawProduct?._id || "";
};

export const extractCreatedDate = (product: ProductUnion | undefined) => {
  if (!product) return "";
  
  // Check if it's a NormalizedProduct (has createdAt)
  if ('createdAt' in product) {
    const normalized = product as NormalizedProduct;
    return normalized.createdAt
      ? new Date(normalized.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
  }
  
  // Handle both V1 and V3 Product structures
  const rawProduct = product as any;
  const createdDate = rawProduct?._createdDate || rawProduct?.createdDate;
  
  return createdDate
    ? new Date(createdDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
};

export const extractLastUpdatedDate = (
  product: ProductUnion | undefined
) => {
  if (!product) return "";
  
  // Check if it's a NormalizedProduct (has updatedAt)
  if ('updatedAt' in product) {
    const normalized = product as NormalizedProduct;
    return normalized.updatedAt
      ? new Date(normalized.updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
  }
  
  // Handle both V1 and V3 Product structures
  const rawProduct = product as any;
  const lastUpdated = rawProduct?.lastUpdated || rawProduct?.updatedDate;
  
  return lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
};
