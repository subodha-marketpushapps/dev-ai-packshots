export interface MkpSettings {
  first_name: string;
  last_name: string;
  email: string;
  timezone_id: string;
  business_name: string;
  business_phone_number: string;
  install_popup_show: boolean;
  country: string;
  is_user_reviewed?: boolean;
  hasAddedBlocksWidget?: boolean;
  collectionGeneration?: string;
  orderSyncing?: string;
  discountName?: string;
  statsEmailEnabled?: boolean;
  openedEditor?: boolean;
  openedSite?: boolean;
  openedPreview?: boolean;
  discountTemplatesAvailable?: boolean;
}
