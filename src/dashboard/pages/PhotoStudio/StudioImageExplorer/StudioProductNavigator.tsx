import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import {
  AutoComplete,
  Box,
  FormField,
  IconButton,
  Image,
  listItemSelectBuilder,
  Text,
  Tooltip,
} from "@wix/design-system";

import * as Icons from "@wix/wix-ui-icons-common";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useWixStoreProductsInfinite } from "../../../hooks/useWixStoreProducts";
import {
  fetchWixStoreProducts,
  fetchWixStoreProductsPaginated,
} from "../../../services/api/wix-store-products";
import {
  extractFormattedPrice,
  extractImageUrl,
  openProductEditPage,
} from "../../../utils";
import { NormalizedProduct } from "../../../utils/catalogNormalizer";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";

// Constants
const ITEMS_PER_PAGE = 20;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_DELAY = 300;

interface StudioProductNavigatorProps {}

// Type definitions for better type safety
interface ProductNavigatorState {
  inputValue: string;
  isSearchMode: boolean;
  isFocused: boolean; // Track if the input is focused
  browseProducts: NormalizedProduct[]; // Products from infinite scroll (browse mode)
  searchResults: NormalizedProduct[]; // Products from search API calls
  specificProduct: NormalizedProduct | null; // Single product fetched by ID
  isFetchingSpecific: boolean;
  isFetchingSearch: boolean; // Track search API calls
  recentlySelectedId: string | null;
  hasSearched: boolean; // Track if we've actually performed a search
}

/**
 * StudioProductNavigator
 *
 * A robust, context-aware product search and selection component for the Photo Studio dashboard.
 *
 * ## Core Features
 * - **Browse Mode**: Infinite scroll for product browsing, with products loaded in pages.
 * - **Search Mode**: API-powered search with strict separation from browse data. Only search results are shown in search mode.
 * - **Specific Product Fetch**: If a selected product is not in the current context (e.g., after navigation or deep-link), fetches and displays it in the dropdown.
 * - **State Sync**: Syncs with the product table’s state (pagination, filters, search) and updates on selection.
 * - **Edge Case Handling**: Handles empty context, race conditions, and ensures no data loss during hook resets.
 * - **Quick Actions**: Edit and preview actions for the selected product, with tooltips and accessibility support.
 * - **UX Optimizations**:
 *   - Placeholder always visible on focus
 *   - Clear (X) button for quick value removal
 *   - Dropdown width and maxHeight optimized for dashboard
 *   - "No results found" message with icon in search mode
 *   - Disabled options (like "no results") are not selectable
 * - **Performance**: Prevents unnecessary fetches, debounces search input and API calls, and manages state transitions efficiently.
 * - **Debug Logging**: Essential error and state transition logs for easier debugging and QA.
 *
 * ## State Model
 * - `inputValue`: Current input value in the search field
 * - `isSearchMode`: Whether the user is searching (vs. browsing)
 * - `isFocused`: Whether the input is focused (affects placeholder/clear button)
 * - `browseProducts`: Products loaded via infinite scroll (browse mode)
 * - `searchResults`: Products returned from search API (search mode)
 * - `specificProduct`: Product fetched by ID if not in context
 * - `isFetchingSpecific`: Loading state for specific product fetch
 * - `isFetchingSearch`: Loading state for search API
 * - `recentlySelectedId`: Tracks last selected product to avoid race conditions
 * - `hasSearched`: Tracks if we've actually performed a search (prevents premature "No results" display)
 *
 * ## Usage/Integration
 * - Used in StudioImageExplorer as the main product selector.
 * - Relies on `usePhotoStudio` provider for productId and changeProductId.
 * - Uses `useWixStoreProductsInfinite` for browse mode, and `fetchWixStoreProductsPaginated` for search.
 *
 * ## Edge Cases Handled
 * - Product not in current context (deep-link, navigation): fetches and displays.
 * - Empty context: shows empty state, disables actions.
 * - Race conditions: prevents duplicate fetches and state loss.
 * - Search mode: only search results shown, not the selected product.
 * - After search selection: resets state to avoid missing data in dropdown.
 *
 * ## Accessibility & UX
 * - Keyboard navigation supported via AutoComplete.
 * - Tooltips for actions, clear button for quick reset.
 * - Visual cues for loading, disabled, and selected states.
 *
 * ## Extensibility
 * - Can be extended for additional product actions or custom dropdown rendering.
 *
 * ## Debugging
 * - Essential logs for fetches, selections, and errors.
 * - Remove or adjust log levels for production as needed.
 *
 * ## Authors & Maintenance
 * - Refactored and optimized July 2025 for robust state management, UX, and production readiness.
 * - See backup/variant files in _archive for previous versions.
 */
const StudioProductNavigator: React.FC<StudioProductNavigatorProps> = () => {
  const { t } = useTranslation();
  const {
    productId,
    changeProductId,
    isLoadingImages,
    apiLoading,
    isPublishing,
  } = usePhotoStudio();
  const { addToast } = useStatusToast();

  // Ref for debouncing search input
  const searchDebounceRef = useRef<number | null>(null);

  // Consolidated state for better organization
  const [state, setState] = useState<ProductNavigatorState>({
    inputValue: "",
    isSearchMode: false,
    isFocused: false,
    browseProducts: [],
    searchResults: [],
    specificProduct: null,
    isFetchingSpecific: false,
    isFetchingSearch: false,
    recentlySelectedId: null,
    hasSearched: false,
  });

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Helper functions for state updates
  const updateState = useCallback((updates: Partial<ProductNavigatorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Derive search term with minimum length requirement
  const effectiveSearchTerm = useMemo(() => {
    return state.isSearchMode &&
      state.inputValue &&
      state.inputValue.length >= MIN_SEARCH_LENGTH
      ? state.inputValue.trim()
      : "";
  }, [state.inputValue, state.isSearchMode]);

  // Use infinite scroll hook for products (browse mode only - no search term)
  const {
    data: storeProducts,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    totalCount,
  } = useWixStoreProductsInfinite(ITEMS_PER_PAGE, "", {
    enabled: !state.isSearchMode, // Only fetch when not in search mode
  });

  // Update browse products from infinite scroll data
  useEffect(() => {
    if (!state.isSearchMode) {
      updateState({ browseProducts: storeProducts });
    }
  }, [storeProducts, state.isSearchMode, updateState]);

  // Search function for products
  const searchProducts = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm || searchTerm.length < MIN_SEARCH_LENGTH) {
        updateState({
          searchResults: [],
          isFetchingSearch: false,
          hasSearched: false,
        });
        return;
      }

      updateState({ isFetchingSearch: true });

      try {
        const searchResponse = await fetchWixStoreProductsPaginated(
          0, // offset
          ITEMS_PER_PAGE, // limit
          undefined, // productIdList
          searchTerm // searchTerm
        );

        updateState({
          searchResults: searchResponse.items,
          isFetchingSearch: false,
          hasSearched: true, // Mark that we've completed a search
        });
      } catch (error) {
        console.error("❌ Search failed:", error);
        updateState({
          searchResults: [],
          isFetchingSearch: false,
          hasSearched: true, // Mark that we've attempted a search (even if failed)
        });
      }
    },
    [updateState]
  );

  // Trigger search when search term changes
  useEffect(() => {
    if (state.isSearchMode && effectiveSearchTerm) {
      const timeoutId = setTimeout(() => {
        searchProducts(effectiveSearchTerm);
      }, SEARCH_DEBOUNCE_DELAY);

      return () => clearTimeout(timeoutId);
    } else if (state.isSearchMode && !effectiveSearchTerm) {
      updateState({ searchResults: [] });
    }
  }, [effectiveSearchTerm, state.isSearchMode, searchProducts, updateState]);

  // Get the most appropriate product list based on context
  const availableProducts = useMemo(() => {
    let products: NormalizedProduct[] = [];

    if (state.isSearchMode) {
      // In search mode: only show search results
      products = state.searchResults;
    } else {
      // In browse mode: show browse products + specific product if needed
      products = [...state.browseProducts];

      // If we have a specific product that's not in browse products, add it
      if (
        state.specificProduct &&
        !products.some((p) => p.id === state.specificProduct!.id)
      ) {
        products.unshift(state.specificProduct);
      }
    }

    return products;
  }, [
    state.isSearchMode,
    state.browseProducts,
    state.searchResults,
    state.specificProduct,
  ]);

  // Find the selected product from available products or specific product
  const selectedProduct = useMemo(() => {
    if (!productId) return null;

    const fromAvailable = availableProducts.find(
      (product: NormalizedProduct) => product.id === productId
    );

    return (
      fromAvailable ||
      (state.specificProduct?.id === productId ? state.specificProduct : null)
    );
  }, [productId, availableProducts, state.specificProduct]);

  // Fetch specific product if not found in current context
  useEffect(() => {
    const shouldFetchSpecific =
      productId &&
      !selectedProduct &&
      !state.isFetchingSpecific &&
      !state.recentlySelectedId &&
      productId !== state.recentlySelectedId;

    if (shouldFetchSpecific) {
      updateState({ isFetchingSpecific: true });
      fetchWixStoreProducts([productId])
        .then((fetchedProducts) => {
          if (fetchedProducts && fetchedProducts.length > 0) {
            updateState({
              specificProduct: fetchedProducts[0],
              isFetchingSpecific: false,
            });
          } else {
            updateState({ isFetchingSpecific: false });
          }
        })
        .catch(() => {
          updateState({ isFetchingSpecific: false });
        });
    }
  }, [
    productId,
    selectedProduct,
    state.isFetchingSpecific,
    state.recentlySelectedId,
    updateState,
  ]);

  // Handle product selection
  const handleSelect = useCallback(
    (option: { id: string | number }, _sameOptionWasPicked: boolean) => {
      if (option.id === "__no_results__") return;
      const selectedProductId = String(option.id);
      // Find the selected product in current options (searchResults or browseProducts)
      const selected = state.isSearchMode
        ? state.searchResults.find((p) => p.id === selectedProductId)
        : state.browseProducts.find((p) => p.id === selectedProductId);

      changeProductId(selectedProductId);
      updateState({
        inputValue: "",
        isSearchMode: false,
        isFocused: false,
        recentlySelectedId: selectedProductId,
        specificProduct: selected || null, // <-- set immediately
        hasSearched: false, // Reset search state after selection
      });
    },
    [
      changeProductId,
      updateState,
      state.isSearchMode,
      state.searchResults,
      state.browseProducts,
    ]
  );

  // Handle input changes with debouncing
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      // Update input value immediately for responsive UI
      updateState({ inputValue: value });

      // Clear existing timeout
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      // Debounce the search mode activation
      searchDebounceRef.current = window.setTimeout(() => {
        updateState({
          isSearchMode: value.length >= MIN_SEARCH_LENGTH,
          hasSearched:
            value.length >= MIN_SEARCH_LENGTH ? state.hasSearched : false, // Reset when exiting search mode
        });
      }, SEARCH_DEBOUNCE_DELAY);
    },
    [updateState, state.hasSearched]
  );

  // Handle dropdown focus (completely clear search field to invite search)
  const handleFocus = useCallback(() => {
    updateState({
      inputValue: "",
      isSearchMode: false,
      isFocused: true,
      searchResults: [],
      hasSearched: false, // Reset search state when focusing
    });
  }, [updateState]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(() => {
    if (!state.isSearchMode && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [state.isSearchMode, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle blur
  const handleBlur = useCallback(() => {
    const updates: Partial<ProductNavigatorState> = {
      isFocused: false,
    };
    if (!state.isSearchMode || !state.inputValue.trim()) {
      updates.inputValue = selectedProduct?.name || "";
      updates.isSearchMode = false;
      updates.hasSearched = false; // Reset search state when exiting search mode
    }
    updateState(updates);
  }, [state.isSearchMode, state.inputValue, selectedProduct, updateState]);

  // Utility functions for product actions
  const handleOpenProductEditPage = useCallback(() => {
    if (!selectedProduct) {
      console.error("No selected product for edit page.");
      return;
    }
    openProductEditPage(productId ?? selectedProduct.id);
  }, [productId, selectedProduct]);

  const handleOpenLivePreview = useCallback(() => {
    if (
      !selectedProduct ||
      !selectedProduct.productPageUrl ||
      !selectedProduct.productPageUrl.base
    ) {
      addToast({
        status: "warning",
        content: t('photoStudio.productPageUnavailable', {defaultValue: "Your site is not published or the product page is unavailable."}),
      });
      return;
    }
    const { base = "", path = "" } = selectedProduct.productPageUrl;
    const fullUrl = base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
    window.open(fullUrl, "_blank");
  }, [selectedProduct, addToast]);

  // Build product options for the dropdown
  const productOptions = useMemo(() => {
    const options = availableProducts.map((product: NormalizedProduct) => {
      const imageUrl = extractImageUrl(product);
      const price = extractFormattedPrice(product);

      return listItemSelectBuilder({
        id: product.id || "",
        title: product.name || "Unnamed Product",
        label: product.name || "Unnamed Product",
        subtitle: (
          <Box gap="0px" verticalAlign="middle" key={product.id}>
            {product.sku && (
              <Box gap={0} maxWidth={"116px"} verticalAlign="middle">
                <Text
                  size="tiny"
                  light={product.id === productId}
                  secondary={product.id !== productId}
                  ellipsis
                  maxLines={1}
                >
                  {t('photoStudio.sku', {defaultValue: "SKU:"})} {product.sku}
                </Text>
                <Icons.CircleSmallFilledSmall />
              </Box>
            )}
            <Text
              size="tiny"
              light={product.id === productId}
              secondary={product.id !== productId}
            >
              {t('photoStudio.price', {defaultValue: "Price:"})} {price}
            </Text>
          </Box>
        ),
        prefix: <Image src={imageUrl} width={36} height={36} />,
        selected: product.id === productId,
      });
    });

    // Add "No results found" when searching with no results
    // Only show after API call is complete, a search has been attempted, and no results found
    if (
      state.isSearchMode &&
      effectiveSearchTerm &&
      !state.isFetchingSearch &&
      state.hasSearched &&
      state.searchResults.length === 0
    ) {
      options.push(
        listItemSelectBuilder({
          id: "__no_results__",
          title: t('photoStudio.noProductsFound', {defaultValue: "No products found for \"{{searchTerm}}\"", searchTerm: effectiveSearchTerm}),
          disabled: true,
          prefix: <Icons.Search />,
        })
      );
    }

    // console.log("📋 Built product options:", {
    //   count: options.length,
    //   isSearchMode: state.isSearchMode,
    //   searchTerm: effectiveSearchTerm,
    // });

    return options;
  }, [
    availableProducts,
    state.isSearchMode,
    effectiveSearchTerm,
    productId,
    state.isFetchingSearch,
    state.hasSearched,
  ]);

  // Determine dropdown value
  const dropdownValue = useMemo(() => {
    // If focused and no input, show empty to display placeholder
    if (state.isFocused && !state.inputValue) {
      return "";
    }

    // If we have input value (user is typing), show that
    if (state.inputValue) {
      return state.inputValue;
    }

    // If we're in search mode with no input, show empty (to show placeholder)
    if (state.isSearchMode) {
      return "";
    }

    // Otherwise show the selected product name
    return selectedProduct?.name || "";
  }, [state.inputValue, state.isSearchMode, state.isFocused, selectedProduct]);

  // Computed properties for component state
  const isComponentDisabled = useMemo(() => {
    return (
      isLoadingImages ||
      apiLoading ||
      isPublishing ||
      isLoading ||
      state.isFetchingSpecific
    );
  }, [
    isLoadingImages,
    apiLoading,
    isPublishing,
    isLoading,
    state.isFetchingSpecific,
  ]);

  const loadingStatus = useMemo(() => {
    return isLoading || state.isFetchingSpecific || state.isFetchingSearch
      ? "loading"
      : undefined;
  }, [isLoading, state.isFetchingSpecific, state.isFetchingSearch]);

  return (
    <Box
      verticalAlign="middle"
      backgroundColor="D80"
      borderRadius={8}
      width="100%"
      height="56px"
      paddingLeft={"10px"}
      paddingRight={2}
    >
      {/* Previous button - Temporarily hidden for simplified navigation */}
      {/* 
      <Box>
        <Tooltip
          content={t('photoStudio.prevProduct', {defaultValue: "Prev Product"})}
          appendTo="scrollParent"
          zIndex={9999}
          size="small"
        >
          <IconButton
            priority="tertiary"
            size={"small"}
            onClick={() => handleProductSelect(previousProductId || "")}
            disabled={
              !previousProductId ||
              isLoadingImages ||
              apiLoading ||
              isPublishing
            }
          >
            <Icons.ArrowLeft size="24" />
          </IconButton>
        </Tooltip>
      </Box>
      */}
      <Box flexGrow={1} align="center" verticalAlign="middle">
        <FormField>
          <AutoComplete
            key={productId}
            size="medium"
            border="bottomLine"
            placeholder={t('photoStudio.searchAndSelectProduct', {defaultValue: "Search and select a product..."})}
            maxHeightPixels="320px"
            textOverflow="ellipsis"
            options={productOptions}
            selectedId={productId}
            value={dropdownValue}
            disabled={isComponentDisabled}
            status={loadingStatus}
            clearButton={state.isFocused || state.isSearchMode}
            infiniteScroll={!state.isSearchMode}
            hasMore={!state.isSearchMode && hasNextPage}
            loadMore={handleInfiniteScroll}
            closeOnSelect={true}
            showOptionsIfEmptyInput={true}
            focusOnSelectedOption={false}
            highlight={true}
            markedOption={false}
            dropdownWidth="100%"
            prefix={
              selectedProduct &&
              !state.isSearchMode &&
              !state.isFocused && (
                <Box
                  minWidth={32}
                  minHeight={32}
                  width={32}
                  height={32}
                  marginRight="6px"
                  verticalAlign="middle"
                >
                  <Image
                    src={extractImageUrl(selectedProduct)}
                    width={30}
                    height={30}
                    borderRadius={"6px"}
                  />
                </Box>
              )
            }
            suffix={
              selectedProduct &&
              !state.isSearchMode &&
              !state.isFocused && (
                <Box verticalAlign="middle" minHeight={34}>
                  <Tooltip
                    content={t('photoStudio.openEditProductDashboardPage', {defaultValue: "Open Edit Product Dashboard Page"})}
                    zIndex={9999999}
                    size="small"
                  >
                    <IconButton
                      skin="dark"
                      priority="tertiary"
                      onClick={handleOpenProductEditPage}
                      size={"tiny"}
                      disabled={!selectedProduct}
                    >
                      <Icons.ExternalLink />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    content={t('photoStudio.viewLiveProductPage', {defaultValue: "View Live Product Page"})}
                    zIndex={9999999}
                    size="small"
                  >
                    <IconButton
                      skin="dark"
                      priority="tertiary"
                      onClick={handleOpenLivePreview}
                      size={"tiny"}
                      disabled={!selectedProduct}
                    >
                      <Icons.ViewExternal />
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            }
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSelect={handleSelect}
            onChange={handleInputChange}
          />
        </FormField>
      </Box>
      {/* Next button - Temporarily hidden for simplified navigation */}
      {/* 
      <Box>
        <Tooltip
          content={t('photoStudio.nextProduct', {defaultValue: "Next Product"})}
          zIndex={9999999}
          size="small"
          appendTo="scrollParent"
        >
          <IconButton
            priority="tertiary"
            size={"small"}
            onClick={() => handleProductSelect(nextProductId || "")}
            disabled={
              !nextProductId || isLoadingImages || apiLoading || isPublishing
            }
          >
            <Icons.ArrowRight size="24" />
          </IconButton>
        </Tooltip>
      </Box>
      */}
    </Box>
  );
};

export default StudioProductNavigator;
