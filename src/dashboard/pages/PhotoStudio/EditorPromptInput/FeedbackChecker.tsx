import {
  Box,
  FacesRatingBar,
  FormField,
  Button,
  Layout,
  Cell,
} from "@wix/design-system";
import React, { useCallback, useState } from "react";
import { useIntercom } from "react-use-intercom";
import { useTranslation } from "react-i18next";

import { useBaseModal } from "../../../services/providers/BaseModalProvider";

interface FeedbackCheckerProps {
  onSkip: () => void;
  onSubmit: () => void;
}

const FeedbackChecker: React.FC<FeedbackCheckerProps> = ({
  onSkip,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { openFeedbackModal } = useBaseModal(); // Assuming useBaseModal is a custom hook to handle modal state
  type FacesRatingBarValue = 1 | 2 | 3 | 4 | 5;
  const [value, setValue] = useState<FacesRatingBarValue>(4);
  const descriptionValues: [string, string, string?, string?, string?] = [
    t('editorPromptInput.feedback.terrible', {defaultValue: "Terrible"}),
    t('editorPromptInput.feedback.bad', {defaultValue: "Bad"}),
    t('editorPromptInput.feedback.okay', {defaultValue: "Okay"}),
    t('editorPromptInput.feedback.good', {defaultValue: "Good"}),
    t('editorPromptInput.feedback.great', {defaultValue: "Great"}),
  ];

  const { showNewMessage } = useIntercom();

  const openIntercomWithContent = useCallback(
    (message: string | undefined) => showNewMessage(message),
    [showNewMessage]
  );

  const handleNegativeClick = useCallback(
    (value) => {
      if (value < 3) {
        openIntercomWithContent(
          t('editorPromptInput.feedback.negativeExperienceMessage', {defaultValue: "Hi there! I had a negative experience with the AI Product Images. Can you help me with this?"})
        );
      } else {
        openIntercomWithContent(
          t('editorPromptInput.feedback.okExperienceMessage', {defaultValue: "Hi there! I had a OK experience with the AI Product Images. But can you help me with [Reason]?"})
        );
      }
    },
    [openIntercomWithContent, t]
  );
  const onContinue = () => {
    if (value >= 4) {
      onSubmit();
      openFeedbackModal();
      return;
    } else handleNegativeClick(value);
    // Handle continue logic here
    console.log("Continued with feedback:", value);
  };

  return (
    <Layout>
      <Cell>
  <FormField label={t('feedback.overallExperience', {defaultValue: "How was your overall experience with AI Product Images?"})}>
          <FacesRatingBar
            value={value}
            descriptionValues={descriptionValues}
            onChange={(rating) => setValue(rating as FacesRatingBarValue)}
          />
        </FormField>
      </Cell>
      <Cell>
        <Box gap={"SP2"} marginTop="SP4" align="right">
          <Button priority="secondary" onClick={onSkip} size="small">
            {t('editorPromptInput.feedback.skip', {defaultValue: "Skip"})}
          </Button>
          <Button onClick={onContinue} size="small">
            {t('editorPromptInput.feedback.continue', {defaultValue: "Continue"})}
          </Button>
        </Box>
      </Cell>
    </Layout>
  );
};

export default FeedbackChecker;
