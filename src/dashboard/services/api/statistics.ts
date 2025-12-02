import ApiClient from "../../utils/api-client";

export const fetchStatistics = async (range: string) => {
  return await ApiClient.request({
    url: `/stats/?range=${range}`,
    method: "GET",
    data: null,
    errorMessage: "Failed to fetch statistics",
    secured: true,
  });
};
