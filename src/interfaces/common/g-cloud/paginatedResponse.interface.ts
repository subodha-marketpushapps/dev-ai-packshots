export interface PaginatedResponse<T> {
  data: T[];
  count: {
    currentPage: number;
    total: number;
  };
  cursor: string | null;
  success: boolean;
  error: string | null;
}
