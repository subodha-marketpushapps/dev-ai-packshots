import React from "react";
import {
  Box,
  Cell,
  Text,
  FormField,
  Layout,
  SidePanel,
  Slider,
  Thumbnail,
  ToggleSwitch,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { AspectRatio } from "../../../../interfaces";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";

interface PanelOutputSettingsProps {
  onCloseButtonClick: () => void;
  isReferenceImageAvailable?: boolean;
}

const PanelOutputSettings: React.FC<PanelOutputSettingsProps> = ({
  onCloseButtonClick,
  isReferenceImageAvailable,
}) => {
  const { referenceImage, selectedImages, outputSettings, setOutputSettings } =
    usePhotoStudio();

  const aspectRatioOptions = [
    { id: "original", value: "Original" },
    { id: "21:9", value: "21:9" },
    { id: "16:9", value: "16:9" },
    { id: "4:3", value: "4:3" },
    { id: "3:2", value: "3:2" },
    { id: "1:1", value: "1:1" },
    { id: "2:3", value: "2:3" },
    { id: "3:4", value: "3:4" },
    { id: "9:16", value: "9:16" },
    { id: "9:21", value: "9:21" },
  ];
  return (
    <SidePanel
      onBackButtonClick={onCloseButtonClick}
      skin="floating"
      width="280px"
    >
      <SidePanel.Content noPadding>
        <Box height={isReferenceImageAvailable ? 8 : 4}></Box>
        {!isReferenceImageAvailable && (
          <SidePanel.Field>
            <FormField
              label="Images Generated"
              infoContent="Select the number of images to generate"
              charCount={outputSettings.batchSize}
            >
              <Slider
                onChange={(value) =>
                  setOutputSettings((prev) => ({
                    ...prev,
                    batchSize: value as 1 | 2 | 3 | 4,
                  }))
                }
                min={1}
                max={4}
                value={outputSettings.batchSize}
                displayMarks={false}
              />
            </FormField>
            <Box
              padding="8px 12px 8px 10px"
              position="relative"
              borderRadius={8}
              backgroundColor="B60"
              margin="4px 0"
              color="B10"
              verticalAlign="middle"
              gap={1}
            >
              <Icons.SparklesFilled size={18} />
              <Text size="tiny" weight="normal">
                Costs{" "}
                {referenceImage
                  ? selectedImages.length
                  : outputSettings.batchSize}{" "}
                Image Credits
              </Text>
            </Box>
          </SidePanel.Field>
        )}
        <SidePanel.Field>
          <FormField
            labelPlacement="right"
            label="Auto Upscaling"
            infoContent="When enabled, images smaller than 1000px will be automatically upscaled to x2 for better quality."
            stretchContent={false}
          >
            <ToggleSwitch
              checked={outputSettings.autoUpscaling}
              onChange={() =>
                setOutputSettings((prev) => ({
                  ...prev,
                  autoUpscaling: !prev.autoUpscaling,
                }))
              }
              size="medium"
            />
          </FormField>
        </SidePanel.Field>

        <SidePanel.Field divider={false}>
          <FormField
            label="Set output dimensions"
            infoContent="Select the aspect ratio for the generated images."
          >
            <Box marginTop={1}>
              <Layout gap={"12px"}>
                {aspectRatioOptions.map((option) => (
                  <Cell key={option.id} span={3}>
                    <Thumbnail
                      key={option.id}
                      title={option.value}
                      size="tiny"
                      selected={outputSettings.aspectRatio === option.id}
                      onClick={() =>
                        setOutputSettings((prev) => ({
                          ...prev,
                          aspectRatio: option.id as AspectRatio,
                        }))
                      }
                      textPosition="outside"
                      height={48}
                      image={
                        <Box
                          width={"100%"}
                          height={"100%"}
                          align="center"
                          verticalAlign="middle"
                        >
                          <Box
                            aspectRatio={
                              option.id === "original"
                                ? "1"
                                : option.id.split(":").join("/")
                            }
                            width={
                              [
                                "original",
                                "21:9",
                                "16:9",
                                "4:3",
                                "3:2",
                              ].includes(option.id)
                                ? "100%"
                                : "auto"
                            }
                            height={
                              ["1:1", "2:3", "3:4", "9:16", "9:21"].includes(
                                option.id
                              )
                                ? "100%"
                                : "auto"
                            }
                            scale="0.7"
                            backgroundColor={
                              option.id === "original" ? "B50" : "B30"
                            }
                            borderRadius={2}
                            border={"1px solid "}
                            borderColor="B30"
                          ></Box>
                        </Box>
                      }
                    />
                  </Cell>
                ))}
              </Layout>
            </Box>
          </FormField>
        </SidePanel.Field>

        <Box height={8}></Box>
      </SidePanel.Content>
    </SidePanel>
  );
};

export default PanelOutputSettings;
