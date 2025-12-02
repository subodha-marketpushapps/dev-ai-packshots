import React, { createContext, useContext, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { NormalizedProduct } from "../../utils/catalogNormalizer";
import { WixSiteData } from "../../../interfaces";
import { fetchWixStoreProducts, fetchWixSiteData } from "../api";
import { wixStoreProductsState, wixSiteDataState } from "../state";

import {
  EmptyStateError,
  EmptyStateLoading,
} from "../../components/ui/PageLoadingStatus";

import { useFetchRecoil } from "../../hooks/useFetch";

interface WixDataContextProps {
  wixSiteData: WixSiteData | null;
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

interface WixDataProviderProps {
  children: ReactNode;
}

export const WixDataProvider: React.FC<WixDataProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const {
    isLoading: isProductsFetching,
    error: productFetchError,
    sendRequest: refreshFetchWixStoreProducts,
  } = useFetchRecoil<NormalizedProduct[]>(
    fetchWixStoreProducts,
    wixStoreProductsState
  );
  const {
    data: wixSiteData,
    isLoading: isSiteDataFetching,
    error: siteDataFetchError,
    sendRequest: refreshFetchWixSiteData,
  } = useFetchRecoil<WixSiteData>(fetchWixSiteData, wixSiteDataState);

  const isDataLoaded = !isProductsFetching && !isSiteDataFetching;
  const isDataError = productFetchError ?? siteDataFetchError;

  if (!isDataLoaded) {
    return <EmptyStateLoading loadingText="" />;
  }

  if (isDataLoaded && isDataError) {
    return (
      <EmptyStateError
        title={t('errors.wixDataSyncError.title', {defaultValue: "We couldn't sync with the Wix Site data"})}
        subtitle={t('errors.wixDataSyncError.subtitle', {defaultValue: "Looks like there was a technical issue on our end. Wait a few minutes and try again."})}
        refreshActions={() => {
          refreshFetchWixStoreProducts();
          refreshFetchWixSiteData();
        }}
      />
    );
  }

  return (
    <WixDataContext.Provider value={{ wixSiteData }}>
      {children}
    </WixDataContext.Provider>
  );
};
