import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchWixStoreProducts,
  fetchWixStoreProductsPaginated,
  PaginatedProductsResponse,
  SortOptions,
} from "../services/api/wix-store-products";
import { useSetRecoilState } from "recoil";
import { wixStoreProductsState } from "../services/state";
import { NormalizedProduct } from "../utils/catalogNormalizer";
import { useMemo } from "react";

export const QUERY_WIX_STORE_PRODUCTS = "queryWixStoreProducts";
export const QUERY_WIX_STORE_PRODUCTS_INFINITE =
  "queryWixStoreProductsInfinite";

export interface InfiniteProductsQueryResult {
  data: NormalizedProduct[];
  totalCount: number;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<any>;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => Promise<any>;
}

export interface PaginatedProductsQueryResult {
  data: NormalizedProduct[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: any;
  refetch: () => Promise<any>;
}

export const useWixStoreProducts = (options?: { enabled?: boolean }) => {
  const setStoreProducts = useSetRecoilState(wixStoreProductsState);
  const query = useQuery<NormalizedProduct[]>({
    queryKey: [QUERY_WIX_STORE_PRODUCTS],
    queryFn: () => fetchWixStoreProducts(),
    enabled: options?.enabled,
    onSuccess: (data) => {
      setStoreProducts(data);
    },
  });
  return query;
};

export const useWixStoreProductsInfinite = (
  itemsPerPage: number = 10,
  searchTerm?: string,
  options?: { enabled?: boolean }
): InfiniteProductsQueryResult => {
  const setStoreProducts = useSetRecoilState(wixStoreProductsState);

  const query = useInfiniteQuery<PaginatedProductsResponse>({
    queryKey: [QUERY_WIX_STORE_PRODUCTS_INFINITE, itemsPerPage, searchTerm],
    queryFn: ({ pageParam = 0 }) => {
      // console.log(
      //   "🔍 Fetching products with pageParam:",
      //   pageParam,
      //   "itemsPerPage:",
      //   itemsPerPage,
      //   "searchTerm:",
      //   searchTerm
      // );
      return fetchWixStoreProductsPaginated(
        pageParam as number,
        itemsPerPage,
        undefined,
        searchTerm
      );
    },
    enabled: options?.enabled ?? true,
    getNextPageParam: (lastPage) => {
      // console.log("📄 getNextPageParam - lastPage:", {
      //   hasMore: lastPage.hasMore,
      //   nextOffset: lastPage.nextOffset,
      //   itemsLength: lastPage.items.length,
      // });
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    onSuccess: (data) => {
      // Flatten all pages and update the recoil state
      const allProducts = data.pages.flatMap((page) => page.items);
      // console.log(
      //   "✅ Query success - total products loaded:",
      //   allProducts.length
      // );
      setStoreProducts(allProducts);
    },
    onError: (error) => {
      console.error("Query error:", error);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoized flattened data for easier consumption
  const flatData = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.items) || [];
  }, [query.data]);

  // Total count from the first page
  const totalCount = useMemo(() => {
    return query.data?.pages[0]?.totalCount || 0;
  }, [query.data]);

  return {
    data: flatData,
    totalCount,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useWixStoreProductsPaginated = (
  currentPage: number = 1,
  itemsPerPage: number = 10,
  searchTerm?: string,
  sortOptions?: SortOptions,
  options?: { enabled?: boolean }
): PaginatedProductsQueryResult => {
  const setStoreProducts = useSetRecoilState(wixStoreProductsState);

  // Calculate offset based on page (1-indexed)
  const offset = (currentPage - 1) * itemsPerPage;

  // Apply minimum character requirement for search - follow Wix UX standards
  const effectiveSearchTerm =
    searchTerm && searchTerm.length >= 3 ? searchTerm : "";

  const query = useQuery<PaginatedProductsResponse>({
    queryKey: [
      QUERY_WIX_STORE_PRODUCTS_INFINITE,
      currentPage,
      itemsPerPage,
      effectiveSearchTerm,
      sortOptions,
    ],
    queryFn: () => {
      // console.log(
      //   "🔍 Fetching paginated products - page:",
      //   currentPage,
      //   "itemsPerPage:",
      //   itemsPerPage,
      //   "searchTerm:",
      //   effectiveSearchTerm,
      //   "sortOptions:",
      //   sortOptions
      // );
      return fetchWixStoreProductsPaginated(
        offset,
        itemsPerPage,
        undefined,
        effectiveSearchTerm,
        sortOptions
      );
    },
    enabled: options?.enabled ?? true,
    onSuccess: (data) => {
      // console.log(
      //   "✅ Paginated query success - products loaded:",
      //   data.items.length,
      //   "total:",
      //   data.totalCount
      // );
      setStoreProducts(data.items);
    },
    onError: (error) => {
      console.error("Paginated query error:", error);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data while loading new page
  });

  // Calculate total pages
  const totalPages = Math.ceil((query.data?.totalCount || 0) / itemsPerPage);

  return {
    data: query.data?.items || [],
    totalCount: query.data?.totalCount || 0,
    currentPage,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
