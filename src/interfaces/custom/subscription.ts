export interface SubscriptionResponse {
  id: string;
  active: boolean;
  ended: boolean;
  isFree: boolean;
  isTrial: boolean;
  isTrialEnded: boolean;
  plan: string;
  creditsAvailable: number;
  creditsResetAt: number;
  chargeLimit: number;
  totalPaid: number;
  totalPendingPayment: number;
  pendingCreditDeductions: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
