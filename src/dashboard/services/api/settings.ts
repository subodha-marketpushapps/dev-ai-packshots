import { APP_ENDPOINTS } from "../../../constants";
import { Settings } from "../../../interfaces/custom/settings";
import ApiClient from "../../utils/api-client";

export const getSettings = async (): Promise<Settings> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.SETTINGS,
    method: "GET",
    errorMessage: "Failed to fetch settings",
    secured: true,
  });
};

export const updateSettings = async (
  data: Partial<Settings>
): Promise<Partial<Settings>> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.SETTINGS_UPDATE,
    method: "PATCH",
    data,
    errorMessage: "Failed to update settings",
    secured: true,
  });
};

export const updateInstance = async (
  instanceId: string
): Promise<{
  message: string;
  data: unknown;
  success: boolean;
  error: string | null;
  statusCode: number;
}> => {
  return await ApiClient.request({
    url: APP_ENDPOINTS.SETTINGS_UPDATE_INSTANCE(instanceId),
    method: "POST",
    errorMessage: "Failed to update instance",
    secured: true,
  });
};
