/**
 * Wix Products Types
 * 
 * Type definitions for the Wix products service module
 */

import { NormalizedProduct } from "../../utils/catalogNormalizer";

export interface PaginatedProductsResponse {
  items: NormalizedProduct[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number;
}

export interface SortOptions {
  fieldName: string;
  order: "asc" | "desc";
}

export interface ProductSearchOptions {
  searchTerm: string;
  sortOptions?: SortOptions;
  fieldsets: string[];
  limit?: number;
  offset?: number;
}

export interface ProductQueryOptions {
  productIdList?: string[];
  sortOptions?: SortOptions;
  fieldsets: string[];
  limit?: number;
}
