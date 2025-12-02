import { APP_ENDPOINTS } from "../../../constants";
import {
  Template,
  CreateTemplateDto,
} from "../../../interfaces/custom/template";

export const createTemplate = async (
  data: CreateTemplateDto
): Promise<Template> => {
  const response = await fetch(APP_ENDPOINTS.TEMPLATES, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getAllTemplates = async (): Promise<Template[]> => {
  const response = await fetch(APP_ENDPOINTS.TEMPLATES);
  return response.json();
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const response = await fetch(APP_ENDPOINTS.TEMPLATES_ID(id), {
    method: "DELETE",
  });
  return response.json();
};
