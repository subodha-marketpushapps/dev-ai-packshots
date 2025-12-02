import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, UpdateSettingDto } from "../../interfaces/custom/settings";
import * as settingsApi from "../services/api/settings";

export const QUERY_SETTINGS = "querySettings";

export const MUTATE_UPDATE_SETTINGS = "mutateUpdateSettings";
export const MUTATE_UPDATE_INSTANCE = "mutateUpdateInstance";
export const MUTATE_SET_WIDGET = "mutateSetWidget";

export const useSettings = () => {
  const queryClient = useQueryClient();

  const getSettings = () => {
    return useQuery<Settings>({
      queryKey: [QUERY_SETTINGS],
      queryFn: () => settingsApi.getSettings(),
    });
  };

  const updateSettings = useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.updateSettings(data),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_SETTINGS], data);
    },
  });

  const updateInstance = useMutation({
    mutationFn: ({ instanceId }: { instanceId: string }) =>
      settingsApi.updateInstance(instanceId),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_SETTINGS], data);
    },
  });

  return {
    getSettings,
    updateSettings,
    updateInstance,
  };
};
