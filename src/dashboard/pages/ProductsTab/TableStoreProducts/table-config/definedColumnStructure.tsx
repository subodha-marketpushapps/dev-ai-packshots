import { TableColumn } from "@wix/design-system";
import { TFunction } from "i18next";

export const getDefinedColumnStructure = (t: TFunction): TableColumn[] => [
  {
    title: "",
    render: (row: any) => row.cellProductImage,
    width: "60px",
  },
  {
    key: "name",
    title: t('productsTab.columnProductName', {defaultValue: "Product Name"}),
    render: (row: any) => row.cellProductDetails,
    sortable: true,
    width: "40%",
  },
  {
    key: "liveImages",
    title: t('productsTab.columnProductImages', {defaultValue: "Product Images"}),
    render: (row: any) => row.cellLiveImages,
    width: "30%",
  },
  {
    key: "generatedImages",
    title: t('productsTab.columnGeneratedImages', {defaultValue: "Generated Images"}),
    render: (row: any) => row.cellGeneratedImages,
    width: "30%",
  },
  {
    key: "actionCell",
    title: "",
    render: (row: any) => row.cellAction,
    width: "120px",
  },
];