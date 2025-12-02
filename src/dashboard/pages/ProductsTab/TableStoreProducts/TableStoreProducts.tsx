import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  InfoIcon,
  TableToolbar,
  Table,
  Card,
  TableColumn,
  SkeletonGroup,
  SkeletonLine,
  Search,
  Tooltip,
  IconButton,
  Loader,
  Page,
  Pagination,
  Text,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

import { extractImageUrl } from "../../../utils";
import { useWixStoreProductsPaginated } from "../../../hooks/useWixStoreProducts";
import { SortOptions } from "../../../services/api/wix-store-products";
import { useGeneratedImages } from "../../../hooks/useGeneratedImages";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { NormalizedProduct, getCatalogVersion } from "../../../utils/catalogNormalizer";
import { TableState } from "../../../components/ui/TableState";
import { EmptyTableTitle } from "../../../components/ui/TableSkeleton";

import {
  definedColumnStructure,
  TableRawData,
  derivedTableElements,
} from "./table-config";

interface TableStoreProductsProps {
  onProductsUpdate?: (products: NormalizedProduct[]) => void;
}

const TableStoreProducts: React.FC<TableStoreProductsProps> = ({
  onProductsUpdate
}) => {
  const { t } = useTranslation();
  // 🎯 Following Wix Design System patterns with PAGINATION (better for data tables)
  
  // Get translated column structure
  const [columns, setColumns] = useState<TableColumn[]>(definedColumnStructure);
  // ✅ Features implemented following Wix standards:
  // - Table with proper Page.Sticky header (Wix pattern)
  // - Pagination instead of infinite scroll (better UX for product tables)
  // - Server-side search with 3+ character minimum (Wix UX standard)
  // - Server-side sorting across entire dataset (not just current page)
  // - Built-in Search component debouncing (800ms) - Wix Design System feature
  // - Proper loading states using Wix Design System components
  // - TableToolbar with correct ItemGroup positioning
  // - Pagination controls with proper accessibility
  // - Better performance and navigation for large datasets
  // - Auto-reset to page 1 when search terms or sorting changes
  // - keepPreviousData for smooth page transitions
  // - Field mapping for Wix API compatibility

  // State for table functionality
  const [sort, setSort] = useState<SortOptions | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [isV3Catalog, setIsV3Catalog] = useState<boolean>(false); // Track catalog version

  // Constants
  const ITEMS_PER_PAGE = 10;

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Detect catalog version and disable sorting for V3
  useEffect(() => {
    const detectCatalogVersion = async () => {
      try {
        const catalogVersion = await getCatalogVersion();
        const isV3 = catalogVersion === "V3_CATALOG";
        setIsV3Catalog(isV3);
        
        // If V3, disable sorting on all sortable columns
        if (isV3) {
          setColumns(prevColumns => 
            prevColumns.map(column => ({
              ...column,
              sortable: false, // Disable sorting for V3
              sortDescending: undefined
            }))
          );
          // Clear any existing sort state for V3
          setSort(undefined);
        } else {
          // For V1, ensure original sortable state is restored
          setColumns(getDefinedColumnStructure(t));
        }
      } catch (error) {
        console.error("Error detecting catalog version:", error);
        // Default to V1 behavior on error
        setIsV3Catalog(false);
        setColumns(getDefinedColumnStructure(t));
      }
    };

    detectCatalogVersion();
  }, []); // Run once on component mount

  // Use hooks with server-side search, pagination, and sorting
  const wixStoreProductsQuery = useWixStoreProductsPaginated(
    currentPage,
    ITEMS_PER_PAGE,
    searchTerm,
    isV3Catalog ? undefined : sort // Disable sorting for V3 catalog
  );
  const { getAllGeneratedImages } = useGeneratedImages();
  const { openPhotoStudio } = usePhotoStudio();

  const {
    data: generatedImages,
    isLoading: isGeneratedImagesLoading,
    error: generatedImagesError,
    refetch: refetchGeneratedImages,
  } = getAllGeneratedImages();

  const isLoading = wixStoreProductsQuery.isLoading || isGeneratedImagesLoading;
  const isPageChanging =
    wixStoreProductsQuery.isFetching && !wixStoreProductsQuery.isLoading;
  const error = wixStoreProductsQuery.error || generatedImagesError;
  const wixStoreProducts = wixStoreProductsQuery.data || [];

  // Handle product edit click
  const handleOnPhotoEditClick = useCallback(
    (product: TableRawData) => {
      if (openPhotoStudio) {
        openPhotoStudio({ type: "product", productId: product.id });
      }
    },
    [openPhotoStudio]
  );

  // Derive table data
  const derivedWixProductData = useMemo(() => {
    return wixStoreProducts.map((product: NormalizedProduct) => {
      const productGeneratedImages =
        generatedImages?.filter((image) => image.productId === product.id) ||
        [];

      return {
        ...product,
        image: product.media?.mainMedia?.thumbnailUrl || extractImageUrl(product),
        generatedImages: productGeneratedImages,
      } as TableRawData;
    });
  }, [wixStoreProducts, generatedImages]);

  // Define cell actions - properly typed for the existing interface
  const cellActions = useMemo(
    () => [(rowData: TableRawData) => handleOnPhotoEditClick(rowData)],
    [handleOnPhotoEditClick]
  );

  // Create table records
  const tableRecords = useMemo(
    () => derivedTableElements(derivedWixProductData, cellActions),
    [derivedWixProductData, cellActions]
  );

  // Data is already filtered and sorted server-side
  const filteredData = useMemo(() => {
    // No client-side filtering or sorting needed since we're using server-side
    // The search and sorting are handled by the API query with searchTerm and sort options
    return tableRecords;
  }, [tableRecords]);

  // Handle pagination
  const handlePageChange = useCallback(
    (event: { event: React.SyntheticEvent; page: number }) => {
      setCurrentPage(event.page);
    },
    []
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      wixStoreProductsQuery.refetch(),
      refetchGeneratedImages(),
    ]);
  }, [wixStoreProductsQuery, refetchGeneratedImages]);

  // Handle sorting - server-side sorting with page reset
  const handleSort = useCallback(
    (colData: TableColumn, colNum: number) => {
      // Disable sorting for V3 catalog
      if (isV3Catalog) {
        console.log("Sorting is disabled for V3 catalog");
        return;
      }

      const newOrder = colData.sortDescending ? "asc" : "desc";
      const sortOption: SortOptions = {
        fieldName: String(colData.key),
        order: newOrder,
      };

      if (
        sort?.fieldName === sortOption.fieldName &&
        sort?.order === newOrder
      ) {
        return;
      }

      setSort(sortOption);
      setCurrentPage(1); // Reset to first page when sorting changes

      setColumns((prevColumns) =>
        prevColumns.map((column) => {
          if (sortOption.fieldName === column.key) {
            return { ...column, sortDescending: newOrder !== "asc" };
          }
          return { ...column, sortDescending: undefined };
        })
      );
    },
    [sort, isV3Catalog]
  );

  // Initialize sorting - only for V1 catalog
  useEffect(() => {
    // Skip initialization for V3 catalog since sorting is disabled
    if (isV3Catalog) {
      return;
    }

    const index = columns.findIndex(
      (col) => col.sortable && col.sortDescending !== undefined
    );
    if (index !== -1) {
      const colData = columns[index];
      const order = colData.sortDescending ? "desc" : "asc";
      setSort({
        fieldName: String(colData.key),
        order: order,
      });
    }
  }, [columns, isV3Catalog]);

  const noData = tableRecords.length === 0;
  const isTableReadyToRender = !isLoading;

  // Search state management following Wix UX patterns
  const hasNoSearchResults =
    searchTerm &&
    searchTerm.length >= 3 &&
    filteredData.length === 0 &&
    !isLoading;
  const showEmptyState = !searchTerm && noData; // Only show empty state when no search and no data

  // Show search hint only when table is empty and user needs guidance
  const showSearchHint =
    searchTerm.length > 0 && searchTerm.length < 3 && noData;

  // Notify parent component about current products
  // Use a ref to track previous products to avoid unnecessary updates
  const prevProductsRef = useRef<NormalizedProduct[]>([]);

  useEffect(() => {
    if (!onProductsUpdate) return;

    let productsToSend: NormalizedProduct[] = [];

    if (isTableReadyToRender && !error && wixStoreProducts.length > 0) {
      productsToSend = wixStoreProducts;
    }

    // Only call onProductsUpdate if products actually changed
    const prevProducts = prevProductsRef.current;
    const hasChanged =
      productsToSend.length !== prevProducts.length ||
      productsToSend.some((product, index) => product.id !== prevProducts[index]?.id);

    if (hasChanged) {
      prevProductsRef.current = productsToSend;
      onProductsUpdate(productsToSend);
    }
  }, [onProductsUpdate, wixStoreProducts, isTableReadyToRender, error, isLoading]);

  return (
    <Box direction="vertical" gap="16px">
      {/* Using Wix pattern: Table wrapper with pagination */}
      <Table
        data={filteredData}
        columns={columns}
        rowVerticalPadding="medium"
        onSortClick={handleSort}
        onSelectionChanged={(e) => {
          if (Array.isArray(e)) setSelectedIds(e.map((id) => Number(id)));
        }}
        width="100%"
        rowClass="table-row"
        selectedIds={selectedIds}
      >
        {/* Sticky header following Wix internal patterns */}
        <Page.Sticky>
          <Card className="half-card-borders">
            <TableToolbar>
              <TableToolbar.ItemGroup position="start">
                <TableToolbar.Item>
                  <TableToolbar.Title>
                    {isTableReadyToRender && (
                      <Box align="center" verticalAlign="middle" gap={0.5}>
                        {t('productsTab.title', {defaultValue: "Store Products"})}
                        <InfoIcon content={t('productsTab.tableInfo', {defaultValue: "Use this table to view and edit store product related product images."})} />
                      </Box>
                    )}
                    {!isTableReadyToRender && (
                      <SkeletonGroup>
                        <SkeletonLine width="180px" />
                      </SkeletonGroup>
                    )}
                  </TableToolbar.Title>
                </TableToolbar.Item>
              </TableToolbar.ItemGroup>

              {/* Action items following Wix toolbar patterns */}
              {isTableReadyToRender && (
                <TableToolbar.ItemGroup position="end">
                  <TableToolbar.Item>
                    <Search
                      size="small"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      value={searchTerm}
                      onClear={() => setSearchTerm("")}
                      placeholder={t('productsTab.searchPlaceholder', {defaultValue: "Search products..."})}
                      expandable={false}
                      debounceMs={800}
                    />
                  </TableToolbar.Item>
                  <TableToolbar.Item>
                    <Tooltip
                      content={t('productsTab.refreshData', {defaultValue: "Refresh data"})}
                      size="small"
                      placement="top"
                    >
                      <IconButton
                        priority="secondary"
                        size="small"
                        onClick={handleRefresh}
                        disabled={isLoading}
                      >
                        <Icons.Refresh />
                      </IconButton>
                    </Tooltip>
                  </TableToolbar.Item>
                </TableToolbar.ItemGroup>
              )}
            </TableToolbar>

            {/* Titlebar for table headers - Wix pattern */}
            {isTableReadyToRender &&
              !showEmptyState &&
              !showSearchHint &&
              !error && <Table.Titlebar />}

            {/* Empty titlebar skeleton when loading */}
            {!isTableReadyToRender && <EmptyTableTitle />}
          </Card>
        </Page.Sticky>

        {/* Main table content wrapper following Wix patterns */}
        <Card hideOverflow={true} className="table-wrapper-card">
          {/* Page changing loading overlay */}
          {isPageChanging && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(1px)",
              }}
            >
              <Loader size="small" />
            </div>
          )}

          {/* Loading state */}
          {!isTableReadyToRender && (
            <TableState stateType="loading" title={t('loading.loading', {defaultValue: "Loading..."})} />
          )}

          {/* Error state */}
          {isTableReadyToRender && error && (
            <TableState
              stateType="error"
              title={t('errors.tableLoadError.title', {defaultValue: "We couldn't load this table"})}
              subtitle={t('errors.tableLoadError.subtitle', {defaultValue: "Looks like there was a technical issue on our end. Wait a few minutes and try again."})}
              intercomMessage={t('errors.tableLoadError.intercomMessage', {defaultValue: "I having a data loading issue with the 'Store Products' table. Can you help me with this?"})}
              intercomButtonLabel={t('errors.tableLoadError.intercomButtonLabel', {defaultValue: "Contact Support"})}
            />
          )}

          {/* Empty state - no products at all */}
          {isTableReadyToRender && !error && showEmptyState && (
            <TableState
              stateType="empty"
              title={t('emptyStates.noStoreProducts.title', {defaultValue: "No Store Products"})}
              subtitle={t('emptyStates.noStoreProducts.subtitle', {defaultValue: "Once you add store products, they will appear here."})}
            />
          )}

          {/* Search hint - only shown when table is empty and user needs guidance */}
          {isTableReadyToRender && !error && showSearchHint && (
            <TableState
              stateType="empty"
              title={t('emptyStates.startTypingToSearch.title', {defaultValue: "Start typing to search products"})}
              subtitle={t('emptyStates.startTypingToSearch.subtitle', {defaultValue: "Enter at least 3 characters to search through your product catalog"})}
            />
          )}

          {/* No search results */}
          {isTableReadyToRender && !error && hasNoSearchResults && (
            <TableState
              stateType="noSearchResults"
              title={t('emptyStates.noSearchResults.title', {defaultValue: "No search results"})}
              subtitle={t('emptyStates.noSearchResults.subtitle', {defaultValue: "No items match your search criteria. Try to search by another keyword"})}
              innerActionFunction={() => setSearchTerm("")}
            />
          )}

          {/* Table content - titleBarVisible={false} prevents duplicate headers */}
          {isTableReadyToRender &&
            !error &&
            !showEmptyState &&
            !showSearchHint && <Table.Content titleBarVisible={false} />}
        </Card>
      </Table>

      {/* Pagination - render below table when there's data */}
      {isTableReadyToRender &&
        !error &&
        !showEmptyState &&
        !showSearchHint &&
        wixStoreProductsQuery.totalPages > 1 && (
          <Box align="center" padding="16px 0px">
            <Pagination
              totalPages={wixStoreProductsQuery.totalPages}
              currentPage={currentPage}
              onChange={handlePageChange}
              disabled={isPageChanging}
            />
          </Box>
        )}
    </Box>
  );
};

export default TableStoreProducts;
