import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  InputArea,
  SidePanel,
  Heading,
  Loader,
} from "@wix/design-system";
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
  const { addToast } = useStatusToast();
  const { updateFileExplorerImage, updateLayerState } = usePhotoStudio();

  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const { updateGeneratedImage } = useGeneratedImages();

  const [feedbackOptions, setFeedbackOptions] = useState([
    {
      id: "1",
      label: "The overall quality is bad",
      isChecked: false,
    },
    {
      id: "2",
      label: "It didn't respect my prompt",
      isChecked: false,
    },
    {
      id: "3",
      label: "The image is not relevant to the product",
      isChecked: false,
    },
    {
      id: "4",
      label: "The image is not clear",
      isChecked: false,
    },
    {
      id: "5",
      label: "Other",
      isChecked: false,
    },
  ]);

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
            content: "Feedback submitted successfully.",
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
    const selectedFeedback = feedbackOptions
      .filter((opt) => opt.isChecked && opt.label !== "Other")
      .map((opt) => opt.label)
      .join(", ");

    submitFeedback(
      `${selectedFeedback}${selectedFeedback && ". "}Additional: ${
        additionalFeedback ? additionalFeedback : "N/A"
      }`
    );
  };
  // Only allow submit if at least one non-Other is checked, or if 'Other' is checked and additionalFeedback is not empty
  const isOtherChecked = feedbackOptions[4].isChecked;
  const canSubmit =
    feedbackOptions.some((opt, idx) => idx !== 4 && opt.isChecked) ||
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
              Feedback
            </Heading>
            {feedbackOptions.map((item) => (
              <Checkbox
                key={item.id}
                id={item.id}
                checked={item.isChecked}
                onChange={() =>
                  setFeedbackOptions((prev) =>
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
            {feedbackOptions[4].isChecked && ( // Check if "Other" option is selected
              <InputArea
                placeholder="Please provide additional feedback"
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
            {updateGeneratedImage.isLoading ? <Loader size="tiny" /> : "Submit"}
          </Button>
        </SidePanel.Field>
        <Box height={14}></Box>
      </SidePanel.Content>
    </SidePanel>
  );
};

export default PanelFeedback;
