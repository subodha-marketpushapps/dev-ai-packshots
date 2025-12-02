import React from "react";
import { Box } from "@wix/design-system";

import { TableRawData } from "./table-raw.interface";

import CellPhotoEditBtn from "../CellPhotoEditBtn";

import { FunctionList } from "../../../../../interfaces";
import {
  CellWixProductName,
  CellWixProductImage,
} from "../../../../components/ui/BaseTableCells";
import CellGeneratedImages from "../CellGeneratedImages";
import CellLiveImages from "../CellLiveImages";

export const derivedTableElements = (
  products: TableRawData[],
  cellActions: FunctionList<TableRawData>
) => {
  return products.map((product) => ({
    ...product,
    cellProductImage: (
      <CellWixProductImage product={product} src={product.image} />
    ),
    cellProductDetails: (
      <CellWixProductName
        product={product as any}
        productId={product.id}
        showMoreInfo
        showStoreLink
        showMoreWithLivePreview
      />
    ),
    cellLiveImages: (
      <CellLiveImages
        liveImages={product.media?.items || []}
        productId={product.id}
      />
    ),
    cellGeneratedImages: (
      <CellGeneratedImages
        generatedImages={product.generatedImages || []}
        productId={product.id}
      />
    ),
    cellAction: (
      <CellPhotoEditBtn
        productId={product.id}
        onPhotoEditClick={() => cellActions[0](product)}
      />
    ),
  }));
};
