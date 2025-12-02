import ApiClient from "../../utils/api-client";
import { APP_ENDPOINTS } from "../../../constants";
import { SubscriptionResponse } from "../../../interfaces/custom/subscription";

export const getSubscription = async (): Promise<SubscriptionResponse> => {
  return await ApiClient.request<SubscriptionResponse>({
    url: APP_ENDPOINTS.SUBSCRIPTIONS,
    method: "GET",
    errorMessage: "Failed to fetch subscription data",
    secured: true,
  });
};
