# ProductModalSelector Component

A reusable React component for selecting products from your Wix store and opening them in a modal.

## Features

- Uses products from the global Recoil state (`wixStoreProductsState`)
- Dropdown selection interface with the first N products
- Configurable modal ID
- Empty state handling
- Customizable button text and styling
- Callback functions for product selection and modal opening events

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modalId` | `string` | **Required** | The ID of the modal to open |
| `label` | `string` | `"Select Product"` | Label for the form field |
| `buttonText` | `string` | `"Open Modal"` | Text displayed on the open modal button |
| `buttonSize` | `"tiny" \| "small" \| "medium" \| "large"` | `"small"` | Size of the button and dropdown |
| `buttonPriority` | `"primary" \| "secondary"` | `"primary"` | Priority/style of the button |
| `disabled` | `boolean` | `false` | Whether the component is disabled |
| `maxProducts` | `number` | `10` | Maximum number of products to display from the state |
| `onProductSelect` | `(product: NormalizedProduct \| null) => void` | `undefined` | Callback when a product is selected |
| `onModalOpen` | `(productId: string, productName: string) => void` | `undefined` | Callback when the modal is opened |

## Usage

```tsx
import { ProductModalSelector } from "../components/dev";

function MyComponent() {
  const handleProductSelect = (product) => {
    console.log("Selected product:", product);
  };

  const handleModalOpen = (productId, productName) => {
    console.log("Opening modal for:", { productId, productName });
  };

  return (
    <ProductModalSelector
      modalId="your-modal-id-here"
      label="Choose a Product"
      buttonText="Launch Editor"
      buttonSize="large"
      buttonPriority="primary"
      maxProducts={20}
      onProductSelect={handleProductSelect}
      onModalOpen={handleModalOpen}
    />
  );
}
```

## Error Handling

The component handles:
- Empty product lists from the state
- Invalid product selections

## State Management

The component uses the global `wixStoreProductsState` from Recoil, which should be populated elsewhere in the application (typically during app initialization or route loading).

## Dependencies

- Recoil for state management (`wixStoreProductsState`)
- Wix Design System components (`Dropdown`, `Button`, `FormField`, etc.)
- Wix Dashboard API for opening modals
