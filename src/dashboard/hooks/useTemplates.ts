import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Template, CreateTemplateDto } from "../../interfaces/custom/template";
import * as templatesApi from "../services/api/templates";

export const QUERY_TEMPLATES = "queryTemplates";

export const MUTATE_CREATE_TEMPLATE = "mutateCreateTemplate";
export const MUTATE_DELETE_TEMPLATE = "mutateDeleteTemplate";

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const getAllTemplates = () => {
    return useQuery<Template[]>({
      queryKey: [QUERY_TEMPLATES],
      queryFn: () => templatesApi.getAllTemplates(),
    });
  };

  const createTemplate = useMutation({
    mutationFn: (data: CreateTemplateDto) => templatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_TEMPLATES] });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => templatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_TEMPLATES] });
    },
  });

  return {
    getAllTemplates,
    createTemplate,
    deleteTemplate,
  };
};
