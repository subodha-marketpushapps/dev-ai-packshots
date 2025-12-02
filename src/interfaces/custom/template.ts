export interface Template {
  id: string;
  instanceId: string;
  requestBody: Record<string, any>;
  requestType:
    | "remove"
    | "generate-ai"
    | "place-background"
    | "generate-guided"
    | "improve-image";
  public: boolean;
}

export interface CreateTemplateDto {
  requestBody: Record<string, any>;
  requestType:
    | "remove"
    | "generate-ai"
    | "place-background"
    | "generate-guided"
    | "improve-image";
  public?: boolean;
}
