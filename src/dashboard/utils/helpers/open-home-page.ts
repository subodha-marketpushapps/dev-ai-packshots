import { dashboard } from "@wix/dashboard";
const WIX_HOME_PAGE_ID = "2e96bad1-df32-47b6-942f-e3ecabd74e57"; // Page ID for Wix Home Page

export async function openHomePage() {
  try {
    const pageUrl = await dashboard.getPageUrl({
      pageId: WIX_HOME_PAGE_ID,
    });
    window.open(pageUrl, "_blank", "noopener"); // Open the home page in a new tab
  } catch (error) {
    console.error("Failed to open home page:", error);
    alert("Failed to open the Home page. Please try again later."); // User-friendly error message
  }
}
