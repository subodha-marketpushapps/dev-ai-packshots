import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import StudioModalBase from "./StudioModalBase";
import { Box, Text, MessageModalLayout } from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";

import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useIntercom } from "react-use-intercom";

import { openWixUpgradePage } from "../../../utils/open-wix-page";

import { wixSiteDataState } from "../../../services/state";
import { useRecoilValue } from "recoil";

// import ImageEnhancedPhoto from "../../../../assets/images/image_modal-upgrade-packshot.png";

const ModalRequestUpgrade: React.FC<{ studioMode?: "modal" | "absolute" }> = ({ studioMode = "modal" }) => {
  const { t } = useTranslation();
  const { hideUpgradeModal, subscription, isUpgradeModalOpen } =
    usePhotoStudio();
  const { showNewMessage } = useIntercom();
  const { instanceId } = useRecoilValue(wixSiteDataState);

  const handleOnClose = useCallback(() => {
    hideUpgradeModal();
  }, [hideUpgradeModal]);

  const openIntercomWithContent = useCallback(
    (message: string | undefined) => showNewMessage(message),
    [showNewMessage]
  );

  const handleOpenWixUpgradePage = useCallback(() => {
    openWixUpgradePage(instanceId);
  }, [instanceId]);

  if (!isUpgradeModalOpen) return null;

  const showUpgrade =
    subscription?.creditsAvailable !== undefined &&
    subscription.creditsAvailable <= 3;

  if (!isUpgradeModalOpen) return null;

  return (
    <StudioModalBase isOpen={isUpgradeModalOpen} mode={studioMode}>
      <Box align="center" verticalAlign="middle" width="100%" height="100%">
        <MessageModalLayout
          onCloseButtonClick={handleOnClose}
          primaryButtonText={t('modals.upgrade.primaryButton', {defaultValue: "Upgrade"})}
          secondaryButtonOnClick={handleOnClose}
          primaryButtonOnClick={handleOpenWixUpgradePage}
          secondaryButtonText={t('modals.upgrade.secondaryButton', {defaultValue: "Not Now"})}
          title={t('modals.upgrade.title', {defaultValue: "Upgrade Your AI Product Images Plan"})}
          content={
            <Text>
              {showUpgrade
                ? t('modals.upgrade.exhaustedCredits', {defaultValue: "You've exhausted your plan credits. Upgrade to a higher plan to generate new images."})
                : t('modals.upgrade.upgradeForMoreCredits', {defaultValue: "Upgrade your plan to get more credits."})}
            </Text>
          }
          theme="premium"
        />
      </Box>
    </StudioModalBase>
  );
};

export default ModalRequestUpgrade;
