export type Modality = "On-site" | "Remote" | "Hybrid" | "Any";
export type Seniority =
  | "Junior"
  | "Mid"
  | "Senior"
  | "Staff / Principal"
  | "Any";

export interface SearchProfile {
  job_titles: string[];
  technologies: string[];
  location: string;
  modality: Modality;
  seniority: Seniority;
  exclude_keywords: string[];
  extra_context: string;
}
