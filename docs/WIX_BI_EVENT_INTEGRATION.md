# Wix BI Event Integration

This document describes the implementation of Wix BI Events for tracking user engagement in the AI Product Images Photo Studio.

## Overview

The integration sends BI events to Wix when users publish images to their product pages. This allows Wix to track user engagement and provides analytics data for the AI Product Images app.

**Architecture**: Frontend → Backend API → Wix BI Events API

## Implementation Details

### Files Added/Modified

1. **`src/dashboard/services/api/wix-bi-events.ts`** (NEW)
   - Service for sending BI events through our backend API
   - Routes requests to backend `/bi-events` endpoint
   - Backend handles OAuth authentication with Wix
   - Includes helper functions for common event types
   - All functions prefixed with `sendWixBi` for clarity

2. **`src/dashboard/services/providers/PhotoStudioProvider.tsx`** (MODIFIED)
   - Added BI event trigger in the `publishImage` function
   - Sends event after successful image publishing
   - Uses `sendWixBiImagePublishedEvent()` function

3. **`src/dashboard/services/api/index.ts`** (MODIFIED)
   - Exports the new Wix BI events service

4. **`src/constants/index.ts`** (MODIFIED)
   - Added `BI_EVENTS` endpoint to `APP_ENDPOINTS`

### BI Event Details

**Event Type**: `CUSTOM`
**Custom Event Name**: `"IMAGE_PUBLISHED_TO_PRODUCT"`

**Event Data**:
```javascript
{
  instance_id: string,       // Instance ID (MSID) from Recoil state
  app_id: string,           // App GUID from wix.config.json
  app_name: "AI Product Images", // App name
  product_id: string,       // Product ID where image was published
}
```

### API Integration

**Frontend → Backend**:
```
POST {backend_url}/bi-events
Headers: 
  Authorization: {instanceToken}
  Content-Type: application/json
Body: {
  eventName: "CUSTOM",
  customEventName: "IMAGE_PUBLISHED_TO_PRODUCT",
  eventData: { ... }
}
```

**Backend → Wix**:
```
POST https://www.wixapis.com/apps/v1/bi-event
Headers:
  Authorization: Bearer {oauthAccessToken}
  Content-Type: application/json
Body: {frontend_payload}
```

**Documentation References**:
- [Send BI Event API Reference](https://dev.wix.com/docs/api-reference/app-management/bi-event/send-bi-event)
- [BI Events Introduction](https://dev.wix.com/docs/rest/app-management/bi-event/introduction)

**Frontend Authentication**: Uses the app's existing `ApiClient` with `secured: true` (instance token)
**Backend Authentication**: Backend handles OAuth authentication with Wix using app secrets
**Instance ID**: Retrieved from Recoil state (`wixSiteDataState`) which is populated by `fetchWixSiteData()`

**Frontend Headers**:
- `Content-Type: application/json`
- `Authorization: {instanceToken}`

**Backend Requirements**:
- OAuth access token generation using app secret + instance ID
- Forward BI events to official Wix BI Events API
- Handle success/error responses

## Code Flow

1. User clicks "Publish" in the Photo Studio
2. Image is successfully uploaded to the product
3. Store products are refreshed
4. **Instance ID is retrieved from Recoil state (`wixSiteDataState`)**
5. **Frontend sends BI Event to backend API** ← UPDATED
6. **Backend authenticates with Wix OAuth and forwards event** ← NEW
7. **Backend returns success/error response to frontend** ← NEW
8. Success toast is shown to user

## Backend Implementation Required

The backend needs to implement the `/bi-events` POST endpoint:

```javascript
// Cloud Functions endpoint: /bi-events
app.post('/bi-events', async (req, res) => {
  try {
    // 1. Extract instance ID from frontend auth
    const instanceId = extractInstanceFromAuth(req);
    
    // 2. Get OAuth access token for Wix BI Events API
    const accessToken = await getOAuthAccessToken(instanceId);
    
    // 3. Forward event to Wix BI Events API  
    const response = await fetch('https://www.wixapis.com/apps/v1/bi-event', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    // 4. Return success response
    res.json({ success: true, eventId: response.headers.get('event-id') });
    
  } catch (error) {
    console.error('BI Event forwarding failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Code Flow

1. User clicks "Publish" in the Photo Studio
2. Image is successfully uploaded to the product
3. Store products are refreshed
4. **Instance ID is retrieved from Recoil state (`wixSiteDataState`)**
5. **BI Event is sent to Wix using proper SDK authentication** ← UPDATED
6. Success toast is shown to user

## Error Handling

- BI events use the app's existing `ApiClient` with consistent authentication patterns
- Frontend sends events to backend `/bi-events` endpoint with instance token
- Backend handles OAuth authentication and Wix API communication
- Instance ID is retrieved from cached Recoil state (no additional API calls)
- BI events are sent asynchronously and do not block the main publish flow
- If BI event fails (frontend or backend), it logs a warning but doesn't affect user experience
- Missing instance ID is handled gracefully with warning logs
- Backend errors are returned as `{ success: false, error: "message" }`

## Requirements Met

✅ **Event triggered after successful image publish**
✅ **MSID (Instance ID) included in event data**
✅ **Product GUID included in event data**
✅ **App identification included (app_id, app_name)**
✅ **Non-blocking implementation (doesn't break app functionality)**
✅ **Proper OAuth authentication via backend**

## Team Requirements

As requested by @michaelcai:
- **Event**: Image published to product page
- **MSID**: Instance ID from app authentication ✅
- **Product GUID**: Product ID where image was published ✅
- **Backend API**: Routes through backend for proper OAuth authentication ✅

## Testing

The BI events integration can be tested in the development environment by triggering the publish flow in PhotoStudio.

**Available Functions**:
- `sendWixBiEvent()` - Generic BI event sender (routes to backend)
- `sendWixBiCustomEvent()` - Custom event helper
- `sendWixBiPrimaryActionEvent()` - Primary action event helper  
- `sendWixBiImagePublishedEvent()` - Image publish event (main implementation)

**Testing the Integration**:
1. Open PhotoStudio in development mode
2. Publish an image to a product
3. Check browser console for BI event logs
4. Check backend logs for successful event forwarding

**Expected Backend Payload**:
```json
{
  "eventName": "CUSTOM",
  "customEventName": "IMAGE_PUBLISHED_TO_PRODUCT",
  "eventData": {
    "instance_id": "actual-instance-id",
    "app_id": "898091f9-dc3b-4ee6-95c7-ff0a7864ecb7",
  "app_name": "AI Product Images", 
    "product_id": "actual-product-guid"
  }
}
```

## Production Deployment

Before deploying to production:
1. **Implement backend `/bi-events` endpoint** (see Backend Implementation section above)
2. Verify that the backend has proper OAuth credentials for Wix BI Events API
3. Test the integration in the Wix app environment
4. Monitor backend logs for successful BI event forwarding

## Cross-Reference Data Cleaning

As mentioned by @michaelcai, the BI events will be sent for all users, and Wix will clean the data by cross-referencing to check if users are actual Wix users (not developers, test sites, etc.).

## Future Enhancements

Additional BI events that could be implemented:
- `APP_DASHBOARD_LOADED` - When Photo Studio is opened
- `PRIMARY_ACTION_PERFORMED` - When AI image generation is triggered
- Custom events for other user interactions (unpublish, delete, etc.)

## References

- [Wix BI Events API Documentation](https://dev.wix.com/docs/rest/app-management/bi-event/introduction)
- [Send BI Event Method](https://dev.wix.com/docs/rest/app-management/bi-event/send-bi-event)
- [OAuth 2 Create Access Token](https://dev.wix.com/docs/rest/app-management/oauth-2/create-access-token) (for backend)
- Frontend Implementation: `src/dashboard/services/api/wix-bi-events.ts`
- Backend Endpoint: `APP_ENDPOINTS.BI_EVENTS` (`/bi-events`)