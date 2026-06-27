import { pdf } from "@react-pdf/renderer";
import type { OptimizedCV } from "@/shared/types";
import { MinimalTemplate } from "../templates/MinimalTemplate";
import { ProfessionalTemplate } from "../templates/ProfessionalTemplate";
import { TechnicalTemplate } from "../templates/TechnicalTemplate";
import type { TemplateName } from "../templates";

export async function generatePDF(
  cv: OptimizedCV,
  template: TemplateName,
  accentColor?: string,
): Promise<Blob> {
  const doc = renderTemplate(cv, template, accentColor);
  const blob = await pdf(doc).toBlob();
  return blob;
}

function renderTemplate(
  cv: OptimizedCV,
  template: TemplateName,
  accentColor?: string,
) {
  switch (template) {
    case "professional":
      return <ProfessionalTemplate cv={cv} accentColor={accentColor} />;
    case "technical":
      return <TechnicalTemplate cv={cv} />;
    case "minimal":
    default:
      return <MinimalTemplate cv={cv} />;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getFilename(cv: OptimizedCV): string {
  const company = cv.target_company.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `CV_${company}_${date}.pdf`;
}
