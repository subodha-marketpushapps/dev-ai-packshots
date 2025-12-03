import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
} from "react";
import { Box, Loader } from "@wix/design-system";
import { Canvas, Rect, Circle, PencilBrush, FabricImage } from "fabric";

import { v4 as uuidv4 } from "uuid";
import CanvasToolbar from "./CanvasToolbar";
import EditingPhotoActions from "../EditorPhotoActions";
import { usePhotoStudio } from "../../../services/providers/PhotoStudioProvider";
import {
  CANVAS_EXPORT_QUALITY,
  CANVAS_EXPORT_FORMAT,
} from "../../../../constants";

interface EditorCanvasProps {
  canvasHeight?: string;
  showAddRectangleButton?: boolean;
  showDownloadButton?: boolean;
  showResetButton?: boolean;
  showDeleteButton?: boolean;
  isCanvasActive?: boolean;
}

export interface DownloadCanvasOptions {
  width?: number; // Desired width in px
  aspectRatio?: number; // width / height
}

export interface EditorCanvasHandle {
  addRectangle: () => void;
  addCircle: () => void;
  downloadCanvas: (options?: DownloadCanvasOptions) => void;
  getCanvasAsFile: (options?: DownloadCanvasOptions) => File | null;
  getImageUrlAsFile: (
    imageUrl: string,
    options?: DownloadCanvasOptions
  ) => Promise<File | null>;
  clearCanvas: () => void;
}

const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  (
    {
      canvasHeight = "60vh",
      showAddRectangleButton = true,
      showDownloadButton = true,
      showResetButton = true,
      showDeleteButton = true,
      isCanvasActive = true,
    },
    ref
  ) => {
    const {
      editingImage,
      apiError,
      showImageDetails,
      isLoadingCanvas,
      setIsLoadingCanvas,
      setImagesLoaded,
      currentProduct,
    } = usePhotoStudio();
    const initialImageFile = editingImage?.file || null;
    const initialImageUrl = editingImage?.imageUrl || null;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const [hasActiveObject, setHasActiveObject] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isImageDirty, setIsImageDirty] = useState(false);
    const [selectedObjectType, setSelectedObjectType] = useState<string | null>(
      null
    );
    const [drawRectMode, setDrawRectMode] = useState(false);
    const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const colorOptions = ["red", "green", "blue", "yellow", "orange", "purple"];
    // useRef to store original image state
    const originalImageState = useRef<{
      left: number;
      top: number;
      scaleX: number;
      scaleY: number;
      angle: number;
    } | null>(null);
    const rectCountRef = useRef(0);
    const rectColors = ["red", "green", "blue", "yellow", "orange", "purple"];

    useImperativeHandle(ref, () => ({
      addRectangle,
      addCircle,
      downloadCanvas,
      getCanvasAsFile,
      getImageUrlAsFile,
      clearCanvas: () => {
        const fabric = fabricCanvasRef.current;
        if (fabric) {
          fabric.clear();
        }
      },
    }));

    useEffect(() => {
      if (initialImageFile) {
        const url = URL.createObjectURL(initialImageFile);
        loadImage(url);
      } else if (initialImageUrl) {
        loadImage(initialImageUrl);
      }
    }, [initialImageFile, initialImageUrl]);

    // Ensure canvas and container exist before initializing Fabric
    useLayoutEffect(() => {
      const tryInit = (attempt = 0) => {
        const container = document.getElementById("canvas-wrapper");
        if (!canvasRef.current || !container) {
          if (attempt < 10) {
            setTimeout(() => tryInit(attempt + 1), 50);
          } else {
            setError("Canvas or container not found");
          }
          return;
        }
        setError(null);
        const fabric = new Canvas(canvasRef.current, {
          width: container.clientWidth,
          height: container.clientHeight,
          preserveObjectStacking: true,
        });
        fabricCanvasRef.current = fabric;

        const handleResize = () => {
          const canvas = fabricCanvasRef.current;
          const container = document.getElementById("canvas-wrapper");
          if (!canvas || !container) return;
          const img = canvas.getObjects("image")[0] as FabricImage;
          if (img) {
            const { width: nw, height: nh } = img;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const scale = Math.min(cw / nw, ch / nh);
            const w = nw * scale;
            const h = nh * scale;
            canvas.setDimensions({ width: w, height: h });
            img.scaleToWidth(w);
            img.setCoords();
            canvas.renderAll();
          }
        };
        window.addEventListener("resize", handleResize);
        const brush = new PencilBrush(fabric);
        brush.width = 5;
        brush.color = "#000";
        fabric.freeDrawingBrush = brush;
        fabric.on("selection:created", () => setHasActiveObject(true));
        fabric.on("selection:updated", () => {
          const canvas = fabricCanvasRef.current;
          const img = canvas?.getObjects("image")[0];
          if (img) {
            canvas.sendObjectToBack(img);
            canvas.renderAll();
          }
        });
        fabric.on("selection:cleared", () => setHasActiveObject(false));
        // Cleanup
        return () => {
          window.removeEventListener("resize", handleResize);
          fabric.dispose();
        };
      };
      return tryInit();
    }, []);

    const loadImage = async (url: string) => {
      const container = document.getElementById("canvas-wrapper");
      const canvas = fabricCanvasRef.current;
      if (!container || !canvas) {
        setError("Canvas or container not initialized");
        return;
      }

      setError(null);
      try {
        const fabricImg = await FabricImage.fromURL(url, {
          crossOrigin: "anonymous",
        });
        const { width: nw, height: nh } = fabricImg;
        if (!nw || !nh) throw new Error("Invalid image dimensions");

        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const scale = Math.min(cw / nw, ch / nh);
        const w = nw * scale;
        const h = nh * scale;

        canvas.setDimensions({ width: w, height: h });
        fabricImg.set({
          id: "image_" + uuidv4(),
          originX: "left",
          originY: "top",
          left: 0,
          top: 0,
          width: nw,
          height: nh,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true,
          hasControls: true,
          transparentCorners: false,
          cornerColor: "#116DFF",
          cornerSize: 16,
          // cornerStyle: "circle",
          borderScaleFactor: 1,
        });

        canvas.clear();
        canvas.add(fabricImg);
        canvas.sendObjectToBack(fabricImg); // Ensure image is the bottom layer
        canvas.renderAll();
        // Store original image state
        originalImageState.current = {
          left: fabricImg.left ?? 0,
          top: fabricImg.top ?? 0,
          scaleX: fabricImg.scaleX ?? 1,
          scaleY: fabricImg.scaleY ?? 1,
          angle: fabricImg.angle ?? 0,
        };
        setIsImageDirty(false);
        setMaxWidth(canvas.getWidth());
        // Notify provider that canvas is fully loaded
        setImagesLoaded && setImagesLoaded();
        setIsLoadingCanvas && setIsLoadingCanvas(false);
      } catch (err) {
        console.error("Error loading image:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to load image: ${message}`);
        setImagesLoaded && setImagesLoaded();
        setIsLoadingCanvas && setIsLoadingCanvas(false);
      }
    };

    const addRectangle = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const count = rectCountRef.current;
      const color = rectColors[count % rectColors.length];
      const rectWidth = 100;
      const rectHeight = 60;
      const padding = 20;
      // Calculate max offset so rectangles stay within canvas
      const maxX = Math.max(0, (canvas.getWidth() || 0) - rectWidth - padding);
      const maxY = Math.max(
        0,
        (canvas.getHeight() || 0) - rectHeight - padding
      );
      // Use modulo to wrap around
      const offsetX = (count * padding) % (maxX + 1);
      const offsetY =
        (Math.floor((count * padding) / (maxX + 1)) * padding) % (maxY + 1);
      const rect = new Rect({
        id: "rect_" + uuidv4(),
        left: padding + offsetX,
        top: padding + offsetY,
        width: rectWidth,
        height: rectHeight,
        fill: "rgba(0, 0, 0, 0)",
        stroke: color,
        strokeWidth: 3,
        strokeUniform: true,
        selectable: true,
        evented: true,
        hasControls: true,
        transparentCorners: false,
        cornerColor: "#116DFF",
        cornerSize: 14,
        cornerStyle: "circle",
        borderScaleFactor: 1,
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
      rectCountRef.current = count + 1;
    };

    const addCircle = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const count = rectCountRef.current;
      const color = rectColors[count % rectColors.length];
      const radius = 40;
      const padding = 20;
      // Calculate max offset so circles stay within canvas
      const maxX = Math.max(0, (canvas.getWidth() || 0) - radius * 2 - padding);
      const maxY = Math.max(
        0,
        (canvas.getHeight() || 0) - radius * 2 - padding
      );
      const offsetX = (count * padding) % (maxX + 1);
      const offsetY =
        (Math.floor((count * padding) / (maxX + 1)) * padding) % (maxY + 1);
      const circle = new Circle({
        id: "circle_" + uuidv4(),
        left: padding + offsetX,
        top: padding + offsetY,
        radius: radius,
        fill: "rgba(0, 0, 0, 0)",
        stroke: color,
        strokeWidth: 3,
        strokeUniform: true,
        selectable: true,
        evented: true,
        hasControls: true,
        transparentCorners: false,
        cornerColor: "#116DFF",
        cornerSize: 14,
        cornerStyle: "circle",
        borderScaleFactor: 1,
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
      rectCountRef.current = count + 1;
    };

    const deleteSelectedLayer = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      // Prevent deletion if the selected object is the image
      const objects = canvas.getObjects("image");
      if (objects.includes(activeObject)) {
        // Using window.alert as a fallback - translations would require a modal/toast
        alert("You cannot delete the main image layer.");
        return;
      }
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.renderAll();
    };

    const checkImageDirty = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const img = canvas.getObjects("image")[0] as FabricImage | undefined;
      if (!img || !originalImageState.current) return;
      const orig = originalImageState.current;
      const isDirty =
        Math.abs((img.left ?? 0) - orig.left) > 0.5 ||
        Math.abs((img.top ?? 0) - orig.top) > 0.5 ||
        Math.abs((img.scaleX ?? 1) - orig.scaleX) > 0.001 ||
        Math.abs((img.scaleY ?? 1) - orig.scaleY) > 0.001;
      setIsImageDirty(isDirty);
    };

    // Listen for image changes
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const img = canvas.getObjects("image")[0] as FabricImage | undefined;
      if (!img) return;
      const check = () => checkImageDirty();
      canvas.on("object:modified", check);
      canvas.on("object:scaling", check);
      canvas.on("object:moving", check);
      canvas.on("object:rotating", check);
      // Animation frame loop for extra safety
      let rafId: number;
      const loop = () => {
        checkImageDirty();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
      return () => {
        canvas.off("object:modified", check);
        canvas.off("object:scaling", check);
        canvas.off("object:moving", check);
        canvas.off("object:rotating", check);
        cancelAnimationFrame(rafId);
      };
    }, [fabricCanvasRef.current]);

    // Check dirty state after image loads
    useEffect(() => {
      checkImageDirty();
    }, [initialImageFile, initialImageUrl]);

    useLayoutEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const img = canvas.getObjects("image")[0] as FabricImage | undefined;
      if (!img || !originalImageState.current) {
        if (isImageDirty) setIsImageDirty(false);
        return;
      }
      const orig = originalImageState.current;
      const isDirty =
        Math.abs((img.left ?? 0) - orig.left) > 0.5 ||
        Math.abs((img.top ?? 0) - orig.top) > 0.5 ||
        Math.abs((img.scaleX ?? 1) - orig.scaleX) > 0.001 ||
        Math.abs((img.scaleY ?? 1) - orig.scaleY) > 0.001 ||
        Math.abs((img.angle ?? 0) - orig.angle) > 0.5;
      if (isDirty !== isImageDirty) setIsImageDirty(isDirty);
    });

    const resetImagePositionAndScale = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const img = canvas.getObjects("image")[0] as FabricImage;
      if (!img || !originalImageState.current) return;
      const orig = originalImageState.current;
      img.set({
        left: orig.left,
        top: orig.top,
        scaleX: orig.scaleX,
        scaleY: orig.scaleY,
        angle: orig.angle,
      });
      img.setCoords();
      canvas.renderAll();
      setIsImageDirty(false);
    };

    const getCanvasAsFile = (options?: DownloadCanvasOptions): File | null => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return null;
      const img = canvas.getObjects("image")[0] as FabricImage | undefined;
      if (!img) return null;

      // Store current canvas size and all object states
      const prevWidth = canvas.getWidth();
      const prevHeight = canvas.getHeight();
      // Determine export size (default to original image size)
      let exportWidth = img.width || prevWidth;
      let exportHeight = img.height || prevHeight;

      if (options?.width) {
        exportWidth = options.width;
        if (options?.aspectRatio) {
          exportHeight = Math.round(exportWidth / options.aspectRatio);
        } else {
          exportHeight = Math.round(
            ((img.height || prevHeight) / (img.width || prevWidth)) *
              exportWidth
          );
        }
      } else if (options?.aspectRatio) {
        exportHeight = Math.round(exportWidth / options.aspectRatio);
      }

      // Calculate scale factor to fit preview into export canvas (fit-to-contain)
      const scale = Math.min(
        exportWidth / prevWidth,
        exportHeight / prevHeight
      );

      // Store previous state of all objects
      const objects = canvas.getObjects();
      const prevStates = objects.map((obj) => ({
        left: obj.left,
        top: obj.top,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
      }));
      // Scale and reposition all objects
      objects.forEach((obj) => {
        obj.left =
          (obj.left || 0) * scale + (exportWidth - prevWidth * scale) / 2;
        obj.top =
          (obj.top || 0) * scale + (exportHeight - prevHeight * scale) / 2;
        obj.scaleX = (obj.scaleX || 1) * scale;
        obj.scaleY = (obj.scaleY || 1) * scale;
        obj.setCoords && obj.setCoords();
      });
      canvas.setDimensions({ width: exportWidth, height: exportHeight });
      canvas.renderAll();

      // Export as JPEG with configured quality (visually lossless but much smaller)
      const dataURL = canvas.toDataURL({
        format: CANVAS_EXPORT_FORMAT,
        quality: CANVAS_EXPORT_QUALITY,
        multiplier: 1,
      });

      // Restore all objects to previous state
      objects.forEach((obj, i) => {
        obj.left = prevStates[i].left;
        obj.top = prevStates[i].top;
        obj.scaleX = prevStates[i].scaleX;
        obj.scaleY = prevStates[i].scaleY;
        obj.setCoords && obj.setCoords();
      });
      canvas.setDimensions({ width: prevWidth, height: prevHeight });
      canvas.renderAll();

      // Convert dataURL to File
      const byteString = atob(dataURL.split(",")[1]);
      const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // Dynamic filename
      let fileName = `canvas.${
        CANVAS_EXPORT_FORMAT === "jpeg" ? "jpg" : CANVAS_EXPORT_FORMAT
      }`;
      if (currentProduct && editingImage) {
        const safeName = currentProduct.name
          ? currentProduct.name.replace(/[^a-zA-Z0-9-_ ]/g, "_")
          : "Product";
        const extension =
          CANVAS_EXPORT_FORMAT === "jpeg" ? "jpg" : CANVAS_EXPORT_FORMAT;
        fileName = `AI_Product_Images ${safeName} ${editingImage.id}.${extension}`;
      }

      const mimeType =
        CANVAS_EXPORT_FORMAT === "jpeg"
          ? "image/jpeg"
          : `image/${CANVAS_EXPORT_FORMAT}`;
      return new File([ab], fileName, { type: mimeType });
    };

    const downloadCanvas = (options?: DownloadCanvasOptions) => {
      const file = getCanvasAsFile(options);
      if (!file) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const handleSelection = () => {
        const obj = canvas.getActiveObject();
        if (!obj) {
          setSelectedObjectType(null);
          setShowColorPalette(false);
        } else if (obj.type === "rect") {
          setSelectedObjectType("rect");
          setShowColorPalette(true);
        } else if (obj.type === "image") {
          setSelectedObjectType("image");
        } else if (obj.type === "circle") {
          setSelectedObjectType("circle");
          setShowColorPalette(true);
        } else {
          setSelectedObjectType(obj.type);
          setShowColorPalette(false);
        }
      };
      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", handleSelection);
      // Initial state
      handleSelection();
      return () => {
        canvas.off("selection:created", handleSelection);
        canvas.off("selection:updated", handleSelection);
        canvas.off("selection:cleared", handleSelection);
      };
    }, [fabricCanvasRef.current]);

    const handleChangeObjColor = (color: string) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const obj = canvas.getActiveObject();
      if (obj && (obj.type === "rect" || obj.type === "circle")) {
        obj.set("stroke", color);
        canvas.renderAll();
      }
    };

    // Deselect layers when clicking outside the canvas frame
    useEffect(() => {
      const handleDocumentClick = (e: MouseEvent) => {
        const wrapper = document.getElementById("canvas-wrapper");
        if (wrapper && !wrapper.contains(e.target as Node)) {
          const canvas = fabricCanvasRef.current;
          if (canvas && canvas.getActiveObject()) {
            canvas.discardActiveObject();
            canvas.renderAll();
          }
        }
      };
      document.addEventListener("mousedown", handleDocumentClick);
      return () => {
        document.removeEventListener("mousedown", handleDocumentClick);
      };
    }, []);

    const isImageAvailable = initialImageFile || initialImageUrl;

    /**
     * getImageUrlAsFile - creates a File from an image URL, with optional resizing and aspect ratio
     * @param imageUrl - the image URL to fetch and convert
     * @param options - { width, aspectRatio } for resizing
     * @returns Promise<File | null>
     */
    const getImageUrlAsFile = async (
      imageUrl: string,
      options?: DownloadCanvasOptions
    ): Promise<File | null> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          // Store current image size
          const prevWidth = img.naturalWidth;
          const prevHeight = img.naturalHeight;
          // Determine export size (default to original image size)
          let exportWidth = prevWidth;
          let exportHeight = prevHeight;
          if (options?.width) {
            exportWidth = options.width;
            if (options?.aspectRatio) {
              exportHeight = Math.round(exportWidth / options.aspectRatio);
            } else {
              exportHeight = Math.round((prevHeight / prevWidth) * exportWidth);
            }
          } else if (options?.aspectRatio) {
            exportHeight = Math.round(exportWidth / options.aspectRatio);
          }
          // Calculate scale factor to fit preview into export canvas (fit-to-contain)
          const scale = Math.min(
            exportWidth / prevWidth,
            exportHeight / prevHeight
          );
          // Center the image in the export canvas
          const offsetX = (exportWidth - prevWidth * scale) / 2;
          const offsetY = (exportHeight - prevHeight * scale) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = exportWidth;
          canvas.height = exportHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.clearRect(0, 0, exportWidth, exportHeight);
          ctx.drawImage(
            img,
            0,
            0,
            prevWidth,
            prevHeight,
            offsetX,
            offsetY,
            prevWidth * scale,
            prevHeight * scale
          );
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(null);
              const extension =
                CANVAS_EXPORT_FORMAT === "jpeg" ? "jpg" : CANVAS_EXPORT_FORMAT;
              resolve(
                new File([blob], `image.${extension}`, { type: blob.type })
              );
            },
            `image/${CANVAS_EXPORT_FORMAT}`,
            CANVAS_EXPORT_QUALITY
          );
        };
        img.onerror = () => resolve(null);
        img.src = imageUrl;
      });
    };

    const handleOnCompare = async () => {
      if (!editingImage?.imageUrl) return;
      showImageDetails(editingImage, "compare");
    };

    return (
      <Box
        direction="vertical"
        gap="SP2"
        margin="SP4"
        flexGrow={1}
        align="center"
        position={isCanvasActive && isImageAvailable ? "relative" : "absolute"}
        opacity={isCanvasActive && isImageAvailable ? 1 : 0}
        pointerEvents={isCanvasActive && isImageAvailable ? "auto" : "none"}
        verticalAlign="middle"
      >
        {apiError && (
          <Box color="R10" marginBottom={1}>
            {apiError}
          </Box>
        )}
        {isLoadingCanvas && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            zIndex={10}
            align="center"
            verticalAlign="middle"
          >
            <Loader size="small" />
          </Box>
        )}
        <div
          id="canvas-wrapper"
          style={{
            width: "100%",
            height: canvasHeight,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => {}}
        >
          <CanvasToolbar
            error={error || undefined}
            isImageDirty={isImageDirty}
            showAddRectangleButton={showAddRectangleButton}
            showDownloadButton={showDownloadButton}
            showResetButton={showResetButton}
            showDeleteButton={showDeleteButton}
            showColorPalette={showColorPalette}
            drawRectMode={drawRectMode}
            setDrawRectMode={setDrawRectMode}
            selectedObjectType={selectedObjectType}
            onDownload={downloadCanvas}
            onReset={resetImagePositionAndScale}
            onDelete={deleteSelectedLayer}
            onChangeObjColor={handleChangeObjColor}
            colorOptions={colorOptions}
            maxWidth={maxWidth ? maxWidth : "100%"}
            onCompare={handleOnCompare}
            showCompareButton={editingImage?.isLiveImage ? false : true}
          />
          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid #ccc",
              borderRadius: "12px",
              zIndex: 3,
            }}
          />
        </div>
        {isCanvasActive && editingImage && (
          <Box width="100%" align="center" transition="transform 0.3s ease">
            <EditingPhotoActions
              mode={
                editingImage?.isLiveImage
                  ? "live"
                  : editingImage.imageState == "uploaded"
                  ? "uploaded"
                  : "draft"
              }
              imageObject={editingImage}
            />
          </Box>
        )}
      </Box>
    );
  }
);

export default EditorCanvas;
