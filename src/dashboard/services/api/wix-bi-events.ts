/**
 * Wix BI Events API Service
 * 
 * This service handles sending BI events to Wix for tracking and analytics.
 * Used to report important app events like image publishing to Wix's analytics system.
 * 
 * IMPORTANT: This service routes through our backend API instead of calling Wix SDK directly.
 * The backend handles OAuth authentication with Wix and forwards events to the official Wix BI Events API.
 * 
 * Backend Endpoint: POST /bi-events
 * Frontend → Backend → Wix BI Events API (https://www.wixapis.com/apps/v1/bi-event)
 * 
 * @see https://dev.wix.com/docs/rest/app-management/bi-event/send-bi-event (Wix BI Events API)
 * @see APP_ENDPOINTS.BI_EVENTS (Our backend endpoint)
 * 
 * Authentication Flow:
 * 1. Frontend sends request with instance token (secured: true)
 * 2. Backend authenticates with Wix using OAuth (app secret + instance ID)
 * 3. Backend forwards event to official Wix BI Events API
 * 4. Backend returns success/error response to frontend
 */

import { biEvents } from "@wix/app-management";
import { APP_ENDPOINTS, APP_ID, APP_NAME } from "../../../constants";
import ApiClient from "../../utils/api-client";

// Wix BI Event API types
export interface WixBiEventData {
  [key: string]: string;
}

/**
 * Sends a BI event to Wix for analytics and tracking via our backend API
 * 
 * This function makes a POST request to our backend's /bi-events endpoint,
 * which then handles OAuth authentication and forwards the event to Wix.
 * 
 * @param request - BI event request matching Wix SDK format
 * @returns Promise<biEvents.SendBIEventResponse> - Success/error response from backend
 */
export const sendWixBiEvent = async (request: biEvents.SendBIEventRequest): Promise<biEvents.SendBIEventResponse> => {
  try {
    // console.log("Sending BI event via backend API:", request);

    return await ApiClient.request<biEvents.SendBIEventResponse>({
      url: APP_ENDPOINTS.BI_EVENTS,
      method: "POST",
      data: request,
      errorMessage: "Failed to send BI event",
      secured: true,
    });
  } catch (error) {
    console.error('Failed to send BI event via backend:', error);
    // Don't throw - BI events should not break app functionality
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

/**
 * Helper function to send a custom BI event via backend
 * 
 * Constructs a CUSTOM event with the specified name and data,
 * then routes it through our backend to reach Wix BI Events API.
 * 
 * @param customEventName - Name of the custom event (e.g., "IMAGE_PUBLISHED_TO_PRODUCT")
 * @param eventData - Optional event data as key-value pairs
 * @returns Promise<biEvents.SendBIEventResponse> - Backend response
 */
export const sendWixBiCustomEvent = async (
  customEventName: string,
  eventData?: WixBiEventData
): Promise<biEvents.SendBIEventResponse> => {
  return sendWixBiEvent({
    eventName: biEvents.EventName.CUSTOM,
    customEventName,
    eventData,
  });
};

/**
 * Helper function to send primary action performed BI event via backend
 * 
 * Sends a PRIMARY_ACTION_PERFORMED event through our backend to Wix.
 * This tracks when users complete primary actions in the app.
 * 
 * @param eventData - Optional event data as key-value pairs
 * @returns Promise<biEvents.SendBIEventResponse> - Backend response
 */
export const sendWixBiPrimaryActionEvent = async (
  eventData?: WixBiEventData
): Promise<biEvents.SendBIEventResponse> => {
  return sendWixBiEvent({
    eventName: biEvents.EventName.PRIMARY_ACTION_PERFORMED,
    eventData,
  });
};

/**
 * Specific BI event for when a user publishes an image to their product
 * This is the main event requested by the team for tracking user engagement.
 * 
 * Sends a custom "IMAGE_PUBLISHED_TO_PRODUCT" event through our backend to Wix BI Events API.
 * Includes instance ID, app details, and product information for analytics tracking.
 * 
 * Event Data Structure:
 * - instance_id: App instance identifier (MSID)
 * - app_id: App GUID from wix.config.json
 * - app_name: "AI Product Images" 
 * - product_id: Product GUID where image was published
 * 
 * @param instanceId - The app instance ID (MSID) from Recoil state
 * @param productGuid - The product GUID where the image was published
 * @returns Promise<biEvents.SendBIEventResponse> - Backend response with success/error status
 */
export const sendWixBiImagePublishedEvent = async (
  instanceId: string,
  productGuid: string,
): Promise<biEvents.SendBIEventResponse> => {
  if (!instanceId) {
    console.warn('BI Event: No instance ID provided, skipping event');
    return { success: false, error: "No instance ID provided" };
  }

  try {
    return sendWixBiCustomEvent("IMAGE_PUBLISHED_TO_PRODUCT", {
      instance_id: instanceId,
      app_id: APP_ID,
      app_name: APP_NAME,
      product_id: productGuid,
    });
  } catch (error) {
    console.error('Failed to send BI image published event:', error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};