import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  InputArea,
  SidePanel,
  Heading,
  Loader,
} from "@wix/design-system";
import { useTranslation } from "react-i18next";
import { useGeneratedImages } from "../../../hooks/useGeneratedImages";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

interface PanelFeedbackProps {
  onBackButtonClick?: () => void;
  taskId?: string | null;
}

const PanelFeedback: React.FC<PanelFeedbackProps> = ({
  onBackButtonClick,
  taskId,
}) => {
  const { t } = useTranslation();
  const { addToast } = useStatusToast();
  const { updateFileExplorerImage, updateLayerState } = usePhotoStudio();

  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const { updateGeneratedImage } = useGeneratedImages();

  const feedbackOptionsLabels = useMemo(() => ({
    overallQualityBad: t('panelFeedback.overallQualityBad', {defaultValue: "The overall quality is bad"}),
    didNotRespectPrompt: t('panelFeedback.didNotRespectPrompt', {defaultValue: "It didn't respect my prompt"}),
    notRelevantToProduct: t('panelFeedback.notRelevantToProduct', {defaultValue: "The image is not relevant to the product"}),
    imageNotClear: t('panelFeedback.imageNotClear', {defaultValue: "The image is not clear"}),
    other: t('panelFeedback.other', {defaultValue: "Other"}),
  }), [t]);

  const [feedbackOptionsState, setFeedbackOptionsState] = useState([
    {
      id: "1",
      label: feedbackOptionsLabels.overallQualityBad,
      isChecked: false,
    },
    {
      id: "2",
      label: feedbackOptionsLabels.didNotRespectPrompt,
      isChecked: false,
    },
    {
      id: "3",
      label: feedbackOptionsLabels.notRelevantToProduct,
      isChecked: false,
    },
    {
      id: "4",
      label: feedbackOptionsLabels.imageNotClear,
      isChecked: false,
    },
    {
      id: "5",
      label: feedbackOptionsLabels.other,
      isChecked: false,
    },
  ]);

  // Update labels when translations change
  React.useEffect(() => {
    setFeedbackOptionsState(prev => prev.map((opt, idx) => {
      const labels = [
        feedbackOptionsLabels.overallQualityBad,
        feedbackOptionsLabels.didNotRespectPrompt,
        feedbackOptionsLabels.notRelevantToProduct,
        feedbackOptionsLabels.imageNotClear,
        feedbackOptionsLabels.other,
      ];
      return { ...opt, label: labels[idx] };
    }));
  }, [feedbackOptionsLabels]);

  const submitFeedback = (feedback: string) => {
    if (!taskId) {
      console.warn("No taskId provided, feedback will not be submitted.");
      return;
    }
    console.log("Feedback submitted:", feedback);
    updateGeneratedImage.mutate(
      {
        taskId,
        data: {
          feedback: "BAD",
          comments: feedback,
        },
      },
      {
        onSuccess: () => {
          updateLayerState({
            feedback: "BAD",
            comments: feedback,
          });
          updateFileExplorerImage(taskId, {
            feedback: "BAD",
            comments: feedback,
          });
          addToast({
            content: t('panelFeedback.feedbackSubmittedSuccessfully', {defaultValue: "Feedback submitted successfully."}),
            status: "success",
          });
          onBackButtonClick && onBackButtonClick();
        },
        onError: (error) => {
          // Optionally show an error message
          console.error("Failed to submit feedback:", error);
        },
      }
    );
  };

  const handleOnSubmit = () => {
    const selectedFeedback = feedbackOptionsState
      .filter((opt) => opt.isChecked && opt.id !== "5")
      .map((opt) => opt.label)
      .join(", ");

    submitFeedback(
      `${selectedFeedback}${selectedFeedback && ". "}${t('panelFeedback.additional', {defaultValue: "Additional"})}: ${
        additionalFeedback ? additionalFeedback : t('modals.imageDetails.notAvailable', {defaultValue: "N/A"})
      }`
    );
  };
  // Only allow submit if at least one non-Other is checked, or if 'Other' is checked and additionalFeedback is not empty
  const isOtherChecked = feedbackOptionsState[4].isChecked;
  const canSubmit =
    feedbackOptionsState.some((opt, idx) => idx !== 4 && opt.isChecked) ||
    (isOtherChecked && additionalFeedback.trim() !== "");

  return (
    <SidePanel
      skin="floating"
      width="340px"
      onBackButtonClick={onBackButtonClick}
    >
      <SidePanel.Content noPadding>
        <Box height={6}></Box>

        <SidePanel.Field divider={false}>
          <Box gap={"SP1"} direction="vertical">
            <Heading
              size="tiny"
              weight="normal"
              dataHook="panel-feedback-heading"
            >
              {t('panelFeedback.feedback', {defaultValue: "Feedback"})}
            </Heading>
            {feedbackOptionsState.map((item) => (
              <Checkbox
                key={item.id}
                id={item.id}
                checked={item.isChecked}
                onChange={() =>
                  setFeedbackOptionsState((prev) =>
                    prev.map((opt) =>
                      opt.id === item.id
                        ? { ...opt, isChecked: !opt.isChecked }
                        : opt
                    )
                  )
                }
                disabled={updateGeneratedImage.isLoading}
                size="small"
              >
                {item.label}
              </Checkbox>
            ))}
            {feedbackOptionsState[4].isChecked && ( // Check if "Other" option is selected
              <InputArea
                placeholder={t('panelFeedback.additionalFeedbackPlaceholder', {defaultValue: "Please provide additional feedback"})}
                rows={3}
                maxLength={2000}
                resizable
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                size="small"
                disabled={updateGeneratedImage.isLoading}
              />
            )}
          </Box>
        </SidePanel.Field>

        <SidePanel.Field divider={false}>
          <Button onClick={handleOnSubmit} disabled={!canSubmit} size="small">
            {updateGeneratedImage.isLoading ? <Loader size="tiny" /> : t('panelFeedback.submit', {defaultValue: "Submit"})}
          </Button>
        </SidePanel.Field>
        <Box height={14}></Box>
      </SidePanel.Content>
    </SidePanel>
  );
};

export default PanelFeedback;
