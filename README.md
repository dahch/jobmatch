# JobMatch AI

> AI-powered job search and CV optimization tool. All client-side, no backend.

**[Live Demo](https://jobmatch-ecru.vercel.app)**

## Overview

JobMatch AI helps you find job offers and tailor your CV for each one using AI. It connects to your preferred AI provider (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, or any OpenAI-compatible endpoint), uses AI to generate matching job listings based on your profile, parses your existing CV, and generates ATS-optimized PDF versions tailored to specific job descriptions.

**Key capabilities:**

- Multi-provider AI configuration (OpenAI, Anthropic, Google Gemini, DeepSeek, NVIDIA NIM, OpenRouter, OpenCode, Custom)
- AI-generated job discovery matching your search profile
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
| PDF Generation | @react-pdf/renderer |
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

4. **Configure your AI provider**

   Open the app, go to Settings, and enter your API key. Your key is stored in localStorage and never leaves your browser.

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
    SearchPage       # Define search criteria and trigger AI job search
    JobsPage         # Browse discovered/pasted job offers
    CVUploadPage     # Upload and parse your existing CV
    CVBuilderPage    # Edit and export optimized CVs
    SettingsPage     # Configure AI provider
    NotFoundPage     # 404 catch-all (lazy-loaded)
  features/         # Domain features (business logic + UI)
    ai-provider/     # Multi-provider AI abstraction layer
    job-search/      # AI job discovery agent + match scoring
    cv-parser/       # PDF/DOCX/TXT CV parsing
    cv-builder/      # CV optimization and PDF generation
  shared/           # Cross-cutting concerns
    lib/             # Utilities (AI JSON parsing, i18n, localStorage)
    types/           # Shared TypeScript types (AI, CV, Job, Search)
    ui/              # Design system (Button, Input, Badge, Modal, Layout, ...)
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
┌──────────────────────────────────────────────────┐
│                   UI Layer                        │
│  Pages ──> Feature UI ──> Shared UI Components    │
│  (Lazy-loaded with Suspense, wrapped in           │
│   ErrorBoundary per route)                        │
│  (Mobile: collapsible sidebar, responsive layout) │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│              Feature Layer                        │
│  ai-provider  job-search  cv-parser  cv-builder   │
│  (stores + business logic per feature)            │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│              Shared Layer                         │
│  Types │ Lib (aiJson, i18n, storage, utils)       │
│  UI kit (Button, Input, Modal, Badge, Spinner,    │
│          Layout, ErrorBoundary, Textarea)         │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│          External (browser-only)                  │
│  AI APIs ◄──── AI Client abstraction             │
│             (direct browser access for most,       │
│              /api/proxy for CORS-restricted)      │
│  localStorage ◄── All user data persistence       │
└──────────────────────────────────────────────────┘
```

## Security & Privacy

JobMatch AI runs entirely in the browser. There is no backend server.

- **Your API key stays in your browser.** It is stored in `localStorage` and sent only to the AI provider you configure.
- **Your CV never leaves your device** except when sent to your configured AI provider for optimization.
- **No analytics, no tracking, no telemetry.**
- **No data persistence beyond your browser.** Clearing localStorage removes all data.

Some AI providers (e.g. NVIDIA NIM) don't allow direct browser CORS. For these, the app routes requests through a lightweight Vercel serverless proxy (`/api/proxy`). The proxy never logs or stores your API key or CV content.

## License

MIT
