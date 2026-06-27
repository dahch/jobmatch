# JobMatch AI

> AI-powered job search and CV optimization tool. All client-side, no backend.

**[Live Demo](https://jobmatch-ecru.vercel.app)**

## Overview

JobMatch AI helps you find job offers and tailor your CV for each one using AI. It connects to your preferred AI provider (OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, or any OpenAI-compatible endpoint), uses AI to generate matching job listings based on your profile, parses your existing CV, and generates ATS-optimized PDF versions tailored to specific job descriptions.

**Key capabilities:**

- Multi-provider AI configuration (OpenAI, Anthropic, Google Gemini, DeepSeek, OpenRouter, OpenCode, Custom)
- AI-generated job discovery matching your search profile
- CV parsing from PDF, DOCX, and TXT files
- AI-generated CVs optimized for specific job offers (ATS-friendly)
- 3 PDF templates: Minimalist, Professional, Technical
- Match score calculation between your CV and job requirements
- Bilingual UI (English and Spanish)
- Paste any job description to generate a tailored CV on the spot

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Architecture | Feature-Sliced Design |
| PDF Generation | @react-pdf/renderer |
| CV Parsing | pdfjs-dist, mammoth |
| i18n | react-i18next |
| Routing | react-router-dom v6 |
| Testing | Vitest + Testing Library |
| Linting | ESLint, Prettier |

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

3. **Configure environment variables**

   Copy the example env file and set your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Type | Default | Description |
   |---|---|---|---|
   | `VITE_CORS_PROXY_URL` | `string` | `""` | (Planned) URL of a CORS proxy for job scraping requests |

4. **Start the dev server**

   ```bash
   pnpm dev
   ```

5. **Configure your AI provider**

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
  features/         # Domain features (business logic + UI)
    ai-provider/     # Multi-provider AI abstraction layer
    job-search/      # AI job discovery agent
    cv-parser/       # PDF/DOCX/TXT CV parsing
    cv-builder/      # CV optimization and PDF generation
  shared/           # Cross-cutting concerns
    lib/             # Utilities (AI JSON parsing, i18n, localStorage)
    types/           # Shared TypeScript types (AI, CV, Job, Search)
    ui/              # Design system (Button, Input, Badge, Modal, Layout, ...)
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
│  Types │ Lib (aiJson, i18n, storage) │ UI kit     │
└──────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│          External (browser-only)                  │
│  AI APIs ◄──── AI Client abstraction             │
│  Job portals ◄── Job Search Agent                 │
│  localStorage ◄── All user data persistence       │
└──────────────────────────────────────────────────┘
```

## Security & Privacy

JobMatch AI runs entirely in the browser. There is no backend server.

- **Your API key stays in your browser.** It is stored in `localStorage` and sent only to the AI provider you configure.
- **Your CV never leaves your device** except when sent to your configured AI provider for optimization.
- **No analytics, no tracking, no telemetry.**
- **No data persistence beyond your browser.** Clearing localStorage removes all data.

If you need to access AI APIs that have CORS restrictions, you can configure a CORS proxy and use the `VITE_CORS_PROXY_URL` environment variable. Note that this feature is planned and not yet implemented.

## License

MIT
