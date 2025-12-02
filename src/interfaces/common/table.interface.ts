export type FunctionList<T> = ((rowData: T) => void)[];

export interface SortOption {
  fieldName: string;
  order: "desc" | "asc";
}
