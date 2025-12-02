import { APP_ID } from "../../constants";
import { dashboard } from "@wix/dashboard";

export async function openWixUpgradePage(instanceId?: string) {
  try {
    if (instanceId) {
      window.open(
        `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}`,
        "_blank"
      );
    } else {
      window.open(`https://www.wix.com/apps/upgrade/${APP_ID}`);
    }
  } catch {
    window.open(`https://www.wix.com/apps/upgrade/${APP_ID}`);
  }
}

export const openWixProductsPage = async (addNewProduct?: boolean) => {
  try {
    let pageUrl = await dashboard.getPageUrl({
      pageId: "0845ada2-467f-4cab-ba40-2f07c812343d",
    });
    if (addNewProduct)
      pageUrl = pageUrl.replace(
        "/wix-stores/products",
        "/store/products/new-product"
      );

    pageUrl && window.open(pageUrl, "_blank");
  } catch {
    window.open(`https://www.wix.com/apps/products/${APP_ID}`);
  }
};
