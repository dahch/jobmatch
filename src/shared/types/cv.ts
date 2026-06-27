export interface ParsedCV {
  full_name: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location?: string;
  };
  summary?: string;
  work_experience: {
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
    location?: string;
    description: string;
    technologies: string[];
    achievements: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    start_date?: string;
    end_date?: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  languages: {
    language: string;
    level: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date?: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }[];
  raw_text: string;
}

export interface OptimizedCV {
  target_job: string;
  target_company: string;
  full_name: string;
  contact: ParsedCV["contact"];
  summary: string;
  work_experience: ParsedCV["work_experience"];
  skills: ParsedCV["skills"];
  education: ParsedCV["education"];
  languages: ParsedCV["languages"];
  certifications?: ParsedCV["certifications"];
  projects?: ParsedCV["projects"];
  ats_keywords_used: string[];
  changes_summary: string[];
}
