# JobMatch AI

> AI-powered job search and CV optimization tool. All client-side, no backend.

**[Live Demo](https://jobmatch-ecru.vercel.app)**

## Overview

JobMatch AI helps you find job offers and tailor your CV for each one using AI. It connects to your preferred AI provider (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, or any OpenAI-compatible endpoint), discovers real job listings from multiple aggregator APIs (SerpApi Google Jobs, Arbeitnow) based on your search profile, parses your existing CV, and generates ATS-optimized PDF versions tailored to specific job descriptions.

**Key capabilities:**

- Multi-provider AI configuration (OpenAI, Anthropic, Google Gemini, DeepSeek, NVIDIA NIM, OpenRouter, OpenCode, Custom)
- Real job discovery from SerpApi (Google Jobs, proxied) and Arbeitnow (direct, DACH-region only)
- CV parsing from PDF, DOCX, and TXT files
- AI-generated CVs optimized for specific job offers (ATS-friendly)
- 3 PDF templates: Minimalist, Professional, Technical
- Match score calculation between your CV and job requirements
- Bilingual UI (English and Spanish)
- Paste any job description to generate a tailored CV on the spot
- SEO: per-route meta tags, Open Graph, Twitter Cards, structured data (JSON-LD), `robots.txt`, `sitemap.xml`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 (CSS custom properties for theming) |
| State | Zustand |
| Architecture | Feature-Sliced Design |
| PDF Generation | @react-pdf/renderer v4 |
| CV Parsing | pdfjs-dist, mammoth |
| i18n | react-i18next (EN/ES) |
| Routing | react-router-dom v6 (lazy-loaded with Suspense) |
| SEO | react-helmet-async (per-route meta, structured data) |
| Testing | Vitest + Testing Library + @vitest/coverage-v8 |
| Linting | ESLint v9 (flat config), Prettier |
| Theme | System-preference aware light/dark mode via CSS variables |
| Deployment | Vercel (SPA rewrite rules) |

## Prerequisites

- Node.js >= 18
- pnpm
- An API key from one of the supported AI providers

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/dahch/jobmatch.git
   cd jobmatch
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the dev server**

   ```bash
   pnpm dev
   ```

4. **Configure AI provider and job search**

   Open the app, go to Settings, enter your AI provider API key, and optionally add a SerpApi key for real job discovery from Google Jobs (free tier: 250 searches/month). Keys are stored in localStorage and never leave your browser.

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check + production build |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run tests once (vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Lint with ESLint |
| `pnpm format` | Format source files with Prettier |

## Project Structure

The project follows [Feature-Sliced Design](https://feature-sliced.design/) (FSD) architecture:

```
src/
  app/              # App entry, router, global providers
  pages/            # Route-level components
    SearchPage       # Define search criteria and trigger job search
    JobsPage         # Browse discovered/pasted job offers
    CVUploadPage     # Upload and parse your existing CV
    CVBuilderPage    # Edit and export optimized CVs
    SettingsPage     # Configure AI provider
    NotFoundPage     # 404 catch-all (lazy-loaded)
  features/         # Domain features (business logic + UI)
    ai-provider/     # Multi-provider AI abstraction layer
    job-search/      # Multi-source job discovery + match scoring
    cv-parser/       # PDF/DOCX/TXT CV parsing
    cv-builder/      # CV optimization and PDF generation
  shared/           # Cross-cutting concerns
    api/proxy/       # Shared proxy logic (handler, AI providers, job sources)
    dev/             # Vite dev plugin (proxyPlugin.ts, reuses shared proxy handler)
    lib/             # Utilities (AI JSON parsing, i18n, localStorage, seo-config, utils)
    types/           # Shared TypeScript types (AI, CV, Job, Search)
    ui/              # Design system (Button, Input, Badge, Modal, Layout, SEO, StructuredData, ...)
api/                # Vercel serverless functions (proxy for CORS-restricted providers)
```

Each feature follows FSD conventions:

```
features/<feature>/
  api/         # External API calls (AI client, job search agent)
  model/       # Zustand stores and domain types
  lib/         # Pure business logic
  ui/          # Feature-specific React components
  templates/   # (cv-builder only) PDF template components
```

## Architecture

```
┌───────────────────────────────────────────────────┐
│                   UI Layer                         │
│  Pages ──> Feature UI ──> Shared UI Components     │
│  (Lazy-loaded with Suspense, wrapped in            │
│   ErrorBoundary per route)                         │
│  (Mobile: collapsible sidebar, responsive layout)  │
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│              Feature Layer                         │
│  ai-provider  job-search  cv-parser  cv-builder    │
│  (stores + business logic per feature)             │
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│              Shared Layer                          │
│  Types │ Lib (aiJson, i18n, storage, utils)        │
│  UI kit (Button, Input, Modal, Badge, Spinner,     │
│          Layout, ErrorBoundary, Textarea)          │
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│          External (browser-only)                   │
│  AI APIs ◄──── AI Client abstraction              │
│             (direct browser access for most,        │
│              /api/proxy for CORS-restricted)       │
│  Job Aggregators ◄── Source Adapters              │
│  (SerpApi Google Jobs via /api/proxy,               │
│   Arbeitnow direct — DACH/EU-remote only)          │
│  localStorage ◄── All user data persistence        │
└───────────────────────────────────────────────────┘
```

## Security & Privacy

JobMatch AI runs entirely in the browser. There is no backend server.

- **Your API key stays in your browser.** It is stored in `localStorage` and sent only to the AI provider you configure.
- **Your CV never leaves your device** except when sent to your configured AI provider for optimization.
- **No analytics, no tracking, no telemetry.**
- **No data persistence beyond your browser.** Clearing localStorage removes all data.

Some AI providers (e.g. NVIDIA NIM) don't allow direct browser CORS. For these, the app routes requests through a lightweight Vercel serverless proxy (`/api/proxy`). The same proxy also serves job sources that require proxied access — SerpApi (Google Jobs) has zero CORS support and requires a per-request API key (BYOK, user-supplied via Settings). The proxy never logs or stores your API key or CV content. Proxy logic is shared between the Vercel function and the Vite dev server via `api/shared/proxy/`.

## License

MIT
