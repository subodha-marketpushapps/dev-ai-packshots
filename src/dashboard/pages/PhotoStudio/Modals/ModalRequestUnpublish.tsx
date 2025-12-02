import React, { useCallback } from "react";
import StudioModalBase from "./StudioModalBase";
import { Text, MessageModalLayout, Box, TextButton } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

import { openProductEditPage } from "../../../utils";

// import ImageEnhancedPhoto from "../../../../assets/images/image_modal-upgrade-packshot.png";

const ModalRequestUnpublish: React.FC<{ studioMode?: "modal" | "absolute" }> = ({ studioMode = "modal" }) => {
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
          primaryButtonText="Edit Product Page"
          primaryButtonProps={{
            prefixIcon: <Icons.ExternalLink />,
          }}
          secondaryButtonOnClick={handleOnClose}
          primaryButtonOnClick={handleOpenProductPage}
          secondaryButtonText="Cancel"
          title="Live Image Unpublish"
          content={
            <Text>
              At this moment you cannot delete/unpublish images directly from
              AI Product Images. Please visit the Edit Product Page and remove it
              from there.
            </Text>
          }
          footnote={
            <Box gap="SP1" verticalAlign="middle">
              <Text size="tiny">Refresh your page to see the changes.</Text>
              <TextButton size="tiny" onClick={handleRefreshProduct}>
                Refresh
              </TextButton>
            </Box>
          }
        />
      </Box>
    </StudioModalBase>
  );
};

export default ModalRequestUnpublish;
