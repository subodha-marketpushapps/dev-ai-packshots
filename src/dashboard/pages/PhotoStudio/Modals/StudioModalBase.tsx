import React from "react";
import { Box, ModalProps } from "@wix/design-system"; // Replace with your UI library
import classes from "./StudioModalBase.module.scss"; // Import your styles

interface StudioModalBaseProps extends ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  mode?: "modal" | "absolute";
}

const StudioModalBase: React.FC<StudioModalBaseProps> = ({
  isOpen,
  children,
  mode = "modal",
}) => {
  if (!isOpen) return null;
  
  const containerClass = mode === "absolute" 
    ? classes["studio-modal-base-container-absolute"]
    : classes["studio-modal-base-container"];
    
  return (
    <Box className={containerClass}>{children}</Box>
  );
};

export default StudioModalBase;
