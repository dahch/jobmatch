export interface ApplyOption {
  title: string;
  link: string;
}

export interface DetectedExtensions {
  posted_at?: string;
  schedule_type?: string;
  salary?: string;
  benefits?: string[];
}

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  modality: "Remote" | "Hybrid" | "On-site" | "Unknown";
  url: string;
  source_portal: string;
  posted_at?: string;
  raw_description: string;
  extracted_requirements: {
    must_have: string[];
    nice_to_have: string[];
    technologies: string[];
    years_experience?: number;
    seniority_level?: string;
    languages?: string[];
  };
  ats_keywords: string[];
  match_score?: number;
  status: "new" | "reviewing" | "applied" | "discarded";
  notes?: string;
  // Extended fields from SerpApi / richer sources
  apply_options?: ApplyOption[];
  salary?: string;
  schedule_type?: string;
  benefits?: string[];
  via?: string;
}
