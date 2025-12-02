export interface Settings {
  createdAt?: number;
  updatedAt?: number;
  id?: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  timezoneId: string | null;
  businessName: string | null;
  businessPhoneNumber: string | null;
  installPopupShow: boolean;
  country: string | null;
  isUserReviewed:
    | "none"
    | "1st-time-asked"
    | "2nd-time-asked"
    | "3rd-time-asked"
    | "never"
    | boolean;
  openedEditor?: boolean;
  openedPreview?: boolean;
  openedSite?: boolean;
}

export interface UpdateSettingDto {
  firstName?: { value: string | null; default: null };
  lastName?: { value: string | null; default: null };
  email?: { value: string | null; default: null };
  timezoneId?: { value: string };
  businessName?: { value: string };
  businessPhoneNumber?: { value: string };
  installPopupShow?: { value: boolean; default: false };
  country?: { value: string | null; default: null };
  isUserReviewed?: { value: boolean; default: false };
  openedEditor?: { value: boolean; default: false };
  openedPreview?: { value: boolean; default: false };
  openedSite?: { value: boolean; default: false };
}
