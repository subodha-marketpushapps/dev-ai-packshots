import React, { useState, useCallback } from "react";
import {
  SidePanel,
  FieldSet,
  Popover,
  FillPreview,
  ColorPicker,
  Swatches,
  Box,
  Slider,
  NumberInput,
  Input,
} from "@wix/design-system";

interface InputColorOpacityProps {
  label: string;
  infoContent: string;
  value: string;
  onChange: (color: string | object) => void;
  noPadding?: boolean;
  labelSize?: "small" | "tiny";
}

const InputColorOpacity: React.FC<InputColorOpacityProps> = ({
  label,
  infoContent,
  value,
  onChange,
  noPadding = false,
  labelSize = "small",
}) => {
  const colorHex = value.slice(0, 7);
  const [isPopoverShown, setIsPopoverShown] = useState(false);
  const [previousColor, setPreviousColor] = useState(colorHex);
  const [opacity, setOpacity] = useState(() => {
    const opacityHex = value.slice(7, 9);
    return parseInt(opacityHex, 16) || 100;
  });
  const [currentColor, setCurrentColor] = useState(colorHex);

  const presets = ["#008069", "#24D366", "#113E2D", "#E5DDD5"];

  // Helper function to combine color and opacity into a single hex value
  const combineColorAndOpacity = useCallback(
    (color: string, opacity: number) => {
      const baseColor = color.slice(0, 7);
      const alphaHex = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, "0");
      return `#${baseColor.replace("#", "")}${alphaHex}`;
    },
    []
  );

  // Handle color and opacity changes
  const handleColorChange = useCallback(
    (color: string, newOpacity: number = opacity) => {
      const updatedColor = combineColorAndOpacity(color, newOpacity);
      onChange(updatedColor);
      setCurrentColor(updatedColor);
    },
    [combineColorAndOpacity, onChange, opacity]
  );

  // Revert to the previous color and opacity
  const revertToPreviousColor = useCallback(() => {
    const opacityHex =
      previousColor.length > 7 ? previousColor.slice(7, 9) : "FF";
    const previousOpacity =
      Math.round((parseInt(opacityHex, 16) / 255) * 100) || 100;
    setOpacity(previousOpacity);
    handleColorChange(previousColor.slice(0, 7), previousOpacity);
  }, [previousColor, handleColorChange]);

  const renderController = () => {
    return (
      <FieldSet
        legend={label}
        legendSize={labelSize}
        legendPlacement="top"
        alignment="center"
        columns="30px auto 67px"
        infoContent={infoContent}
      >
        {/* Color Picker Popover */}
        <Popover
          showArrow
          shown={isPopoverShown}
          appendTo="window"
          onClick={() => {
            setIsPopoverShown(!isPopoverShown);
            setPreviousColor(currentColor);
          }}
          onClickOutside={() => setIsPopoverShown(false)}
        >
          <Popover.Element>
            <FillPreview fill={currentColor} aspectRatio={1} />
          </Popover.Element>
          <Popover.Content>
            <ColorPicker
              value={currentColor.slice(0, 7)}
              onCancel={() => {
                setIsPopoverShown(false);
                revertToPreviousColor();
              }}
              onConfirm={(value) => {
                setIsPopoverShown(false);
                handleColorChange(value.hex());
              }}
              onChange={(value) => {
                handleColorChange(value.hex());
              }}
            >
              {({ changeColor }: { changeColor: (color: string) => void }) => (
                <Swatches
                  colors={presets}
                  onClick={(presetColor: string) => {
                    changeColor(presetColor);
                  }}
                />
              )}
            </ColorPicker>
          </Popover.Content>
        </Popover>

        {/* Opacity Slider */}
        <Box margin="0 8px">
          <Slider
            gradientColor={currentColor.slice(0, 7)}
            min={0}
            max={100}
            displayMarks={false}
            onChange={(newOpacity) => {
              const opacityValue = Array.isArray(newOpacity)
                ? newOpacity[0]
                : newOpacity;
              setOpacity(opacityValue);
              handleColorChange(currentColor, opacityValue);
            }}
            value={opacity}
          />
        </Box>

        {/* Opacity Number Input */}
        <NumberInput
          value={opacity}
          min={0}
          max={100}
          onChange={(newOpacity) => {
            const opacityValue = newOpacity ?? 0;
            setOpacity(opacityValue);
            handleColorChange(currentColor, opacityValue);
          }}
          suffix={<Input.Affix>%</Input.Affix>}
          size="small"
          hideStepper
        />
      </FieldSet>
    );
  };

  if (noPadding) {
    return renderController();
  }
  return <SidePanel.Field>{renderController()}</SidePanel.Field>;
};

export default InputColorOpacity;
