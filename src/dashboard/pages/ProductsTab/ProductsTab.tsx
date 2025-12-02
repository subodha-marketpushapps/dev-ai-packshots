import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Page,
  Cell,
  Layout,
  Box,
  PopoverMenu,
  IconButton,
  Button,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import TableStoreProducts from "./TableStoreProducts";
import { openWixProductsPage } from "../../utils/open-wix-page";
import { usePhotoStudio } from "../../services/providers/PhotoStudioProvider";
import { useRecoilValue } from "recoil";
import { wixStoreProductsState } from "../../services/state";
import { NormalizedProduct } from "../../utils/catalogNormalizer";
import { useWixStoreProducts } from "../../hooks/useWixStoreProducts";

export default function ProductsTab() {
  const { t } = useTranslation();
  const { openPhotoStudio } = usePhotoStudio();
  const storeProducts = useRecoilValue(wixStoreProductsState);
  // Use the paginated hook to get real-time product availability
  const { data: availableProducts, isLoading: isProductsLoading } = useWixStoreProducts();
  
  // State to track current available products from table
  const [currentTableProducts, setCurrentTableProducts] = useState<NormalizedProduct[]>([]);
  
  // Callback to receive updates from table about current products
  const handleTableProductsUpdate = useCallback((products: NormalizedProduct[]) => {
    setCurrentTableProducts(products);
  }, []);

  const handleOnPhotoEditClick = (product: NormalizedProduct) => {
    try {
      openPhotoStudio({
        type: "product",
        productId: product.id || "",
        imageType: "draft",
      });
    } catch (error) {
      console.error("Failed to handle live preview click:", error);
      // Optionally show a toast here
    }
  };

  // Use current table products first (reflects search results), then fallback to available/cached products
  const productsToCheck = currentTableProducts.length > 0 
    ? currentTableProducts 
    : (availableProducts && availableProducts.length > 0 ? availableProducts : storeProducts);
  
  // Button is enabled if there are any products available and not in loading state
  const isGenerateButtonDisabled = isProductsLoading || !productsToCheck || productsToCheck.length === 0;
  return (
    <Cell>
      <Layout>
        <Cell>
          <Page.Section
            title={t('productsTab.title', {defaultValue: "Store Products"})}
            subtitle={t('productsTab.subtitle', {defaultValue: "Manage, Edit, and Enhance your product images to match your brand perfectly."})}
            actionsBar={
              <Box gap="SP1">
                <Button
                  size="small"
                  skin="ai"
                  prefixIcon={<Icons.Add />}
                  onClick={() => handleOnPhotoEditClick(productsToCheck[0] as any)}
                  // priority="secondary"
                  disabled={isGenerateButtonDisabled}
                >
                  {t('productsTab.generateImage', {defaultValue: "Generate Image"})}
                </Button>
                <PopoverMenu
                  triggerElement={
                    <IconButton
                      skin="inverted"
                      size="small"
                      priority="tertiary"
                    >
                      <Icons.More />
                    </IconButton>
                  }
                  textSize="small"
                >
                  <PopoverMenu.MenuItem
                    text={t('productsTab.createNewProduct', {defaultValue: "Create New Product"})}
                    prefixIcon={<Icons.Add />}
                    onClick={() => openWixProductsPage(true)}
                  />
                  <PopoverMenu.MenuItem
                    text={t('productsTab.storeProducts', {defaultValue: "Store Products"})}
                    prefixIcon={<Icons.ExternalLink />}
                    onClick={openWixProductsPage}
                  />
                </PopoverMenu>
              </Box>
            }
          />
        </Cell>
        <Cell>
          <TableStoreProducts onProductsUpdate={handleTableProductsUpdate} />
        </Cell>
      </Layout>
    </Cell>
  );
}
