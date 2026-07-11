const SITE_URL = "https://jobmatch-ecru.vercel.app";
const SITE_NAME = "JobMatch AI";
const DEFAULT_DESCRIPTION =
  "AI-powered job search and CV optimization tool. Find matching jobs and generate ATS-optimized CVs tailored to each offer. All client-side, your data never leaves your browser.";

export interface RouteSEO {
  title: string;
  description: string;
  path: string;
  ogType?: "website";
  noindex?: boolean;
}

export const ROUTE_SEO: Record<string, RouteSEO> = {
  "/": {
    title: "JobMatch AI — AI Job Search & CV Optimization",
    description: DEFAULT_DESCRIPTION,
    path: "/",
    ogType: "website",
  },
  "/search": {
    title: "Job Search Profile — JobMatch AI",
    description:
      "Define your job search criteria and let AI find matching opportunities. Set titles, technologies, location, and seniority preferences.",
    path: "/search",
  },
  "/jobs": {
    title: "Job Offers — JobMatch AI",
    description:
      "Browse AI-discovered job offers matched to your profile. Review match scores, required technologies, and generate tailored CVs.",
    path: "/jobs",
  },
  "/cv/upload": {
    title: "Upload CV — JobMatch AI",
    description:
      "Upload your existing CV in PDF, DOCX, or TXT format. AI will parse and optimize it for specific job opportunities.",
    path: "/cv/upload",
  },
  "/cv/builder": {
    title: "CV Builder — JobMatch AI",
    description:
      "Build ATS-optimized CVs tailored to specific job offers. Choose from Minimalist, Professional, or Technical PDF templates.",
    path: "/cv/builder",
  },
  "/settings": {
    title: "AI Provider Settings — JobMatch AI",
    description:
      "Configure your AI provider (OpenAI, Anthropic, Gemini, DeepSeek, NVIDIA NIM, or custom). Your API key stays in your browser.",
    path: "/settings",
    noindex: true,
  },
};

export { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION };
