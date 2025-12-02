import React, { type FC, useCallback } from "react";
import { Box, ImageViewer } from "@wix/design-system";
import { dashboard } from "@wix/dashboard";
import { media } from "@wix/sdk";

interface Props {
  imageUrl: string;
  imageTitle?: string;
  defaultImageUrl?: string;
  onChange: (imageUrl: string, imageTitle: string) => void;
  frameWidth?: number | string;
  frameHeight?: number | string;
  requestOptions?: {
    width?: number;
    height?: number;
  };
}

export const ImagePicker: FC<Props> = ({
  onChange,
  imageUrl,
  defaultImageUrl = "",
  frameWidth = "100%",
  frameHeight = "100px",
  requestOptions = {},
}) => {
  const handleMediaManager = useCallback(async () => {
    try {
      const response = await dashboard.openMediaManager();
      if (!response?.items[0]) return;

      const { url, displayName, media: wixMediaObj } = response.items[0];
      let imageUrl = url ?? "";
      const rawWixImage = wixMediaObj?.image?.image;
      const isRequestToOptimizeImage =
        requestOptions?.width && requestOptions?.height;

      if (isRequestToOptimizeImage && rawWixImage) {
        try {
          imageUrl = media.getScaledToFillImageUrl(
            rawWixImage,
            requestOptions?.width ?? 100,
            requestOptions?.height ?? 100,
            {}
          );
        } catch (error) {
          console.error("Error optimizing image URL:", error);
        }
      }

      onChange(imageUrl, displayName ?? "");
    } catch (error) {
      console.error("Error opening media manager:", error);
    }
  }, [onChange, requestOptions]);

  const downloadImage = useCallback(async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, {
        method: "GET",
        headers: {},
      });
      const buffer = await response.arrayBuffer();
      const url = window.URL.createObjectURL(new Blob([buffer]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "image.png"); // or any other extension
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  }, []);

  return (
    <ImageViewer
      imageUrl={imageUrl || defaultImageUrl}
      height={frameHeight}
      width={frameWidth}
      onAddImage={handleMediaManager}
      onUpdateImage={handleMediaManager}
      onRemoveImage={() => onChange("", "")}
      onDownloadImage={() => downloadImage(imageUrl)}
      downloadImageInfo="Download image"
      removeImageInfo="Delete image"
      showDownloadButton={true}
    />
  );
};
