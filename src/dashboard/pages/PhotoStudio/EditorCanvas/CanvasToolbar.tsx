import React from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Text,
  Divider,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useTranslation } from "react-i18next";

interface CanvasToolbarProps {
  error?: string;
  drawRectMode: boolean;
  onCompare: () => void;
  setDrawRectMode: (v: boolean) => void;
  onDownload: () => void;
  onReset: () => void;
  onDelete: () => void;
  isImageDirty: boolean;
  selectedObjectType: string | null;
  showAddRectangleButton: boolean;
  showDownloadButton: boolean;
  showResetButton: boolean;
  showDeleteButton: boolean;
  showColorPalette?: boolean;
  showCompareButton?: boolean;
  onChangeObjColor?: (color: string) => void;
  colorOptions?: string[];
  maxWidth?: string | number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  error,
  drawRectMode,
  setDrawRectMode,
  onCompare,
  onDownload,
  onReset,
  onDelete,
  isImageDirty,
  selectedObjectType,
  showAddRectangleButton,
  showCompareButton,
  showDownloadButton,
  showResetButton,
  showDeleteButton,
  showColorPalette,
  onChangeObjColor,
  colorOptions = [],
  maxWidth = "100%",
}) => {
  const { t } = useTranslation();
  return (
  <Box
    direction="vertical"
    gap="SP2"
    width="100%"
    className="editing-canvas-header"
    position="absolute"
    zIndex={10}
    maxWidth={maxWidth}
    padding={"SP2"}
    pointerEvents="none"
    top={0}
  >
    {error && (
      <Box>
        <Text skin="error">{error}</Text>
      </Box>
    )}
    <Box
      gap="SP1"
      flexGrow={1}
      direction="horizontal"
      align="right"
      pointerEvents="auto"
    >
      {showAddRectangleButton && (
        <Button
          skin={drawRectMode ? "inverted" : "standard"}
          onClick={() => setDrawRectMode(!drawRectMode)}
          prefixIcon={<Icons.RectangleLarge />}
          size="tiny"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {drawRectMode ? t('canvasToolbar.drawing', {defaultValue: "Drawing..."}) : t('canvasToolbar.drawRectangle', {defaultValue: "Draw Rectangle"})}
        </Button>
      )}
      {showColorPalette &&
        selectedObjectType !== "image" &&
        onChangeObjColor &&
        colorOptions.length > 0 && (
          <Box
            gap="SP1"
            align="center"
            direction="horizontal"
            backgroundColor="D80"
            verticalAlign="middle"
            borderRadius="12px"
            padding={"2px 6px"}
          >
            {colorOptions.map((color) => (
              <Tooltip
                content={color.charAt(0).toUpperCase() + color.slice(1)}
                key={color}
                placement="top"
              >
                <div
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onChangeObjColor(color);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: color,
                    border: "2px solid #eee",
                    cursor: "pointer",
                  }}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              </Tooltip>
            ))}
          </Box>
        )}
      {showDeleteButton &&
        selectedObjectType &&
        selectedObjectType !== "image" && (
          <Tooltip content={t('canvasToolbar.deleteSelectedLayer', {defaultValue: "Delete Selected Layer"})} placement="top" size="small">
            <IconButton
              skin="inverted"
              size="tiny"
              onClick={onDelete}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={!selectedObjectType || selectedObjectType === "image"}
            >
              <Icons.DeleteFilledSmall />
            </IconButton>
          </Tooltip>
        )}
      {selectedObjectType && selectedObjectType !== "image" && (
        <Divider direction="vertical" />
      )}
      {showResetButton && isImageDirty && (
        <Button
          skin="standard"
          priority="secondary"
          size="tiny"
          onClick={onReset}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {t('canvasToolbar.resetImage', {defaultValue: "Reset Image"})}
        </Button>
      )}

      {showCompareButton && (
        <Tooltip content={t('photoStudio.compareChanges', {defaultValue: "Compare Changes"})} placement="top" size="small">
          <IconButton
            priority="secondary"
            size="tiny"
            onClick={onCompare}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Icons.LayoutTwoColumns />
          </IconButton>
        </Tooltip>
      )}
      {showDownloadButton && (
        <Tooltip
          content={t('canvasToolbar.downloadPreviewImage', {defaultValue: "Download Preview Image"})}
          placement="top"
          disabled={false}
          size="small"
        >
          <IconButton
            priority="secondary"
            size="tiny"
            onClick={onDownload}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Icons.Download />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  </Box>
  );
};

export default CanvasToolbar;
