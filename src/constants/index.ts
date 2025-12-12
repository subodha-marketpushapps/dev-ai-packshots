import wixConfig from "../../wix.config.json";
import pageConfig from "../dashboard/pages/page.json";

export const _DEV: boolean = true;

export const APP_ID = wixConfig.appId;
export const APP_NAME = "AI Product Images";
export const APP_VERSION = "1.2.1";

// Page IDs
export const DASHBOARD_PAGE_ID = pageConfig.id;

export const APP_CONSTANTS = {
  baseUrl: "https://us-east1-dev-ai-packshots.cloudfunctions.net/app",
  imageEditorEndpoint:
    "https://us-east1-dev-backend-template.cloudfunctions.net/app/image-editor",
  openAiEndpoint:
    "https://us-east1-dev-backend-template.cloudfunctions.net/app/prompts",
  generatedImagesEndpoints:
    "https://us-east1-dev-backend-template.cloudfunctions.net/app/generated-images",
};

export const APP_ENDPOINTS = {
  FLUX_EDIT: APP_CONSTANTS.baseUrl + "/image-editor/nano-banana/edit-image",
  FLUX_EDIT_DEV:
    APP_CONSTANTS.baseUrl + "/image-editor/nano-banana/edit-image/dev",

  SETTINGS: APP_CONSTANTS.baseUrl + "/settings",
  SETTINGS_UPDATE: APP_CONSTANTS.baseUrl + "/settings",
  SETTINGS_UPDATE_INSTANCE: (instanceId: string) =>
    APP_CONSTANTS.baseUrl + `/settings/update-instance/${instanceId}`,
  SETTINGS_SET_WIDGET: APP_CONSTANTS.baseUrl + "/settings/set-widget",
  SUBSCRIPTIONS: APP_CONSTANTS.baseUrl + "/subscriptions",
  WIX_WEBHOOK: APP_CONSTANTS.baseUrl + "/wix-webhook",

  PRODUCTS_ADD_MEDIA: (id: string) =>
    APP_CONSTANTS.baseUrl + `/products/${id}/add-media`,
  PRODUCTS_REPLACE_MEDIA: (id: string) =>
    APP_CONSTANTS.baseUrl + `/products/${id}/replace-media`,

  CUSTOM_CHARGES: APP_CONSTANTS.baseUrl + "/custom-charges",

  IMAGE_EDITOR_FLUX_EDIT_IMAGE:
    APP_CONSTANTS.baseUrl + "/image-editor/nano-banana/edit-image",
  IMAGE_EDITOR_FLUX_EDIT_IMAGE_DEV:
    APP_CONSTANTS.baseUrl + "/image-editor/nano-banana/edit-image/dev",

  // Templates
  TEMPLATES: APP_CONSTANTS.baseUrl + "/templates",
  TEMPLATES_ID: (id: string) => APP_CONSTANTS.baseUrl + `/templates/${id}`,

  // Prompts
  PROMPTS_OPENAI_ENHANCE_BACKGROUND:
    APP_CONSTANTS.baseUrl + "/prompts/openai/enhance-background",

  // Generated Images
  GENERATED_IMAGES_VIEW_ALL: (page: number) =>
    APP_CONSTANTS.baseUrl + `/generated-images/view/all/${page}`,
  GENERATED_IMAGES_VIEW_FILTERED: (page: number) =>
    APP_CONSTANTS.baseUrl + `/generated-images/view/filtered/${page}`,
  GENERATED_IMAGES: APP_CONSTANTS.baseUrl + "/generated-images",
  GENERATED_IMAGES_TASK_ID: (taskId: string) =>
    APP_CONSTANTS.baseUrl + `/generated-images/${taskId}`,
  GENERATED_IMAGES_UPDATE: (taskId: string) =>
    APP_CONSTANTS.baseUrl + `/generated-images/${taskId}`,
  GENERATED_IMAGES_BY_PRODUCT_ID: (productId: string) =>
    APP_CONSTANTS.baseUrl + `/generated-images/by-product-id/${productId}`,
  GENERATED_IMAGES_BY_PARENT_ID: (parentTaskId: string) =>
    APP_CONSTANTS.baseUrl + `/generated-images/by-parent-id/${parentTaskId}`,

  // Stats
  STATS: APP_CONSTANTS.baseUrl + "/stats",

  // Extra
  EXTRA_OPENAI_ENHANCE_BACKGROUND:
    APP_CONSTANTS.baseUrl + "/extra/openai/enhance-background",
  EXTRA_OPENAI_GENERATE_IMAGE:
    APP_CONSTANTS.baseUrl + "/extra/openai/generate-image",

  // Tasks
  TASKS: APP_CONSTANTS.baseUrl + "/tasks",

  // BI Events
  BI_EVENTS: APP_CONSTANTS.baseUrl + "/bi-events",
};

export const HELP_CENTER_URL =
  "https://help.marketpushapps.com/en/collections/11166423-quantity-and-volume-discounts";

export const INTERCOM_APP_ID = "h6dkwybg";

export const LOGROCKET_APP_ID = "mea0ra/ai-packshots";

export const GUIDE_JAR_IFRAMES = {
  MAIN_FLOW_URL:
    "https://www.guidejar.com/embed/d42e4a28-2a1c-4ce3-ba85-af73ed244771?type=1&controls=off",
  PUBLISH_SITE_FLOW_URL:
    "https://www.guidejar.com/embed/rn7smN63qr0lK8uZ6cxZ?type=1&controls=off",
  DISCOUNT_NAME_FLOW_URL:
    "https://www.guidejar.com/embed/fb65913a-3037-45bc-addf-9aa8afb5bfe6?type=1&controls=off",
};

export const LOCIZE_PROJECT_ID = '5de584e9-6fc4-4ea2-96e2-fb6399616cd7'; 
export const LOCIZE_API_KEY = 'b858dd8e-f982-4462-b0c9-e3f5bcb74c32';
export const LOCIZE_VERSION = 'latest';

// Re-export constants from other modules
export * from "./data";
export * from "./canvas";