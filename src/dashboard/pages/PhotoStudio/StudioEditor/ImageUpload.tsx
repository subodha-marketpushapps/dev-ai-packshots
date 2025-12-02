import React from "react";
import {
  AddItem,
  Box,
  Button,
  Dropzone,
  EmptyState,
  FileUpload,
  TextButton,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";
import UploadImage from "../../../../assets/images/image_file-upload.svg";
import { v4 as uuidv4 } from "uuid";
import { Layer } from "../../../../interfaces";

const SUPPORTED_IMAGE_TYPES = [".jpeg", ".webp", ".png", ".jpg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface ImageUploadProps {
  label: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = "Upload Image",
}) => {
  const {
    referenceImage,
    updateCanvasImage,
    productId,
    setEditorSettings,
    addFileExplorerImage,
    processingImages,
    canAddReferenceImage,
    getReferenceImageCount,
  } = usePhotoStudio();
  const { addToast } = useStatusToast();

  const allowed = 6 - getReferenceImageCount();
  const isAtLimit = allowed <= 0;

  // Handle file drop (multi-image support)
  const handleFileDrop = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    let fileArray = Array.from(files);
    // console.log("🚀 ~ isAtLimit:", isAtLimit)
    if (fileArray.length > allowed) {
      addToast({
        content: `You can only add ${allowed} more image${
          allowed === 1 ? "" : "s"
        }.`,
        status: "warning",
      });
    }
    let processed = 0;
    for (let i = 0; i < fileArray.length; i++) {
      if (processed >= allowed) break;
      if (!canAddReferenceImage()) {
        addToast({
          content: "You can select or upload up to 6 images for copy edits.",
          status: "warning",
        });
        break;
      }
      const file = fileArray[i];
      if (file.size > MAX_FILE_SIZE) {
        addToast({
          content: `File ${file.name} exceeds 10 MB limit.`,
          status: "error",
        });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          addToast({
            content: `Failed to read image file ${file.name}.`,
            status: "error",
          });
          return;
        }
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          const newLayer: Layer = {
            id: uuidv4(),
            file,
            imageUrl: reader.result as string,
            width: img.naturalWidth,
            height: img.naturalHeight,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            parentTaskId: null,
            productId: productId || undefined,
            imageState: "uploaded",
          };
          if (referenceImage) {
            addFileExplorerImage({
              ...newLayer,
              imageState: "uploaded",
              createdAt: new Date().getTime(),
            });
          } else {
            updateCanvasImage(newLayer);
            setEditorSettings((prev) => ({
              ...prev,
              selectedImageId: newLayer.id,
            }));
          }
          // addToast({
          //   content: `Image ${file.name} uploaded successfully!`,
          //   status: "success",
          // });
        };
        img.onerror = () => {
          addToast({
            content: `Failed to load image ${file.name}. Please try another file.`,
            status: "error",
          });
        };
      };
      reader.onerror = () => {
        addToast({
          content: `Error reading image file ${file.name}.`,
          status: "error",
        });
      };
      reader.readAsDataURL(file);
      processed++;
    }
  };

  return (
    <Box width={"100%"}>
      <FileUpload
        onChange={handleFileDrop}
        accept={SUPPORTED_IMAGE_TYPES.join(",")}
        multiple={referenceImage ? true : false}
      >
        {({ openFileUploadDialog }) => (
          <Box width={"324px"}>
            <Button
              size="small"
              priority="secondary"
              onClick={(e) => {
                if (isAtLimit) {
                  addToast({
                    content:
                      "You have reached the maximum of 6 reference images.",
                    status: "warning",
                  });
                  return;
                }
                openFileUploadDialog(e);
              }}
              prefixIcon={<Icons.Upload />}
              data-testid="change-image-button"
              disabled={processingImages.length > 0}
              fullWidth
            >
              {label}
            </Button>
          </Box>
        )}
      </FileUpload>
    </Box>
  );
};

export const ImageDropZone: React.FC = () => {
  const {
    referenceImage,
    updateCanvasImage,
    productId,
    setEditorSettings,
    addFileExplorerImage,
    canAddReferenceImage,
    getReferenceImageCount,
    processingImages,
  } = usePhotoStudio();
  const { addToast } = useStatusToast();

  const allowed = 6 - getReferenceImageCount();

  // Handle file drop (multi-image support)
  const handleFileDrop = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    let fileArray = Array.from(files);
    if (fileArray.length > allowed) {
      addToast({
        content: `You can only add ${allowed} more image${
          allowed === 1 ? "" : "s"
        }.`,
        status: "warning",
      });
    }
    let processed = 0;
    for (let i = 0; i < fileArray.length; i++) {
      if (processed >= allowed) break;
      if (!canAddReferenceImage()) {
        addToast({
          content: "You can select or upload up to 6 images for copy edits.",
          status: "warning",
        });
        break;
      }
      const file = fileArray[i];
      if (file.size > MAX_FILE_SIZE) {
        addToast({
          content: `File ${file.name} exceeds 10 MB limit.`,
          status: "error",
        });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          addToast({
            content: `Failed to read image file ${file.name}.`,
            status: "error",
          });
          return;
        }
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          const newLayer: Layer = {
            id: uuidv4(),
            file,
            imageUrl: reader.result as string,
            width: img.naturalWidth,
            height: img.naturalHeight,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            parentTaskId: null,
            productId: productId || undefined,
            imageState: "uploaded",
          };
          if (referenceImage) {
            addFileExplorerImage({
              ...newLayer,
              imageState: "uploaded",
              createdAt: new Date().getTime(),
            });
          } else {
            updateCanvasImage(newLayer);
            setEditorSettings((prev) => ({
              ...prev,
              selectedImageId: newLayer.id,
            }));
          }
          // addToast({
          //   content: `Image ${file.name} uploaded successfully!`,
          //   status: "success",
          // });
        };
        img.onerror = () => {
          addToast({
            content: `Failed to load image ${file.name}. Please try another file.`,
            status: "error",
          });
        };
      };
      reader.onerror = () => {
        addToast({
          content: `Error reading image file ${file.name}.`,
          status: "error",
        });
      };
      reader.readAsDataURL(file);
      processed++;
    }
  };

  return (
    <Box
      maxWidth={"1080px"}
      width="60vw"
      display="block"
      margin={"auto"}
      paddingTop={referenceImage ? "28px" : "0"}
    >
      <Dropzone onDrop={handleFileDrop}>
        <Dropzone.Overlay>
          <Box
            direction="vertical"
            height="100%"
            boxSizing="border-box"
            border="dashed 1px"
            borderRadius="6px"
            borderColor="B20"
          >
            <AddItem skin="filled" size="large">
              {referenceImage
                ? "Drop your images here"
                : "Drop your image here"}
            </AddItem>
          </Box>
        </Dropzone.Overlay>
        <Dropzone.Content>
          <Box
            direction="vertical"
            border="dashed 1px"
            boxSizing="border-box"
            borderRadius="6px"
            padding="42px"
            borderColor="B20"
            height={"70vh"}
            verticalAlign="middle"
          >
            <EmptyState
              title={
                referenceImage
                  ? "Drag your images here"
                  : "Drag your image here"
              }
              subtitle={
                referenceImage
                  ? "Or upload multiple images from your computer"
                  : "Or upload an image from your computer"
              }
              image={UploadImage}
            >
              <FileUpload
                onChange={handleFileDrop}
                accept={SUPPORTED_IMAGE_TYPES.join(",")}
                multiple={referenceImage ? true : false}
              >
                {({ openFileUploadDialog }) => (
                  <TextButton
                    size="small"
                    onClick={(e: React.MouseEvent) => {
                      if (allowed <= 0 || processingImages.length > 0) {
                        addToast({
                          content:
                            "You have reached the maximum of 6 reference images or uploads are processing.",
                          status: "warning",
                        });
                        return;
                      }
                      //@ts-ignore
                      openFileUploadDialog(e);
                    }}
                    prefixIcon={<Icons.Upload />}
                    data-testid="change-image-button"
                    disabled={allowed <= 0}
                  >
                    {referenceImage
                      ? " Upload Multiple Images"
                      : " Upload Image"}
                  </TextButton>
                )}
              </FileUpload>
            </EmptyState>
          </Box>
        </Dropzone.Content>
      </Dropzone>
    </Box>
  );
};
