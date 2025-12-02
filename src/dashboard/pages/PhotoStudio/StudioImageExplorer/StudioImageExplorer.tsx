import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Text,
  SidePanel,
  Layout,
  Cell,
  Tooltip,
  SectionHelper,
  InfoIcon,
  IconButton,
  Breadcrumbs,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import SelectableImagePreview from "./SelectableImagePreview";
import { GeneratedImagePreview } from "../../../../interfaces";
import { PROCESS_STATES } from "../../../../interfaces/custom/image-editor";
import { ImageUpload } from "../StudioEditor/ImageUpload";
import StudioProductNavigator from "./StudioProductNavigator";
import { useStatusToast } from "../../../services/providers/StatusToastProvider";
import { openProductEditPage } from "../../../utils";

const ImageGrid: React.FC<{
  images: GeneratedImagePreview[];
  selectedImageId: string | undefined;
  referenceImage: GeneratedImagePreview | undefined;
  processingImages: GeneratedImagePreview[];
  handleSelectingImage: (imageObj?: GeneratedImagePreview) => void;
  highlightImageId?: string;
}> = React.memo(
  ({
    images,
    selectedImageId,
    referenceImage,
    processingImages,
    handleSelectingImage,
    highlightImageId,
  }) => {
    const highlightRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [highlightImageId]);
    return (
      <Layout gap={"SP2"}>
        {images.map((media, idx) => (
          <Cell key={media.id} span={4}>
            <div ref={media.id === highlightImageId ? highlightRef : undefined}>
              <SelectableImagePreview
                selected={
                  selectedImageId === media.id ||
                  (!!referenceImage &&
                    media.imageState === PROCESS_STATES.SELECTED)
                }
                imageObj={media}
                onClick={handleSelectingImage}
                disabled={processingImages.length > 0}
              />
            </div>
          </Cell>
        ))}
      </Layout>
    );
  }
);

const StudioImageExplorer: React.FC<{
  hideProductNavigator?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
}> = React.memo(
  ({ hideProductNavigator = false, showBackButton = false, onBackClick }) => {
    const { t } = useTranslation();
    const {
      editingImage,
      referenceImage,
      editorSettings,
      selectedImages,
      selectedImageId,
      sortedFileExplorerImages,
      sortedLiveImages,
      sortedDraftImages,
      updateFileExplorerImage,
      selectExplorerImageForEditing,
      setIsLoadingCanvas,
      setEditorSettings,
      studioType,
      canAddReferenceImage,
      productId,
      currentProduct,
    } = usePhotoStudio();
    const { addToast } = useStatusToast();

    // Handle opening product edit page
    const handleOpenProductEditPage = useCallback(() => {
      if (!currentProduct) {
        console.error("No selected product for edit page.");
        return;
      }
      openProductEditPage(productId ?? currentProduct.id);
    }, [productId, currentProduct]);

    const processingImages = useMemo(
      () =>
        sortedFileExplorerImages.filter(
          (image) =>
            image.imageState === PROCESS_STATES.PROCESSING ||
            image.imageState === PROCESS_STATES.DELETING
        ),
      [sortedFileExplorerImages]
    );

    // Use sortedLiveImages and sortedDraftImages from provider, filter out uploaded state
    // Filter out images in UPLOADED or PUBLISHING state from explorer lists
    const shortedLiveImages = useMemo(() => {
      return sortedLiveImages.filter(
        (image) => image.imageState !== PROCESS_STATES.UPLOADED
      );
    }, [sortedLiveImages]);
    const shortedDraftImages = useMemo(() => {
      return sortedDraftImages.filter(
        (image) =>
          image.imageState !== PROCESS_STATES.UPLOADED &&
          image.imageState !== PROCESS_STATES.PUBLISHING
      );
    }, [sortedDraftImages]);

    const isImageFileAvailable = !!(
      editingImage?.file || editingImage?.imageUrl
    );
    const showUpload =
      isImageFileAvailable || (referenceImage && selectedImages.length > 0);

    const handleSelectingImage = useCallback(
      (imageObj?: GeneratedImagePreview) => {
        if (!imageObj) return;
        // Do not allow any action on publishing images
        if (imageObj.imageState === PROCESS_STATES.PUBLISHING) {
          addToast({
            content: t('photoStudio.imageCurrentlyPublishing', {defaultValue: "This image is currently being published."}),
            status: "warning",
          });
          return;
        }
        if (referenceImage) {
          if (
            !canAddReferenceImage() &&
            imageObj.imageState !== PROCESS_STATES.SELECTED
          ) {
            addToast({
              content: t('photoStudio.maxReferenceImages', {defaultValue: "You can select or upload up to 6 images for copy edits."}),
              status: "warning",
            });
            return;
          }
          updateFileExplorerImage(
            imageObj.id,
            {
              imageState:
                imageObj.imageState == PROCESS_STATES.SELECTED
                  ? undefined
                  : PROCESS_STATES.SELECTED,
            },
            false,
            false
          );
        } else {
          // Only set loading if image is actually changing
          if (editingImage?.imageUrl !== imageObj.imageUrl) {
            setIsLoadingCanvas(true);
          }
          selectExplorerImageForEditing(imageObj.id);
        }
      },
      [
        selectExplorerImageForEditing,
        referenceImage,
        updateFileExplorerImage,
        canAddReferenceImage,
        addToast,
        editingImage,
        setIsLoadingCanvas,
      ]
    );

    // Track the most recently added or changed image for highlight/scroll
    const prevImagesRef = useRef<GeneratedImagePreview[]>(
      sortedFileExplorerImages
    );
    const highlightImageId = useMemo(() => {
      const prevImages = prevImagesRef.current;
      let changedId: string | undefined;
      // 1. Highlight if a new image is added
      for (const img of sortedFileExplorerImages) {
        if (!prevImages.find((p) => p.id === img.id)) {
          changedId = img.id;
          break;
        }
      }
      // 2. Highlight if image state changed to PROCESSING or CONFIRM
      if (!changedId) {
        for (const img of sortedFileExplorerImages) {
          const prev = prevImages.find((p) => p.id === img.id);
          if (
            prev &&
            prev.imageState !== img.imageState &&
            (img.imageState === PROCESS_STATES.PROCESSING ||
              img.imageState === PROCESS_STATES.CONFIRM)
          ) {
            changedId = img.id;
            break;
          }
        }
      }
      return changedId;
    }, [sortedFileExplorerImages]);
    useEffect(() => {
      prevImagesRef.current = sortedFileExplorerImages;
    }, [sortedFileExplorerImages]);

    return (
      <Box direction="vertical" gap="SP2">
        {editorSettings.isFileExplorerOpen && showBackButton && onBackClick && (
          <Box marginTop={"-12px"} marginLeft={"-6px"}>
            <Breadcrumbs
              items={[
                { id: "dashboard", value: t('photoStudio.dashboard', {defaultValue: "Dashboard"}) },
                { id: "studio", value: t('photoStudio.imageStudio', {defaultValue: "Image Studio"}) },
              ]}
              size="medium"
              activeId="studio"
              skin="onGrayBackground"
              onClick={(item) => {
                if (item.id === "dashboard" && onBackClick) {
                  onBackClick();
                }
              }}
            />
          </Box>
        )}
        {!editorSettings.isFileExplorerOpen && (
          <div
            onClick={() =>
              setEditorSettings((prev) => ({
                ...prev,
                activePromptToolbar: false,
                isFileExplorerOpen: true,
              }))
            }
            style={{ zIndex: 99 }}
          >
            <Tooltip content={t('photoStudio.showProductImages', {defaultValue: "Show Product Images"})} placement="top">
              <Text skin="primary">
                <Box
                  width={"48px"}
                  height={"48px"}
                  align="center"
                  verticalAlign="middle"
                  backgroundColor={"D80"}
                  borderRadius={8}
                  cursor="pointer"
                  boxShadow="var(--wds-shadow-surface-overlay, 0 0 18px rgba(0, 6, 36, .1), 0 6px 6px rgba(0, 6, 36, .05))"
                >
                  <Icons.PhotoAlbums size="28px" />
                </Box>
              </Text>
            </Tooltip>
          </div>
        )}
        <Box
          width={`372px`}
          height="100%"
          transform={
            editorSettings.isFileExplorerOpen
              ? "scale(1) translateX(0)"
              : "scale(0) translateX(0)"
          }
          transformOrigin={"left top"}
          transition="transform 0.2s ease-in-out"
          position={editorSettings.isFileExplorerOpen ? "relative" : "absolute"}
          maxHeight={editorSettings.isFileExplorerOpen ? "100%" : "60dvh"}
          gap="SP2"
          direction="vertical"
        >
          {!hideProductNavigator && <StudioProductNavigator />}
          <SidePanel
            closeButtonProps={{
              onClick: () =>
                setEditorSettings((prev) => ({
                  ...prev,
                  activePromptToolbar: true,
                  isFileExplorerOpen: false,
                })),
            }}
            width={"372px"}
            skin="floating"
            height={
              hideProductNavigator && showBackButton
                ? "calc(100% - 36px)"
                : hideProductNavigator
                ? "100%"
                : showBackButton
                ? "calc(100% - 98px)"
                : "calc(100% - 56px)"
            }
          >
            {studioType == "product" && (
              <SidePanel.Header
                title={t('photoStudio.productImages.title', {defaultValue: "Product Images"})}
                subtitle={t('photoStudio.productImages.subtitle', {defaultValue: "Edit and update your product images."})}
                showDivider={true}
              />
            )}
            {studioType === "general" && (
              <SidePanel.Header
                title={t('photoStudio.generatedImages.title', {defaultValue: "Generated Images"})}
                subtitle={t('photoStudio.generatedImages.subtitle', {defaultValue: "Edit and update your draft images."})}
                showDivider={true}
                suffix={
                  <InfoIcon
                    size="small"
                    content={t('photoStudio.infoIconDescription', {defaultValue: "Info icon gives more information about a section."})}
                  />
                }
              />
            )}
            {referenceImage && (
              <SectionHelper
                fullWidth
                border="topBottom"
                layout="horizontal"
                skin="standard"
              >
                {t('photoStudio.copyEditHint', {defaultValue: "Select one or more images to apply Copy Edit, or click \"Upload Image\" to upload new ones."})}
              </SectionHelper>
            )}
            <SidePanel.Content noPadding>
              <Box direction="vertical" maxHeight="100%" overflow="auto">
                {studioType == "product" && (
                  <SidePanel.Section
                    title={`${t('photoStudio.liveImages', {defaultValue: "Live Images"})} (${shortedLiveImages.length})`}
                    suffix={
                      <Box
                        verticalAlign="middle"
                        direction="horizontal"
                        gap="SP1"
                      >
                        <Tooltip content={t('photoStudio.changeOrderOfLiveImages', {defaultValue: "Change order of Live Images"})}>
                          <IconButton
                            size="tiny"
                            priority="tertiary"
                            onClick={handleOpenProductEditPage}
                            disabled={!currentProduct}
                            style={{
                              backgroundColor: "transparent",
                              height: "20px",
                              transform: "translateY(3px)",
                            }}
                          >
                            <Box transform="rotate(90deg)">
                              <Icons.ChangeOrderSmall />
                            </Box>
                          </IconButton>
                        </Tooltip>

                        <InfoIcon
                          size="small"
                          content={t('photoStudio.liveImagesInfo', {defaultValue: "Please note that the images from Live Images will be directly published & visible to your customers on your live site."})}
                        />
                      </Box>
                    }
                  >
                    <Box gap={"SP2"} direction="vertical" padding={"SP4"}>
                      {shortedLiveImages.length > 0 ? (
                        <ImageGrid
                          images={shortedLiveImages}
                          selectedImageId={selectedImageId ?? undefined}
                          referenceImage={referenceImage ?? undefined}
                          processingImages={processingImages}
                          handleSelectingImage={handleSelectingImage}
                          highlightImageId={
                            highlightImageId &&
                            shortedLiveImages.some(
                              (img) => img.id === highlightImageId
                            )
                              ? highlightImageId
                              : undefined
                          }
                        />
                      ) : (
                        <Box
                          align="center"
                          verticalAlign="middle"
                          height="120px"
                          direction="vertical"
                        >
                          <Text size="small" weight="thin" textAlign="center">
                            {t('emptyStates.noLiveImages', {defaultValue: "No live images found"})}
                          </Text>
                          {shortedDraftImages.length > 0 && (
                            <Text
                              size="tiny"
                              weight="thin"
                              textAlign="center"
                              secondary
                            >
                              {t('photoStudio.noLiveImagesMessage', {defaultValue: "You can publish draft images to make them live."})}
                            </Text>
                          )}
                        </Box>
                      )}
                    </Box>
                  </SidePanel.Section>
                )}
                <SidePanel.Section
                  title={`${
                    studioType == "product" ? t('photoStudio.draftImages', {defaultValue: "Draft"}) : t('photoStudio.allDraftImages', {defaultValue: "All Draft"})
                  } Images (${shortedDraftImages.length})`}
                  suffix={
                    <InfoIcon
                      size="small"
                      content={t('photoStudio.draftImagesInfo', {defaultValue: "Draft Images are visible only to you. Feel free to experiment until you find the right fit and are ready to Publish it to the Live Images."})}
                    />
                  }
                >
                  <Box gap={"SP2"} direction="vertical" padding={"SP4"}>
                    {shortedDraftImages.length > 0 ? (
                      <ImageGrid
                        images={shortedDraftImages}
                        selectedImageId={selectedImageId ?? undefined}
                        referenceImage={referenceImage ?? undefined}
                        processingImages={processingImages}
                        handleSelectingImage={handleSelectingImage}
                        highlightImageId={
                          highlightImageId &&
                          shortedDraftImages.some(
                            (img) => img.id === highlightImageId
                          )
                            ? highlightImageId
                            : undefined
                        }
                      />
                    ) : (
                      <Box
                        align="center"
                        verticalAlign="middle"
                        height="120px"
                        direction="vertical"
                        textAlign="center"
                        padding="SP4"
                      >
                        <Text size="small" weight="thin">
                          {t('emptyStates.noDraftImagesFound', {defaultValue: "No draft images found"})}
                        </Text>
                        <Text size="tiny" weight="thin" secondary>
                          {shortedLiveImages.length > 0
                            ? t('photoStudio.draftImagesEmptyMessage', {defaultValue: "You can select live images or upload new images to start editing."})
                            : t('photoStudio.draftImagesEmptyMessageNoLive', {defaultValue: "You can upload images to start editing."})}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </SidePanel.Section>
              </Box>
            </SidePanel.Content>
            {showUpload && (
              <SidePanel.Footer>
                <Box direction="vertical" gap={1}>
                  <ImageUpload
                    label={
                      referenceImage ? t('photoStudio.uploadMultipleImages', {defaultValue: "Upload Multiple Images"}) : t('photoStudio.uploadImage', {defaultValue: "Upload Image"})
                    }
                  />
                </Box>
              </SidePanel.Footer>
            )}
          </SidePanel>
        </Box>
      </Box>
    );
  }
);

export default StudioImageExplorer;
