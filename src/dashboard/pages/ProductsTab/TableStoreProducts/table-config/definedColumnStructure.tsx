import { TableColumn } from "@wix/design-system";

export const definedColumnStructure: TableColumn[] = [
  {
    title: "",
    render: (row: any) => row.cellProductImage,
    width: "60px",
  },
  {
    key: "name",
    title: "Product Name",
    render: (row: any) => row.cellProductDetails,
    sortable: true,
    width: "40%",
  },
  {
    key: "liveImages",
    title: "Product Images",
    render: (row: any) => row.cellLiveImages,
    width: "30%",
  },
  {
    key: "generatedImages",
    title: "Generated Images",
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
