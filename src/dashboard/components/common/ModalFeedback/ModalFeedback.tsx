import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Text,
  Image,
  Modal,
  CustomModalLayout,
  Loader,
} from "@wix/design-system";
import { useTranslation } from "react-i18next";
import imageUserFeedback from "../../../../assets/images/image_user-feedback.svg";
import classes from "./ModalFeedback.module.scss";
import { APP_ID, APP_NAME } from "../../../../constants";

const ModalFeedback: React.FC<{
  onModalClosed: () => void;
  onUserReviewed: () => void;
  isModalOpened: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [isUserClickPostBtn, setIsUserClickPostBtn] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  const scrollableRef = useRef<HTMLDivElement | null>(null);
  // Callback ref to scroll to bottom when modal opens and ref is set
  const setScrollableRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollableRef.current = node;
      if (props.isModalOpened && node) {
        node.scrollTop = node.scrollHeight;
      }
    },
    [props.isModalOpened]
  );

  const handleOnRequestClose = () => {
    props.onModalClosed();
  };

  const markAsReviewed = () => {
    setIsUserClickPostBtn(true);
    props.onUserReviewed();
  };

  const renderModalContent = () => (
    <CustomModalLayout
      onCloseButtonClick={handleOnRequestClose}
      removeContentPadding
      width="600px"
      content={
        <Box gap="8px" direction="vertical" flex={1}>
          <Box gap="24px" padding="32px 36px 12px 36px">
            <Box gap="12px" direction="vertical">
              <Box gap="24px">
                <Box gap="6px" direction="vertical" flex={1}>
                  <Text size="medium">
                    {t('modalFeedback.goodExperienceMessage', {
                      defaultValue: "We hope you've had a good experience with the app so far! We would really appreciate it if you can add a review for {{appName}}.",
                      appName: APP_NAME
                    })}
                  </Text>
                  <Text size="medium">{t('modalFeedback.helpsImmensely', {defaultValue: "It helps immensely! ♥️"})}</Text>
                </Box>
                <Image
                  width="120px"
                  height="120px"
                  src={imageUserFeedback}
                  transparent
                />
              </Box>
            </Box>
          </Box>

          <div className={classes["frame-container"]} ref={setScrollableRef}>
            {iframeLoading && (
              <Box
                position="absolute"
                bottom="-77px"
                left="0"
                width="100%"
                height={324}
                align="center"
                verticalAlign="middle"
                direction="vertical"
                gap={1}
              >
                <Loader />
              </Box>
            )}

            <iframe
              className={classes["feedback-iframe"]}
              src={`https://www.wix.com/app-market/add-review/${APP_ID}`}
              width="600px"
              height="572px"
              title={t('modalFeedback.userFeedbackReview', {defaultValue: "User Feedback Review"})}
              onLoad={() => {
                setTimeout(() => {
                  setIframeLoading(false);
                }, 1000);
              }}
              style={iframeLoading ? { visibility: "hidden" } : {}}
            ></iframe>
            {!isUserClickPostBtn && (
              <button
                className={classes["overlay-container"]}
                onClick={markAsReviewed}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    markAsReviewed();
                  }
                }}
                tabIndex={0}
              ></button>
            )}
          </div>
        </Box>
      }
    />
  );

  return (
    <Modal
      isOpen={props.isModalOpened}
      onRequestClose={handleOnRequestClose}
      shouldCloseOnOverlayClick={isUserClickPostBtn}
      zIndex={9999999}
    >
      {renderModalContent()}
    </Modal>
  );
};
export default ModalFeedback;
