# AI Product Images Modal - Product Editor Integration

## Overview
This modal is a standalone dashboard modal extension that integrates with Wix Store product edit pages. It provides a dedicated interface for editing individual products with AI-powered packshot generation.

## Architecture
- **Type**: Dashboard Modal Extension (External Unit)
- **Framework**: React with Wix Design System
- **Data Layer**: Wix Products API with V1/V3 compatibility
- **Providers**: Full provider stack via `withProviders()`

## Integration Flow

```
1. User visits Wix Store single product edit page (handled by Wix)
   ↓
2. User clicks "Edit in AI Product Images" button above product images (handled by Wix)
   ↓
3. Wix calls openModal() with product ID parameter (handled by Wix)
   ↓
4. This modal opens as separate unit and fetches product data
   ↓
5. Modal displays comprehensive product information
   ↓
6. User can proceed to AI Product Images editing (TODO: PhotoStudio integration)
```

## Features

### ✅ Implemented
- **Modal Parameter Reception**: Uses `dashboard.observeState()` to receive product ID
- **Universal Product Fetching**: Supports both V1 and V3 catalog APIs
- **Comprehensive Product Display**: Shows all product details including:
  - Basic info (name, SKU, brand)
  - Price information with currency formatting
  - Main product image with fallback
  - Inventory status with badges
  - Variant information
  - Product description
- **Site Information**: Displays instance ID and site details
- **Error Handling**: Proper loading states and error messages
- **Provider Integration**: Full access to app providers and services

### 🔄 Planned
- **PhotoStudio Integration**: Open PhotoStudio with selected product
- **Multi-Image Support**: Display all product images
- **Variant Selection**: Allow specific variant editing
- **Image Upload**: Direct image management from modal

## Technical Implementation

### Modal Structure
```typescript
interface ModalParams {
  productId?: string;
  productName?: string;
  [key: string]: any;
}
```

### Product Fetching
```typescript
const product = await fetchWixStoreProduct(productId);
```

### Key Components Used
- `CustomModalLayout`: Main modal container with buttons
- `Card`: Organized information sections  
- `Image`: Product image display
- `Badge`: Status indicators
- `Loader`: Loading states

### Provider Stack
The modal is wrapped with `withProviders()` which includes:
- `WixDesignSystemProvider`
- `RecoilRoot` (state management)
- `QueryClientProvider` (data fetching)
- `BaseModalProvider`
- `StatusToastProvider`
- `PhotoStudioProvider`
- `IntercomProvider`

## API Integration

### Wix Store Products API
- **Service**: `fetchWixStoreProduct(productId)`
- **Compatibility**: V1/V3 automatic detection
- **Normalization**: Unified `NormalizedProduct` interface
- **Error Handling**: Graceful fallbacks and error states

### Wix Site Data API
- **Service**: `fetchWixSiteData()`
- **Purpose**: Site context and instance identification
- **Usage**: Debugging and app identification

## Modal Configuration

### modal.json
```json
{
  "id": "af98a518-fe4f-4caf-a8bc-58e31cec0336",
  "title": "AI Product Images",
  "width": 1000,
  "height": 400
}
```

### Opening the Modal
```typescript
dashboard.openModal({
  modalId: "af98a518-fe4f-4caf-a8bc-58e31cec0336",
  params: {
    productId: "f8601a2a-4cc5-4bae-b9b6-d6736d32cdd0",
    productName: "Wireless Bluetooth Headphones"
  }
});
```

## Testing

### Local Development
1. Run `npm run dev`
2. Navigate to AI Product Images dashboard page
3. Click either "Product 1 Modal" or "Product 2 Modal" buttons
4. Modal opens with fetched product data

### Production Integration
1. The modal will be triggered from Wix Store product edit pages
2. Product ID will be passed automatically by Wix
3. Modal fetches and displays actual product data

## Error Handling

### Loading States
- Site data loading with spinner
- Product data loading with spinner
- Separate loading states for different operations

### Error States
- Site data fetch errors
- Product data fetch errors  
- Product not found scenarios
- Network connectivity issues

### Fallbacks
- Default values for missing product data
- Graceful degradation when media not available
- Error messages with actionable information

## Performance Considerations

### Optimizations
- Lazy loading of product data only when productId available
- Efficient product fetching with targeted fieldsets
- Optimized image loading with proper sizing
- Provider memoization to prevent unnecessary re-renders

### API Efficiency
- Single product fetch (not bulk operations)
- V3 fieldsets optimized for AI Product Images use case
- Cached site data to avoid repeated calls

## Next Steps

1. **PhotoStudio Integration**: Implement opening PhotoStudio with product data
2. **Image Gallery**: Show all product images in an expandable gallery
3. **Variant Support**: Add variant selection and editing capabilities
4. **Direct Upload**: Allow image upload directly from modal
5. **History Tracking**: Track editing sessions and changes
