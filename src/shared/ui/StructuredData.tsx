import { Helmet } from "react-helmet-async";
import { SITE_URL, SITE_NAME } from "@/shared/lib/seo-config";

const APP_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description:
    "AI-powered job search and CV optimization tool. Find matching jobs and generate ATS-optimized CVs tailored to each offer.",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI-powered job discovery",
    "CV parsing from PDF, DOCX, TXT",
    "ATS-optimized CV generation",
    "Multiple AI provider support",
    "Match score calculation",
    "Bilingual UI (English/Spanish)",
  ],
  screenshot: `${SITE_URL}/og-default.png`,
  softwareVersion: "1.0.0",
  author: {
    "@type": "Person",
    name: "dahch",
    url: "https://github.com/dahch",
  },
};

const ORGANIZATION_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: ["https://github.com/dahch/jobmatch"],
};

const WEBSITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "AI-powered job search and CV optimization tool. All client-side, no backend.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search`,
    },
    "query-input": "required name=search_term_string",
  },
};

const FAQ_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is JobMatch AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JobMatch AI is an AI-powered job search and CV optimization tool that runs entirely in your browser. It helps you find matching job offers and generates ATS-optimized CVs tailored to specific job descriptions.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. JobMatch AI runs entirely client-side. Your CV and API key never leave your browser. Data is sent only to the AI provider you configure (OpenAI, Anthropic, etc.).",
      },
    },
    {
      "@type": "Question",
      name: "Which AI providers are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JobMatch AI supports OpenAI, Anthropic, Google Gemini, DeepSeek, NVIDIA NIM, OpenRouter, OpenCode, and any OpenAI-compatible custom endpoint.",
      },
    },
    {
      "@type": "Question",
      name: "What CV formats are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "JobMatch AI can parse PDF, DOCX, and TXT files. It generates optimized CVs as PDF files with three template options: Minimalist, Professional, and Technical.",
      },
    },
    {
      "@type": "Question",
      name: "Is JobMatch AI free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, JobMatch AI is free and open-source. You only need your own API key from a supported AI provider to use the AI features.",
      },
    },
  ],
};

interface StructuredDataProps {
  include?: ("app" | "org" | "website" | "faq" | "custom")[];
  custom?: Record<string, unknown>[];
}

export function StructuredData({ include = ["app", "org", "website", "faq"], custom }: StructuredDataProps) {
  const schemas: Record<string, unknown>[] = [];

  if (include.includes("app")) schemas.push(APP_STRUCTURED_DATA);
  if (include.includes("org")) schemas.push(ORGANIZATION_STRUCTURED_DATA);
  if (include.includes("website")) schemas.push(WEBSITE_STRUCTURED_DATA);
  if (include.includes("faq")) schemas.push(FAQ_STRUCTURED_DATA);
  if (include.includes("custom") && custom) schemas.push(...custom);

  return (
    <Helmet>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
