import React from "react";
import { Box, FormField, Layout, Thumbnail, Text } from "@wix/design-system";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

interface PanelEditModesProps {
  onEditingModeChange: () => void;
}

const PanelEditModes: React.FC<PanelEditModesProps> = ({
  onEditingModeChange,
}) => {
  const { outputSettings, setOutputSettings } = usePhotoStudio();
  return (
    <Box padding="12px 24px" direction="vertical" gap={"SP2"}>
      <FormField
        label="Edit Modes"
        infoContent="Choose how you want to edit your image"
      >
        <Layout cols={1} gap="12px">
          <Thumbnail
            selected={outputSettings.editingMode === "enhance"}
            onClick={() => {
              setOutputSettings({ ...outputSettings, editingMode: "enhance" });
              onEditingModeChange();
            }}
          >
            <Box padding="18px">
              <Box gap="12px" verticalAlign="middle">
                <Box direction="vertical">
                  <Text size="medium" weight="bold">
                    Enhance Image
                  </Text>
                  <Box>
                    <Text size="small" secondary>
                      Customize your photo quality and make the final output
                      match your vision.
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Thumbnail>
          <Thumbnail
            selected={outputSettings.editingMode === "edit"}
            onClick={() => {
              setOutputSettings({ ...outputSettings, editingMode: "edit" });
              onEditingModeChange();
            }}
          >
            <Box padding="18px">
              <Box gap="12px" verticalAlign="middle">
                <Box direction="vertical">
                  <Text size="medium" weight="bold">
                    Edit Image
                  </Text>
                  <Box>
                    <Text size="small" secondary>
                      Edit images with text instructions and get the desired
                      output.
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Thumbnail>
        </Layout>
      </FormField>
    </Box>
  );
};

export default PanelEditModes;
