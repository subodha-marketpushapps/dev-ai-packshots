import React, { useState, useEffect } from "react";
import { Box, Button, Dropdown, FormField, Text } from "@wix/design-system";
import { dashboard } from "@wix/dashboard";
import { useRecoilValue } from "recoil";
import { useTranslation } from "react-i18next";

import { wixStoreProductsState } from "../../services/state";
import { NormalizedProduct } from "../../utils/catalogNormalizer";

interface ProductModalSelectorProps {
  modalId: string;
  label?: string;
  buttonText?: string;
  buttonSize?: "tiny" | "small" | "medium" | "large";
  buttonPriority?: "primary" | "secondary";
  disabled?: boolean;
  maxProducts?: number;
  onProductSelect?: (product: NormalizedProduct | null) => void;
  onModalOpen?: (productId: string, productName: string) => void;
}

const ProductModalSelector: React.FC<ProductModalSelectorProps> = ({
  modalId,
  label,
  buttonText,
  buttonSize = "small",
  buttonPriority = "primary",
  disabled = false,
  maxProducts = 10,
  onProductSelect,
  onModalOpen,
}) => {
  const { t } = useTranslation();
  
  // Get products from Recoil state instead of fetching
  const allProducts = useRecoilValue(wixStoreProductsState);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  
  // Use translations with fallback to props or defaults
  const labelText = label || t('productModalSelector.selectProduct', {defaultValue: "Select Product"});
  const buttonTextTranslated = buttonText || t('productModalSelector.openModal', {defaultValue: "Open Modal"});

  // Get the first N products based on maxProducts prop
  const products = allProducts.slice(0, maxProducts);

  // Set default selected product when products are available
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      onProductSelect?.(products[0]);
    }
  }, [products, selectedProductId, onProductSelect]);

  // Handle product selection
  const handleProductSelect = (option: any) => {
    const productId = String(option?.id || "");
    setSelectedProductId(productId);

    const selectedProduct = products.find((p) => p.id === productId) || null;
    onProductSelect?.(selectedProduct);
  };

  // Handle modal opening
  const handleOpenModal = () => {
    if (!selectedProductId) return;

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    if (!selectedProduct) return;

    // Call the callback if provided
    onModalOpen?.(selectedProduct.id, selectedProduct.name);

    // Open the modal
    dashboard.openModal({
      modalId,
      params: {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
      },
    });
  };

  // Create dropdown options from products
  const productOptions = products.map((product) => ({
    id: product.id,
    value: product.name,
  }));

  // Show empty state if no products
  if (products.length === 0) {
    return (
      <Box gap={2} direction="vertical">
        <FormField label={labelText} labelSize="small">
          <Text skin="disabled" size="small">
            {t('productModalSelector.noProductsAvailable', {defaultValue: "No products available in your store"})}
          </Text>
        </FormField>
      </Box>
    );
  }

  return (
    <Box gap={2}>
      <Dropdown
        placeholder={t('productModalSelector.chooseProductPlaceholder', {defaultValue: "Choose a product..."})}
        options={productOptions}
        selectedId={selectedProductId}
        onSelect={handleProductSelect}
        disabled={disabled || products.length === 0}
        size={buttonSize}
      />
      <Button
        onClick={handleOpenModal}
        skin="standard"
        priority={buttonPriority}
        disabled={disabled || !selectedProductId}
        size={buttonSize}
      >
        {buttonTextTranslated}
      </Button>
    </Box>
  );
};

export default ProductModalSelector;
