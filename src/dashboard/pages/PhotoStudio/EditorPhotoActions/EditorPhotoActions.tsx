import React, { useRef } from "react";
import {
  Box,
  Button,
  Popover,
  IconButton,
  PopoverMenu,
  Divider,
  Tooltip,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { usePopover } from "../../../hooks/usePopover";
import PanelFeedback from "./PanelFeedback";
import { GeneratedImagePreview } from "../../../../interfaces";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";

interface EditorPhotoActionsProps {
  mode?: "live" | "draft" | "multiple" | "processing" | "uploaded";
  imageObject: GeneratedImagePreview;
}

const EditorPhotoActions: React.FC<EditorPhotoActionsProps> = ({
  mode,
  imageObject,
}) => {
  const {
    showImageDetails,
    setEditingImage,
    markGeneratedImageForCopyEdit,
    selectExplorerImageForEditing,
    publishImage,
    unpublishImage,
    deleteImage,
    productId,
    apiLoading,
    apiError,
    showUnpublishModal,
    isModalContext, // Get from provider instead of props
  } = usePhotoStudio();
  const { addToast } = useStatusToast();
  const feedbackPopover = usePopover();
  const isMounted = useRef(true);

  // Defensive: Prevent all actions on publishing images
  const isPublishing = imageObject.imageState === "publishing";

  // Use tiny size for modal context to save space
  const buttonSize = isModalContext ? "tiny" : "small";
  const toolbarPadding = isModalContext ? "8px" : "SP2";

  const handleEditClick = () => {
    if (isPublishing) return;
    selectExplorerImageForEditing(imageObject.id);
  };

  const handleCopyEditClick = () => {
    if (isPublishing) return;
    markGeneratedImageForCopyEdit(imageObject.id);
  };

  const handlePublishClick = async () => {
    if (isPublishing) return;
    if (!productId) {
      addToast({
        content: "No product ID available for publishing.",
        status: "error",
      });
      return;
    }

    try {
      await publishImage(imageObject, productId);
    } catch (err: any) {
      addToast({
        content: err.message || "Failed to publish image.",
        status: "error",
      });
    }
  };

  const handleUnpublishClick = async () => {
    if (isPublishing) return;
    if (!productId) {
      addToast({
        content: "No product ID available for unpublishing.",
        status: "error",
      });
      return;
    }
    try {
      showUnpublishModal(); // open unpublish guide modal here
      // api is not ready yet
      // await unpublishImage(imageObject, productId);
    } catch (err: any) {
      addToast({
        content: err.message || "Failed to unpublish image.",
        status: "error",
      });
    }
  };

  const handleDeleteImageClick = async () => {
    if (isPublishing) return;
    try {
      if (imageObject.isLiveImage) {
        showUnpublishModal();
        return;
      }
      await deleteImage(imageObject);
    } catch (err: any) {
      addToast({
        content: err.message || "Failed to delete image.",
        status: "error",
      });
    }
  };

  const handleUploadClearClick = () => {
    if (isPublishing) return;
    setEditingImage(null);
    addToast({
      content: "Image upload cleared.",
      status: "success",
    });
  };

  const handleCopyImage = async () => {
    if (isPublishing) return;
    if (!imageObject.imageUrl) {
      if (isMounted.current)
        addToast({ content: "No image to copy.", status: "error" });
      return;
    }
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = imageObject.imageUrl;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          if (isMounted.current)
            addToast({
              content: "Could not get canvas context",
              status: "error",
            });
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new window.ClipboardItem({ "image/png": blob }),
              ]);
              if (isMounted.current) {
                addToast({
                  content: "Image copied to clipboard!",
                  status: "success",
                });
              }
            } catch (err) {
              if (isMounted.current)
                addToast({
                  content: "Clipboard write failed.",
                  status: "error",
                });
            }
          } else {
            if (isMounted.current) {
              addToast({
                content: "Failed to create image blob.",
                status: "error",
              });
            }
          }
        }, "image/png");
      };
      img.onerror = () => {
        if (isMounted.current) {
          addToast({
            content: "Failed to load image for copying.",
            status: "error",
          });
        }
      };
    } catch (err) {
      if (isMounted.current)
        addToast({ content: "Failed to copy image.", status: "error" });
    }
  };

  const handleShowGenerateInfo = () => {
    if (isPublishing) return;
    if (!imageObject) {
      addToast({
        content: "No image selected to show generate info.",
        status: "error",
      });
      return;
    }
    showImageDetails(imageObject, "detailed");
  };
  const FeedbackPopover = () => (
    <Popover
      shown={feedbackPopover.open}
      placement="top"
      appendTo="scrollParent"
      animate
      fixed={false}
      onClickOutside={feedbackPopover.closePopover}
      flip={false}
      zIndex={99999}
    >
      <Popover.Element>
        <Tooltip
          content={
            imageObject?.comments ? imageObject?.comments : "Report a problem"
          }
          appendTo="scrollParent"
          disabled={false}
        >
          <IconButton
            onClick={feedbackPopover.togglePopover}
            size={buttonSize}
            priority="secondary"
            disabled={
              !!(imageObject?.comments && imageObject?.comments?.length > 0)
            }
          >
            <Icons.ThumbsDownSmall />
          </IconButton>
        </Tooltip>
      </Popover.Element>
      <Popover.Content>
        <PanelFeedback
          onBackButtonClick={feedbackPopover.closePopover}
          taskId={imageObject.id}
        />
      </Popover.Content>
    </Popover>
  );

  return (
    <Box
      backgroundColor="D80"
      padding={toolbarPadding}
      borderRadius={12}
      width={"max-content"}
      maxWidth={600}
      gap={toolbarPadding}
    >
      {apiError && (
        <Box color="R10" marginBottom={1}>
          {apiError}
        </Box>
      )}
      {mode == "processing" && (
        <Button
          prefixIcon={<Icons.SparklesFilled />}
          onClick={handleEditClick}
          size={buttonSize}
          skin="ai"
          disabled={apiLoading}
        >
          Edit
        </Button>
      )}
      {mode == "draft" && (
        <Button
          prefixIcon={<Icons.SectionSparkles />}
          onClick={handleCopyEditClick}
          size={buttonSize}
          priority="secondary"
          skin="ai"
          disabled={apiLoading}
        >
          Copy Edits
        </Button>
      )}
      {(mode == "processing" || mode == "draft") && (
        <Divider direction="vertical" />
      )}
      {(mode == "draft" || mode == "processing") && (
        <Button
          prefixIcon={<Icons.GetStarted />}
          onClick={handlePublishClick}
          size={buttonSize}
          priority="secondary"
          disabled={apiLoading}
        >
          Publish
        </Button>
      )}
      {mode == "uploaded" && (
        <Button
          prefixIcon={<Icons.Dismiss />}
          onClick={handleUploadClearClick}
          size={buttonSize}
          priority="secondary"
          disabled={apiLoading}
        >
          Discard
        </Button>
      )}

      {(mode == "draft" || mode == "processing") && (
        <Divider direction="vertical" />
      )}
      <Box gap={"SP1"} direction="horizontal">
        {(mode == "draft" || mode == "processing") && FeedbackPopover()}
        {(mode == "draft" || mode == "processing" || mode == "live") && (
          <PopoverMenu
            textSize="small"
            triggerElement={
              <IconButton priority="secondary" size={buttonSize}>
                <Icons.More />
              </IconButton>
            }
            zIndex={1000}
            appendTo="scrollParent"
            placement="top"
          >
            {mode == "draft" && (
              <PopoverMenu.MenuItem
                prefixIcon={<Icons.PageSparklesSmall />}
                text="Generate info"
                onClick={handleShowGenerateInfo}
              />
            )}

            <PopoverMenu.MenuItem
              prefixIcon={<Icons.DuplicateSmall />}
              text="Copy image"
              onClick={handleCopyImage}
            />
            <PopoverMenu.Divider />
            {mode != "live" && (
              <PopoverMenu.MenuItem
                prefixIcon={<Icons.DeleteSmall />}
                skin="destructive"
                text="Delete"
                onClick={handleDeleteImageClick}
                disabled={apiLoading}
              />
            )}
            {mode == "live" && (
              <PopoverMenu.MenuItem
                prefixIcon={<Icons.Article />}
                onClick={handleUnpublishClick}
                disabled={apiLoading}
                text="Unpublish Guide"
              />
            )}
          </PopoverMenu>
        )}
      </Box>
    </Box>
  );
};

export default EditorPhotoActions;
