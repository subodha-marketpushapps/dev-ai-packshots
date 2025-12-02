export interface Stats {
  totalProductsAddedToCart: number;
  totalNumberOfCartsIncreased: number;
  conversionRate: number | null;
  totalProductsPurchased: number;
  totalRevenueByApp: number;
  topBoughtProducts: any[];
  currency?: string;
}
