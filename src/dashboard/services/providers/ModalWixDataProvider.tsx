import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";

import { NormalizedProduct } from "../../utils/catalogNormalizer";
import { WixSiteData } from "../../../interfaces";
import { fetchWixStoreProduct, fetchWixSiteData } from "../api";
import { wixSiteDataState } from "../state";
import { usePhotoStudio } from "./PhotoStudioProvider";

import {
  EmptyStateError,
  EmptyStateLoading,
} from "../../components/ui/PageLoadingStatus";

import { useFetchRecoil } from "../../hooks/useFetch";

interface WixDataContextProps {
  wixSiteData: WixSiteData | null;
  product: NormalizedProduct | null;
  isProductLoading: boolean;
  productError: string | null;
  refreshProduct: () => Promise<void>;
  refreshSiteData: () => Promise<void>;
}

const WixDataContext = createContext<WixDataContextProps | undefined>(
  undefined
);

export const useWixData = () => {
  const context = useContext(WixDataContext);
  if (context === undefined) {
    throw new Error("useWixData must be used within an WixDataProvider");
  }
  return context;
};

// Export alias for modal context usage
export const useModalWixData = useWixData;

interface WixDataProviderProps {
  children: ReactNode;
  productId?: string;
}

export const WixDataProvider: React.FC<WixDataProviderProps> = ({
  children,
  productId,
}) => {
  // State for single product
  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [isProductLoading, setIsProductLoading] = useState<boolean>(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Photo Studio hook
  const { openPhotoStudio } = usePhotoStudio();

  // Site data using Recoil
  const {
    data: wixSiteData,
    isLoading: isSiteDataFetching,
    error: siteDataFetchError,
    sendRequest: refreshFetchWixSiteData,
  } = useFetchRecoil<WixSiteData>(fetchWixSiteData, wixSiteDataState);

  // Function to fetch single product
  const refreshProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      setProductError(null);
      setIsProductLoading(false);
      return;
    }

    setIsProductLoading(true);
    setProductError(null);

    try {
      const fetchedProduct = await fetchWixStoreProduct(productId);
      // console.log("🚀 ~ WixDataProvider ~ fetchedProduct:", fetchedProduct);
      setProduct(fetchedProduct);

      // Open photo studio after successfully fetching product
      if (fetchedProduct) {
        // Pass the fetched product directly to avoid redundant lookups
        openPhotoStudio({
          type: "product",
          productId: fetchedProduct.id,
          preloadedProduct: fetchedProduct, // Pass the product directly
          isModalContext: true, // Flag for single product modal with limited space
        });
      }
    } catch (error: any) {
      setProductError(error?.message || "Failed to fetch product");
      setProduct(null);
    } finally {
      setIsProductLoading(false);
    }
  }, [productId]);

  // Fetch product when productId changes
  useEffect(() => {
    refreshProduct();
  }, [refreshProduct]);

  const isDataLoaded = !isProductLoading && !isSiteDataFetching;
  const isDataError = productError ?? siteDataFetchError;

  if (!isDataLoaded) {
    return <EmptyStateLoading loadingText="" />;
  }

  const { t } = useTranslation();

  if (isDataLoaded && isDataError) {
    return (
      <EmptyStateError
        title={t('errors.wixDataSyncError.title', {defaultValue: "We couldn't sync with the Wix Site data"})}
        subtitle={t('errors.wixDataSyncError.subtitle', {defaultValue: "Looks like there was a technical issue on our end. Wait a few minutes and try again."})}
        refreshActions={() => {
          refreshProduct();
          refreshFetchWixSiteData();
        }}
      />
    );
  }

  // Show error if no productId is provided or no product is found
  if (isDataLoaded && !productId) {
    return (
      <EmptyStateError
        title={t('emptyStates.noProductSelected.title', {defaultValue: "No product selected"})}
        subtitle={t('emptyStates.noProductSelected.subtitle', {defaultValue: "Please select a product to open the photo studio."})}
        refreshActions={() => {
          refreshFetchWixSiteData();
        }}
      />
    );
  }

  if (isDataLoaded && productId && !product) {
    return (
      <EmptyStateError
        title={t('emptyStates.productNotFound.title', {defaultValue: "Product not found"})}
        subtitle={t('emptyStates.productNotFound.subtitle', {defaultValue: "The selected product could not be found. Please try again or select a different product."})}
        refreshActions={() => {
          refreshProduct();
          refreshFetchWixSiteData();
        }}
      />
    );
  }

  return (
    <WixDataContext.Provider
      value={{
        wixSiteData,
        product,
        isProductLoading,
        productError,
        refreshProduct,
        refreshSiteData: refreshFetchWixSiteData,
      }}
    >
      {children}
    </WixDataContext.Provider>
  );
};
