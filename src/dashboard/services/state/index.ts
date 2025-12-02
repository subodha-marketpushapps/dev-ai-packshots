import { atom } from "recoil";
import { NormalizedProduct } from "../../utils/catalogNormalizer";

import {
  Stats,
  Settings,
  WixSiteData,
  GeneratedImage,
} from "../../../interfaces";

// import { WidgetState } from "../../../interfaces/custom/widget-state-interface";
// import { Layer } from "../../pages/PhotoStudio/LayerEditor/types";

const DEFAULT_WIX_SITE_DATA = {
  instanceId: "",
  currency: "USD",
  locale: "en-US",
  email: "",
  siteDisplayName: "",
  siteUrl: "",
  subscriptionPlan: "Basic",
};

const DEFAULT_STATISTICS = {
  totalProductsAddedToCart: 0,
  totalNumberOfCartsIncreased: 0,
  conversionRate: null,
  totalProductsPurchased: 0,
  totalRevenueByApp: 0,
  topBoughtProducts: [],
};

const DEFAULT_SETTINGS: Settings = {
  firstName: "",
  lastName: "",
  email: "",
  timezoneId: "",
  businessName: "",
  businessPhoneNumber: "",
  installPopupShow: false,
  country: "",
  isUserReviewed: false,
  openedEditor: false,
  openedPreview: false,
  openedSite: false,
};

// To store the wix site data
export const wixSiteDataState = atom<WixSiteData>({
  key: "wixSiteDataState",
  default: DEFAULT_WIX_SITE_DATA,
});

// To store the Wix Store products data
export const wixStoreProductsState = atom<NormalizedProduct[] | []>({
  key: "wixStoreProductsState",
  default: [],
});

// To store the MKP settings data
export const settingsState = atom<Settings>({
  key: "settingsState",
  default: DEFAULT_SETTINGS,
});

// To store the statistics data
export const statisticsState = atom<Stats>({
  key: "statistics",
  default: DEFAULT_STATISTICS,
});

export const activeRouteIdState = atom<number>({
  key: "activeRouteIdState",
  default: 0,
});

export const fullLoaderState = atom<boolean>({
  key: "fullLoaderState",
  default: false,
});
