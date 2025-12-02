import { TableColumn } from "@wix/design-system";
import i18n from "../../../../../i18n";

export const definedColumnStructure: TableColumn[] = [
  {
    title: "",
    render: (row: any) => row.cellProductImage,
    width: "60px",
  },
  {
    key: "name",
    title: i18n.t('productsTab.columnProductName', {defaultValue: "Product Name"}),
    render: (row: any) => row.cellProductDetails,
    sortable: true,
    width: "40%",
  },
  {
    key: "liveImages",
    title: i18n.t('productsTab.columnProductImages', {defaultValue: "Product Images"}),
    render: (row: any) => row.cellLiveImages,
    width: "30%",
  },
  {
    key: "generatedImages",
    title: i18n.t('productsTab.columnGeneratedImages', {defaultValue: "Generated Images"}),
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