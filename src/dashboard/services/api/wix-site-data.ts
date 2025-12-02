import { appInstances } from "@wix/app-management";
import { siteProperties } from "@wix/business-tools";
import { httpClient } from "@wix/essentials";

export const fetchWixSiteData = async () => {
  const DEFAULT_LOCALE = {
    country: "US",
    languageCode: "en",
  };

  const { instance, site } = await appInstances.getAppInstance();
  const properties = await getSiteProperties();

  const country = properties?.locale?.country || DEFAULT_LOCALE.country;
  const languageCode =
    properties?.locale?.languageCode || DEFAULT_LOCALE.languageCode;

  const billing = instance?.billing;
  const plan = billing?.packageName ?? "Basic";

  return {
    instanceId: instance?.instanceId ?? "",
    currency: site?.paymentCurrency ?? "",
    locale: `${languageCode}-${country}`,
    email: properties?.email ?? "",
    siteDisplayName: site?.siteDisplayName ?? "",
    siteUrl: site?.url ?? "",
    subscriptionPlan: plan ?? "Basic",
    appVersion: instance?.appVersion ?? "unknown",
  };
};

const getSiteProperties = async () => {
  try {
    const { properties } = await siteProperties.getSiteProperties();
    return properties;
  } catch (error: any) {
    try {
      const response = await httpClient.fetchWithAuth(
        "https://www.wixapis.com/site-properties/v4/properties",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const backupProperties = await response.json();
      return backupProperties.properties;
    } catch (backupError: any) {
      throw new Error("Failed to load site data.");
    }
  }
};
