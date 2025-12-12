import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, TextButton, Tooltip, Text, IconButton } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useStatusToast } from "../../../../services/providers/StatusToastProvider";

import classes from "./CellWixProductName.module.scss";
import { extractFormattedPrice, openProductEditPage } from "../../../../utils";
import { NormalizedProduct } from "../../../../utils/catalogNormalizer";

interface CellProductNameProps {
  product: NormalizedProduct;
  showStoreLink?: boolean;
  showMoreInfo?: boolean;
  showMoreWithLivePreview?: boolean;
  productId?: string;
}

const CellWixProductName: React.FC<CellProductNameProps> = React.memo(
  ({
    product,
    showStoreLink = false,
    showMoreInfo = false,
    productId,
    showMoreWithLivePreview = false,
  }) => {
    const { t } = useTranslation();
    const { addToast } = useStatusToast();
    const handleOpenProductEditPage = useCallback(() => {
      openProductEditPage(productId ?? product.id);
    }, [productId, product.id]);

    const handleOpenLivePreview = useCallback(() => {
      if (!product || !product.productPageUrl || !product.productPageUrl.base) {
        addToast({
          status: "warning",
          content: t('photoStudio.productPageUnavailable', {defaultValue: "Your site is not published or the product page is unavailable."}),
        });
        return;
      }
      const { base = "", path = "" } = product.productPageUrl;
      const fullUrl = base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
      window.open(fullUrl, "_blank");
    }, [product, addToast]);

    const renderMoreInfo = () => (
      <Box direction="vertical" gap="3px" maxWidth="100%" overflow="hidden">
        <Box gap={0} verticalAlign="middle">
          {showStoreLink && (
            <TextButton
              suffixIcon={
                <Tooltip
                  zIndex={9999999}
                  content={t('photoStudio.openEditProductDashboardPage', {defaultValue: "Open Edit Product Dashboard Page"})}
                >
                  <Icons.ExternalLinkSmall />
                </Tooltip>
              }
              onClick={handleOpenProductEditPage}
              size="small"
              skin="dark"
              ellipsis
              aria-label={`Edit product: ${product.name}`}
            >
              {product.name}
            </TextButton>
          )}
          {!showStoreLink && <Text size="small">{product.name}</Text>}
          {showMoreWithLivePreview && product.productPageUrl && (
            <Tooltip content={t('photoStudio.viewLiveProductPage', {defaultValue: "View Live Product Page"})} zIndex={9999999}>
              <IconButton
                skin="dark"
                priority="tertiary"
                onClick={handleOpenLivePreview}
                size={"tiny"}
              >
                <Icons.ViewExternal />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box gap="0px" verticalAlign="middle">
          {product.sku && (
            <>
              <Text size="tiny" className={classes["gray-color"]}>
                <span>{t('photoStudio.sku', {defaultValue: "SKU:"})} {product.sku}</span>
              </Text>
              <Icons.CircleSmallFilledSmall className={classes["gray-color"]} />
            </>
          )}

          <Text size="tiny" className={classes["gray-color"]}>
            <span>{t('photoStudio.price', {defaultValue: "Price:"})} {extractFormattedPrice(product)}</span>
          </Text>
        </Box>
      </Box>
    );

    const renderDefault = () => (
      <>
        {showStoreLink ? (
          <TextButton
            suffixIcon={
              <Tooltip
                zIndex={9999999}
                content={t('photoStudio.openEditProductDashboardPage', {defaultValue: "Open Edit Product Dashboard Page"})}
              >
                <Icons.ExternalLinkSmall />
              </Tooltip>
            }
            onClick={handleOpenProductEditPage}
            size="small"
            skin="dark"
            ellipsis
            aria-label={`Edit product: ${product.name}`}
          >
            {product.name}
          </TextButton>
        ) : (
          <Text size="small">{product.name}</Text>
        )}
      </>
    );

    return (
      <Box width="100%">
        {showMoreInfo ? renderMoreInfo() : renderDefault()}
      </Box>
    );
  }
);

export default CellWixProductName;
