import React from "react";

import { TableActionCell } from "@wix/design-system";

interface CellLivePreviewBtnProps {
  productId: string | undefined;
  onPhotoEditClick: () => void;
}

const CellPhotoEditBtn: React.FC<CellLivePreviewBtnProps> = ({
  productId,
  onPhotoEditClick,
}) => {
  return (
    <TableActionCell
      size="small"
      primaryAction={{
        text: "Edit",
        onClick: onPhotoEditClick,
      }}
    />
  );
};

export default CellPhotoEditBtn;
