import ApiClient from "../../utils/api-client";

export const updateUserInstance = async (instanceId: string) => {
  return await ApiClient.request<string>({
    url: `/updateInstance/?instanceId=${instanceId}`,
    method: "POST",
    errorMessage: "Error refreshing user instance data",
    secured: false,
  });
};
