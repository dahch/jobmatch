export { MinimalTemplate } from "./MinimalTemplate";
export { ProfessionalTemplate } from "./ProfessionalTemplate";
export { TechnicalTemplate } from "./TechnicalTemplate";

export type TemplateName = "minimal" | "professional" | "technical";

export const TEMPLATE_LABELS: Record<TemplateName, string> = {
  minimal: "Minimalist",
  professional: "Professional (Two-Column)",
  technical: "Technical Compact",
};
