import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import StudioModalBase from "./StudioModalBase";
import { Text, MessageModalLayout, Box, TextButton } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

import { openProductEditPage } from "../../../utils";

// import ImageEnhancedPhoto from "../../../../assets/images/image_modal-upgrade-packshot.png";

const ModalRequestUnpublish: React.FC<{ studioMode?: "modal" | "absolute" }> = ({ studioMode = "modal" }) => {
  const { t } = useTranslation();
  const {
    hideUnpublishModal,
    isUnpublishModalOpen,
    refreshProductImages,
    productId: contextProductId,
  } = usePhotoStudio();
  const productId = contextProductId || undefined;

  const handleOnClose = useCallback(() => {
    hideUnpublishModal();
  }, [hideUnpublishModal]);

  const handleRefreshProduct = useCallback(() => {
    refreshProductImages();
    hideUnpublishModal();
  }, [refreshProductImages, hideUnpublishModal]);

  const handleOpenProductPage = useCallback(() => {
    if (productId) {
      openProductEditPage(productId);
    }
  }, [productId]);

  if (!isUnpublishModalOpen) return null;

  return (
    <StudioModalBase isOpen={isUnpublishModalOpen} mode={studioMode}>
      <Box align="center" verticalAlign="middle" width="100%" height="100%">
        <MessageModalLayout
          onCloseButtonClick={handleOnClose}
          primaryButtonText={t('modals.unpublish.primaryButton', {defaultValue: "Edit Product Page"})}
          primaryButtonProps={{
            prefixIcon: <Icons.ExternalLink />,
          }}
          secondaryButtonOnClick={handleOnClose}
          primaryButtonOnClick={handleOpenProductPage}
          secondaryButtonText={t('modals.unpublish.secondaryButton', {defaultValue: "Cancel"})}
          title={t('modals.unpublish.title', {defaultValue: "Live Image Unpublish"})}
          content={
            <Text>
              {t('modals.unpublish.content', {defaultValue: "At this moment you cannot delete/unpublish images directly from AI Product Images. Please visit the Edit Product Page and remove it from there."})}
            </Text>
          }
          footnote={
            <Box gap="SP1" verticalAlign="middle">
              <Text size="tiny">{t('modals.unpublish.refreshNote', {defaultValue: "Refresh your page to see the changes."})}</Text>
              <TextButton size="tiny" onClick={handleRefreshProduct}>
                {t('modals.unpublish.refresh', {defaultValue: "Refresh"})}
              </TextButton>
            </Box>
          }
        />
      </Box>
    </StudioModalBase>
  );
};

export default ModalRequestUnpublish;
