export interface GCloudQuery {
  limit?: number;
  cursor?: string | null;
  filters?: { fieldName: string; logic: string; value: any }[];
  sort?: { fieldName: string; direction: string };
  offset?: number;
}
