# JobMatch AI — Implementation Plan

## Phase 1: Project Scaffolding
Scaffold Vite + React 18 + TypeScript, install all dependencies, configure Tailwind CSS v3, set up FSD folder structure, shared UI components, Zustand stores skeleton, routing, and i18n foundation. This is the foundation everything else builds on — no feature code can start without it.

## Phase 2: AI Provider Config + aiClient Abstraction
Build the provider settings page and the `aiClient.ts` module that normalizes requests across OpenAI, OpenRouter, Anthropic, and custom providers. This is critical because every subsequent feature (job search, CV parsing, CV generation) depends on the AI client being functional and testable.

## Phase 3: Search Profile Form + Store
Implement the structured job search profile form and persist it to localStorage. This is needed before job search can work, and is a self-contained form + store feature with no external dependencies beyond Phase 2's types.

## Phase 4: CV Upload & Parsing
Build file upload (react-dropzone), PDF parsing (pdfjs-dist), DOCX parsing (mammoth), and the AI-powered CV structuring step. This is a core input for the CV generation pipeline and must be ready before Phase 5.

## Phase 5: CV Optimizer + Builder + PDF Export
Implement the prompt engineering for CV optimization, the CV editor UI, template selection (3 templates via @react-pdf/renderer), diff viewer, and PDF export. This is the primary user-facing deliverable and depends on Phases 2 and 4.

## Phase 6: Job Search Agent + Job List UI
Build the ReAct-style job search agent with tool use / fallback search, the job list (kanban-lite), job detail panel, and match scoring. This is the most complex feature and is deferred until the core CV pipeline works, since users can paste JDs manually in v1.0.

## Phase 7: i18n, Polish, Error Handling
Wire up react-i18next for es/en, add streaming support, rate-limit retry logic, edge case handling (scanned PDFs, long CVs, portal blocks), and final UI polish. This is the cleanup pass that makes the app production-ready.
