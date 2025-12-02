import { dashboard } from "@wix/dashboard";
import { DASHBOARD_PAGE_ID } from "../../../constants";

export async function openDashboardPage() {
  try {
    const pageUrl = await dashboard.getPageUrl({
      pageId: DASHBOARD_PAGE_ID,
    });
    window.open(pageUrl, "_blank", "noopener"); // Open the dashboard page in a new tab
  } catch (error) {
  console.error("Failed to open AI Product Images dashboard:", error);
    throw new Error(
  "Failed to open the AI Product Images Dashboard. Please try again later."
    );
  }
}
