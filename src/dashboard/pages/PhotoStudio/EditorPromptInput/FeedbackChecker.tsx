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

import { useBaseModal } from "../../../services/providers/BaseModalProvider";

interface FeedbackCheckerProps {
  onSkip: () => void;
  onSubmit: () => void;
}

const FeedbackChecker: React.FC<FeedbackCheckerProps> = ({
  onSkip,
  onSubmit,
}) => {
  const { openFeedbackModal } = useBaseModal(); // Assuming useBaseModal is a custom hook to handle modal state
  type FacesRatingBarValue = 1 | 2 | 3 | 4 | 5;
  const [value, setValue] = useState<FacesRatingBarValue>(4);
  const descriptionValues: [string, string, string?, string?, string?] = [
    "Terrible",
    "Bad",
    "Okay",
    "Good",
    "Great",
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
          `Hi there! I had a negative experience with the AI Product Images. Can you help me with this?`
        );
      } else {
        openIntercomWithContent(
          `Hi there! I had a OK experience with the AI Product Images. But can you help me with [Reason]?`
        );
      }
    },
    [openIntercomWithContent]
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
  <FormField label="How was your overall experience with AI Product Images?">
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
            Skip
          </Button>
          <Button onClick={onContinue} size="small">
            Continue
          </Button>
        </Box>
      </Cell>
    </Layout>
  );
};

export default FeedbackChecker;
