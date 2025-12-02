import React, { useState, useMemo } from "react";
import {
  Page,
  Cell,
  Layout,
  Image,
  Button,
  EmptyState,
  TextButton,
} from "@wix/design-system";
import * as Icons from "@wix/wix-ui-icons-common";
import { useGeneratedImages } from "../../hooks/useGeneratedImages";
import GeneratedImagePreview from "./GeneratedImagePreview/GeneratedImagePreview";
import {
  EmptyStateError,
  EmptyStateLoading,
} from "../../components/ui/PageLoadingStatus";
import ImageNoData from "../../../assets/images/image_state-no-data.svg";
import { usePhotoStudio } from "../../services/providers/PhotoStudioProvider";
import { useRecoilValue } from "recoil";
import { wixStoreProductsState } from "../../services/state";
import { NormalizedProduct } from "../../utils/catalogNormalizer";

const IMAGES_PER_BATCH = 20;

export default function GalleryTab() {
  // --- Data & State ---
  const { getAllGeneratedImages } = useGeneratedImages();
  const storeProducts = useRecoilValue(wixStoreProductsState);
  const { openPhotoStudio } = usePhotoStudio();
  const {
    data: generatedImages,
    isLoading: isGeneratedImagesLoading,
    error: generatedImagesError,
    isFetched: isDataLoaded,
    refetch,
  } = getAllGeneratedImages();

  const sortedImages = useMemo(() => {
    if (!generatedImages) return [];
    return generatedImages.slice().sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [generatedImages]);

  const [visibleCount, setVisibleCount] = useState(IMAGES_PER_BATCH);

  // --- Handlers ---
  const handleLoadMore = () =>
    setVisibleCount((prev) => prev + IMAGES_PER_BATCH);

  const handleOnPhotoEditClick = (product: NormalizedProduct) => {
    try {
      openPhotoStudio({
        type: "product",
        productId: product.id || "",
        imageType: "draft",
      });
    } catch (error) {
      console.error("Failed to handle live preview click:", error);
      // Optionally show a toast here
    }
  };

  // --- Render helpers ---
  const renderLoading = () => (
    <EmptyStateLoading loadingText="Loading Images..." />
  );

  const renderError = () => (
    <EmptyStateError
      title="We couldn't load the Draft Image data"
      subtitle="Looks like there was a technical issue on our end. Wait a few minutes and try again."
      refreshActions={refetch}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      theme="page"
      image={
        <Image width="120px" height="120px" src={ImageNoData} transparent />
      }
      title="No Draft Images"
      subtitle="Generate your first image with Photo Studio."
    >
      <TextButton
        prefixIcon={<Icons.Add />}
        onClick={() => handleOnPhotoEditClick(storeProducts[0] as any)}
      >
        Generate Image
      </TextButton>
    </EmptyState>
  );

  const renderImages = () => (
    <>
      <Layout>
        {sortedImages.slice(0, visibleCount).map((image) => (
          <Cell span={4} key={image.id}>
            <GeneratedImagePreview image={image} />
          </Cell>
        ))}
      </Layout>
      {visibleCount < sortedImages.length && (
        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <Button onClick={handleLoadMore}>Load More</Button>
        </div>
      )}
    </>
  );

  // --- Main Render ---
  return (
    <Cell>
      <Layout>
        <Cell>
          <Page.Section
            title={`Draft Images ${generatedImages ? `(${generatedImages.length})` : ""
              }`}
            subtitle="Explore a collection of your generated images."
          />
        </Cell>
        <Cell>
          {!isDataLoaded && isGeneratedImagesLoading && renderLoading()}
          {isDataLoaded && generatedImagesError && renderError()}
          {isDataLoaded &&
            generatedImages &&
            !generatedImagesError &&
            generatedImages.length <= 0 &&
            renderEmpty()}
          {isDataLoaded &&
            generatedImages &&
            !generatedImagesError &&
            generatedImages.length > 0 &&
            renderImages()}
        </Cell>
      </Layout>
    </Cell>
  );
}
