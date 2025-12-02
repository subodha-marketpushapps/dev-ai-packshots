import React from "react";
import {
  Box,
  FieldSet,
  FormField,
  MultiSelect,
  SegmentedToggle,
  SidePanel,
  TextButton,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

interface PanelEnhanceSettingsProps {
  onCloseButtonClick: () => void;
}

const PanelEnhanceSettings: React.FC<PanelEnhanceSettingsProps> = ({
  onCloseButtonClick,
}) => {
  const { setPromptSettings, promptSettings } = usePhotoStudio();

  const qualityOptions = [
    { id: "clarity", value: "Image clarity" },
    { id: "sharpness", value: "Sharpness" },
    { id: "lighting", value: "Lighting" },
    { id: "shadows", value: "Shadows" },
    { id: "color", value: "Color Balance" },
  ];
  return (
    <SidePanel
      onBackButtonClick={onCloseButtonClick}
      skin="floating"
      width="312px"
    >
      <SidePanel.Content noPadding>
        <Box height={6}></Box>
        <SidePanel.Field divider={false}>
          <FormField
            label="Photo quality"
            infoContent="Add quality tags to enhance your image"
          >
            <MultiSelect
              tags={(promptSettings?.qualityTags ?? []).map((tag) => {
                const found = qualityOptions.find((opt) => opt.id === tag);
                return { id: tag, label: found ? found.value : tag };
              })}
              options={qualityOptions}
              size="small"
              customSuffix={
                (promptSettings.qualityTags ?? []).length < 5 ? (
                  <Box>
                    <TextButton size="small" prefixIcon={<Icons.Add />}>
                      Add Improvement
                    </TextButton>
                  </Box>
                ) : null
              }
              onSelect={(option) => {
                setPromptSettings((prev) => ({
                  ...prev,
                  qualityTags: [
                    ...(prev.qualityTags ?? []),
                    option.id as string,
                  ],
                }));
              }}
              onRemoveTag={(option) => {
                setPromptSettings((prev) => ({
                  ...prev,
                  qualityTags: (prev.qualityTags ?? []).filter(
                    (t) => t !== option
                  ),
                }));
              }}
            />
          </FormField>
        </SidePanel.Field>
        <SidePanel.Field divider={false}>
          <FieldSet
            legend="Product position"
            direction="horizontal"
            infoContent="Choose how the product is positioned in the image"
          >
            <Box className="segmented-toggle-mini">
              <SegmentedToggle
                size="small"
                selected={promptSettings.position}
                onClick={(selectedElement, value) => {
                  setPromptSettings((prev) => ({
                    ...prev,
                    position: value as "original" | "ai",
                  }));
                }}
              >
                <SegmentedToggle.Button value="original" size="small">
                  Original
                </SegmentedToggle.Button>
                <SegmentedToggle.Button value="ai" size="small">
                  AI Generated
                </SegmentedToggle.Button>
              </SegmentedToggle>
            </Box>
          </FieldSet>
        </SidePanel.Field>
        <SidePanel.Field divider={false}>
          <FieldSet
            legend="Photo Background"
            direction="horizontal"
            infoContent="Select the background type for your image"
          >
            <Box className="segmented-toggle-mini">
              <SegmentedToggle
                size="small"
                selected={promptSettings.background}
                onClick={(selectedElement, value) => {
                  setPromptSettings((prev) => ({
                    ...prev,
                    background: value as "original" | "color" | "ai",
                  }));
                }}
              >
                <SegmentedToggle.Button value="original" size="small">
                  Original
                </SegmentedToggle.Button>
                <SegmentedToggle.Button value="color" size="small">
                  Color
                </SegmentedToggle.Button>
                <SegmentedToggle.Button value="ai" size="small">
                  AI Generated
                </SegmentedToggle.Button>
              </SegmentedToggle>
            </Box>
          </FieldSet>
        </SidePanel.Field>
        <Box height={14}></Box>
      </SidePanel.Content>
    </SidePanel>
  );
};

export default PanelEnhanceSettings;
