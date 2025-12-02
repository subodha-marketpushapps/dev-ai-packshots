import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import {
  Box,
  Button,
  FormField,
  InputArea,
  Popover,
  TextButton,
  IconButton,
  Tooltip,
  Text,
  Loader,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { usePopover } from "../../../hooks/usePopover";
import PanelEditModes from "./PanelEditModes";
import PanelEnhanceSettings from "./PanelEnhanceSettings";
import PanelOutputSettings from "./PanelOutputSettings";
import ReferencePreview from "./ReferencePreview";
import OriginalImagePreview from "./OriginalImagePreview";
import FeedbackChecker from "./FeedbackChecker";
import { useBaseModal } from "../../../services/providers/BaseModalProvider";
import classes from "./EditorPromptInput.module.scss";

interface SampleComponentProps {
  onGenerateClick: () => void;
  onAddRectangle?: () => void;
  onAddCircle?: () => void;
  promptInputState: { collapsed: boolean };
  setPromptInputState: React.Dispatch<
    React.SetStateAction<{ collapsed: boolean }>
  >;
}

const EditorPromptInput: React.FC<SampleComponentProps> = ({
  onGenerateClick,
  onAddRectangle,
  onAddCircle,
  promptInputState,
  setPromptInputState,
}) => {
  // Hooks
  const {
    fileExplorerImages,
    isApiImagePreparing,
    selectedImages,
    referenceImage,
    promptSettings,
    setPromptSettings,
    outputSettings,
    selectExplorerImageForEditing,
    apiLoading,
    shouldShowFeedback,
    handleFeedbackSkip,
    handleFeedbackSubmit,
    lastApiRequest,
  } = usePhotoStudio();
  const { openFeedbackModal } = useBaseModal();
  const [isComponentActive, setIsComponentActive] = useState(false);
  const editModePopover = usePopover();
  const enhanceSettingsPopover = usePopover();
  const outputSettingsPopover = usePopover();

  // Derived state
  const showRegenerateActions = useMemo(
    () =>
      fileExplorerImages.some((img) => img.imageState === "confirm") &&
      !fileExplorerImages.some((img) => img.imageState === "processing"),
    [fileExplorerImages]
  );

  const noSelectedImage = useMemo(
    () => referenceImage && selectedImages.length <= 0,
    [referenceImage, selectedImages.length]
  );
  const promptIsEmpty = useMemo(
    () =>
      outputSettings.editingMode === "edit" && !promptSettings.prompt.trim(),
    [outputSettings.editingMode, promptSettings.prompt]
  );
  const notAllowed = noSelectedImage || promptIsEmpty;

  // Handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isComponentActive) return;
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === "TEXTAREA" ||
          (active.tagName === "INPUT" &&
            (active as HTMLInputElement).type === "text"));
      if (apiLoading) return;
      if (notAllowed) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onGenerateClick();
      } else if (e.key === "Enter" && !e.shiftKey && !isInput) {
        e.preventDefault();
        onGenerateClick();
      }
    },
    [isComponentActive, apiLoading, notAllowed, onGenerateClick]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const EditModePopover = useMemo(
    () => (
      <Popover
        shown={editModePopover.open}
        showArrow
        placement="top"
        appendTo="scrollParent"
        animate
        fixed={false}
        onClickOutside={editModePopover.closePopover}
        flip={false}
        width={300}
      >
        <Popover.Element>
          <Button
            skin="ai"
            onClick={editModePopover.togglePopover}
            size="small"
            suffixIcon={<Icons.ChevronDown />}
            priority="secondary"
            prefixIcon={
              outputSettings.editingMode === "enhance" ? (
                <Icons.Sparkles />
              ) : (
                <Icons.EditSparkles />
              )
            }
          >
            {outputSettings.editingMode === "edit"
              ? "Edit Image"
              : "Enhance Image"}
          </Button>
        </Popover.Element>
        <Popover.Content>
          <PanelEditModes onEditingModeChange={editModePopover.closePopover} />
        </Popover.Content>
      </Popover>
    ),
    [editModePopover, outputSettings.editingMode]
  );

  const DrawingTools = useMemo(
    () => (
      <Box verticalAlign="middle">
        <Tooltip content="Add rectangle hint">
          <IconButton
            size="small"
            skin="standard"
            priority="tertiary"
            onClick={onAddRectangle}
          >
            <Icons.RectangleLarge />
          </IconButton>
        </Tooltip>
        <Tooltip content="Add circle hint">
          <IconButton
            size="small"
            skin="standard"
            priority="tertiary"
            onClick={onAddCircle}
          >
            <Icons.CircleLarge />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [onAddRectangle, onAddCircle]
  );

  const EnhanceSettingsPopover = useMemo(
    () => (
      <Popover
        shown={enhanceSettingsPopover.open}
        placement="top"
        appendTo="scrollParent"
        animate
        fixed={false}
        onClickOutside={enhanceSettingsPopover.closePopover}
        flip={false}
      >
        <Popover.Element>
          <TextButton
            size="small"
            prefixIcon={<Icons.Settings />}
            onClick={enhanceSettingsPopover.togglePopover}
          >
            Enhance Settings
          </TextButton>
        </Popover.Element>
        <Popover.Content>
          <PanelEnhanceSettings
            onCloseButtonClick={enhanceSettingsPopover.closePopover}
          />
        </Popover.Content>
      </Popover>
    ),
    [enhanceSettingsPopover]
  );

  const OutputSettingsPopover = useMemo(
    () => (
      <Popover
        shown={outputSettingsPopover.open}
        showArrow
        placement="top"
        appendTo="scrollParent"
        animate
        fixed={false}
        onClickOutside={outputSettingsPopover.closePopover}
        flip={false}
      >
        <Popover.Element>
          <IconButton
            size="medium"
            skin="standard"
            priority="secondary"
            onClick={outputSettingsPopover.togglePopover}
          >
            <Icons.More />
          </IconButton>
        </Popover.Element>
        <Popover.Content>
          <PanelOutputSettings
            onCloseButtonClick={outputSettingsPopover.closePopover}
            isReferenceImageAvailable={!!referenceImage}
          />
        </Popover.Content>
      </Popover>
    ),
    [outputSettingsPopover, referenceImage]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only trigger if component is active (focused or hovered)
      if (!isComponentActive) return;

      // Only trigger if not focused on a textarea/input or if meta/ctrl+enter
      const active = document.activeElement;
      const isInput =
        active &&
        (active.tagName === "TEXTAREA" ||
          (active.tagName === "INPUT" &&
            (active as HTMLInputElement).type === "text"));
      // Prevent if API is loading
      if (apiLoading) return;
      // Prevent if prompt is empty
      if (notAllowed) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onGenerateClick();
      } else if (e.key === "Enter" && !e.shiftKey && !isInput) {
        e.preventDefault();
        onGenerateClick();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onGenerateClick, apiLoading, notAllowed, isComponentActive]);

  // Collapsed state
  if (promptInputState.collapsed) {
    return (
      <Box
        position="absolute"
        bottom={24}
        zIndex={1000}
        style={{ pointerEvents: "auto" }}
        align="center"
        width={"100%"}
      >
        <Tooltip
          content="Show Editor Panel"
          placement="top"
          size="small"
          enterDelay={1000}
        >
          <Button
            skin="ai"
            priority="primary"
            onClick={() =>
              setPromptInputState((prev) => ({ ...prev, collapsed: false }))
            }
            prefixIcon={<Icons.Sparkles />}
            suffixIcon={<Icons.ChevronUp />}
          >
            {referenceImage ? "Copy Edit" : "Prompt Input"}
          </Button>
        </Tooltip>
      </Box>
    );
  }

  // Feedback state
  if (shouldShowFeedback) {
    return (
      <Box
        backgroundColor={"D80"}
        padding={"SP4"}
        borderRadius={12}
        direction="vertical"
        width={"100%"}
        maxWidth={600}
        position="absolute"
        bottom={24}
        maxHeight={232}
        zIndex={1000}
        boxShadow="var(--wds-shadow-surface-overlay, 0 0 18px rgba(0, 6, 36, .1), 0 6px 6px rgba(0, 6, 36, .05))"
      >
        <FeedbackChecker
          onSkip={handleFeedbackSkip}
          onSubmit={() => handleFeedbackSubmit(openFeedbackModal)}
        />
      </Box>
    );
  }

  // Main editor state
  return (
    <div
      onMouseEnter={() => setIsComponentActive(true)}
      onMouseLeave={() => setIsComponentActive(false)}
      onFocus={() => setIsComponentActive(true)}
      onBlur={() => setIsComponentActive(false)}
      tabIndex={0}
      style={{
        outline: "none",
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        backgroundColor={"D80"}
        padding={"SP4"}
        borderRadius={12}
        direction="vertical"
        width={"100%"}
        maxWidth={600}
        position="absolute"
        bottom={24}
        maxHeight={232}
        zIndex={1000}
        boxShadow="var(--wds-shadow-surface-overlay, 0 0 18px rgba(0, 6, 36, .1), 0 6px 6px rgba(0, 6, 36, .05))"
      >
        {referenceImage && (
          <ReferencePreview
            image={referenceImage}
            onDismiss={(image) => {
              selectExplorerImageForEditing(image.id);
            }}
          />
        )}
        {!referenceImage && (
          <Box gap={1} width="100%">
            {showRegenerateActions &&
              lastApiRequest?.editingImage &&
              !referenceImage && (
                <OriginalImagePreview
                  lastEditImage={lastApiRequest?.editingImage}
                  onDismiss={(image) => {
                    if (image?.id) {
                      selectExplorerImageForEditing(image.id);
                    } else {
                      selectExplorerImageForEditing("");
                    }
                  }}
                />
              )}
            <Box gap={1} direction="vertical" width="100%">
              <FormField ellipsis>
                <InputArea
                  placeholder={
                    outputSettings.editingMode === "edit"
                      ? "Describe what you want to change"
                      : "Describe the scene of your background"
                  }
                  size="small"
                  maxLength={2000}
                  value={promptSettings.prompt}
                  onChange={(e) =>
                    setPromptSettings((prev) => ({
                      ...prev,
                      prompt: e.target.value,
                    }))
                  }
                  autoGrow
                  minRowsAutoGrow={2}
                  maxRowsAutoGrow={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onGenerateClick();
                    }
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      onGenerateClick();
                    }
                  }}
                />
              </FormField>
              {outputSettings.editingMode === "enhance" &&
                promptSettings.prompt.trim().length < 1 && (
                  <Box
                    backgroundColor="B60"
                    padding="SP1"
                    borderRadius={8}
                    gap="SP1"
                    color="B10"
                  >
                    <Icons.SparklesFilled size="14px" />
                    <Text size="tiny">
                      Leave this blank to let AI choose the best background for
                      your product
                    </Text>
                  </Box>
                )}
            </Box>
          </Box>
        )}
        <Box align="space-between" direction="horizontal" marginTop="SP2">
          <Box gap="SP2" verticalAlign="middle">
            {!referenceImage && EditModePopover}
            {!referenceImage &&
              outputSettings.editingMode === "enhance" &&
              EnhanceSettingsPopover}
            {/* {!referenceImage &&
              outputSettings.editingMode === "edit" &&
              DrawingTools} */}
          </Box>
          <Box gap={1} verticalAlign="middle">
            {OutputSettingsPopover}
            <Tooltip
              content={
                noSelectedImage
                  ? "You must select an image before generating."
                  : promptIsEmpty
                  ? "You must provide a prompt before generating."
                  : outputSettings.editingMode === "edit"
                  ? "Apply Changes (⌘ + ↵)"
                  : showRegenerateActions && !referenceImage
                  ? "Regenerate Image (⌘ + ↵)"
                  : "Generate Image (⌘ + ↵)"
              }
              size="small"
              disabled={false}
            >
              <IconButton
                size="medium"
                skin="ai"
                priority="primary"
                onClick={() => {
                  !isApiImagePreparing && onGenerateClick();
                }}
                title={
                  outputSettings.editingMode === "edit"
                    ? "Apply Changes (⌘ + ↵)"
                    : showRegenerateActions && !referenceImage
                    ? "Regenerate Image (⌘ + ↵)"
                    : "Generate Image (⌘ + ↵)"
                }
                disabled={notAllowed || apiLoading}
              >
                {isApiImagePreparing ? (
                  <Loader />
                ) : showRegenerateActions && !referenceImage ? (
                  <Icons.Refresh />
                ) : (
                  <Icons.ArrowUp />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box
          height={0}
          width="100%"
          align="center"
          className={classes["collapsed-icon"]}
        >
          <Tooltip
            content="Minimize Editor Panel"
            placement="bottom"
            size="small"
            enterDelay={1000}
          >
            <IconButton
              size="small"
              skin="standard"
              priority="tertiary"
              onClick={() =>
                setPromptInputState((prev) => ({ ...prev, collapsed: true }))
              }
              aria-label="Collapse Editor Panel"
            >
              <Icons.ChevronDown />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </div>
  );
};

export default EditorPromptInput;
