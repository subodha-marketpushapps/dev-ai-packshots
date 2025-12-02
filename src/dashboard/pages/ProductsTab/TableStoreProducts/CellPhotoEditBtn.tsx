import React from "react";
import { useTranslation } from "react-i18next";

import { TableActionCell } from "@wix/design-system";

interface CellLivePreviewBtnProps {
  productId: string | undefined;
  onPhotoEditClick: () => void;
}

const CellPhotoEditBtn: React.FC<CellLivePreviewBtnProps> = ({
  productId,
  onPhotoEditClick,
}) => {
  const { t } = useTranslation();
  return (
    <TableActionCell
      size="small"
      primaryAction={{
        text: t('productsTab.edit', {defaultValue: "Edit"}),
        onClick: onPhotoEditClick,
      }}
    />
  );
};

export default CellPhotoEditBtn;
