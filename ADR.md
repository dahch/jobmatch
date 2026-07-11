# ADR.md — Architecture Decision Records

> Key architectural decisions made during JobMatch AI development, one per entry.

---

## ADR-001: Client-Only Architecture (No Backend)

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: JobMatch AI needs to connect to AI providers, parse CVs, and generate PDFs. A traditional backend would handle API key management, file processing, and PDF generation server-side.
- **Decision**: Run everything in the browser. API keys stored in `localStorage`, CV parsing via web workers, PDF generation via `@react-pdf/renderer`. No backend server except a lightweight Vercel serverless proxy for CORS-restricted providers.
- **Consequences**:
  - Pros: Zero hosting cost for compute, no server maintenance, complete user privacy (data never touches our servers), instant deployment to Vercel.
  - Cons: API keys exposed in browser bundle (user's responsibility), limited by browser memory/CPU for large CVs, CORS restrictions require proxy workaround for some providers.

---

## ADR-002: Feature-Sliced Design (FSD) Architecture

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: The app has 4 distinct domain features (AI provider, job search, CV parser, CV builder) that share types and UI components but have independent business logic.
- **Decision**: Use Feature-Sliced Design with `app/`, `pages/`, `features/`, `shared/` layers. Each feature encapsulates its own stores, API calls, and feature-specific UI.
- **Consequences**:
  - Pros: Clear boundaries between features, easy to find code by domain, features can be developed independently.
  - Cons: Some indirection for newcomers to FSD, shared types require careful placement to avoid circular imports.

---

## ADR-003: Zustand Over Redux/Context

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: Need state management for AI provider config, search profiles, job offers, and CV data. Must persist to localStorage and support async operations.
- **Decision**: Use Zustand for all stores. Each feature gets its own store file. Persistence via custom `getStorageItem`/`setStorageItem` wrappers.
- **Consequences**:
  - Pros: Minimal boilerplate, no provider wrappers needed, hooks-based API is natural in React, easy to persist state.
  - Cons: No built-in middleware (must implement retry/persistence manually), no DevTools integration out of the box.

---

## ADR-004: Single-Shot AI Job Search (No Agent Loop)

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: Job search could use a ReAct agent loop with tool calling to search real job portals, or generate listings directly from AI.
- **Decision**: Single-shot approach — AI generates 5 realistic job listings from a structured prompt. No tool calling, no web scraping, no agent loop.
- **Consequences**:
  - Pros: Simple implementation, fast (one API call), works with all providers (including those without tool use), no CORS/scraping issues.
  - Cons: Generated listings are realistic but not real — users can't apply directly. Real job discovery is deferred to v1.1.

---

## ADR-005: Direct Browser API Access for AI Providers

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: Most AI providers have CORS headers that allow browser requests. A proxy would add latency and complexity.
- **Decision**: Make direct `fetch` calls from the browser to AI provider APIs. Only route through `/api/proxy` for providers that don't support browser CORS (currently NVIDIA NIM only).
- **Consequences**:
  - Pros: Lower latency, no server costs for most requests, simpler architecture.
  - Cons: API keys visible in browser network tab (user accepts this risk), some providers may change CORS policies.

---

## ADR-006: Lazy Loading with Suspense + ErrorBoundary

- **Date**: 2025-07-10 (commit `368db39`)
- **Status**: Accepted
- **Context**: All page components were eagerly loaded, making the initial bundle larger than necessary.
- **Decision**: Use `React.lazy()` + `Suspense` for all page routes. Each route wrapped in `ErrorBoundary` for graceful error handling.
- **Consequences**:
  - Pros: Smaller initial bundle, faster time-to-interactive, graceful degradation on errors.
  - Cons: Slight flash of loading spinner on first navigation, error boundaries catch render errors but not async errors.

---

## ADR-007: Inline i18n Resources (No External JSON)

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: i18n translations could be loaded from external JSON files or bundled inline.
- **Decision**: Define all translations directly in `i18n.ts` as JavaScript objects. No external JSON files.
- **Consequences**:
  - Pros: No async loading needed, no extra network requests, translations are type-safe (inferred from objects).
  - Cons: `i18n.ts` file is large (~350 lines), adding languages requires editing the source file, no hot-reload for translation changes.

---

## ADR-008: Deterministic Match Scoring (No AI)

- **Date**: 2025-07-01 (first commit)
- **Status**: Accepted
- **Context**: Match scoring could use AI to assess CV-to-job fit, or use deterministic algorithms.
- **Decision**: Deterministic scoring using set intersection with fuzzy matching. Weighted formula: skills (30%), technologies (35%), experience (20%), seniority (15%).
- **Consequences**:
  - Pros: Instant recalculation, no API cost, transparent and debuggable, works offline.
  - Cons: Less nuanced than AI assessment, can't understand semantic relationships between skills.

---

## ADR-009: CSS Custom Properties for Theming

- **Date**: 2025-07-08 (commit `adf80fa`)
- **Status**: Accepted
- **Context**: Need light/dark mode support that respects system preferences without a manual toggle.
- **Decision**: Define color tokens as CSS custom properties in `index.html` with `prefers-color-scheme` media queries. Tailwind config references these variables.
- **Consequences**:
  - Pros: System-preference aware automatically, no JavaScript needed for theme switching, easy to extend with new themes.
  - Cons: Can't theme dynamically at runtime (e.g., user-selected theme), CSS variables are global (no component-level isolation).

---

## ADR-010: Vercel Serverless Proxy for CORS-Restricted Providers

- **Date**: 2025-07-05 (commit `ec98d0a`)
- **Status**: Accepted
- **Context**: NVIDIA NIM doesn't set CORS headers for browser requests. Blocking the provider or requiring users to run their own proxy is unacceptable.
- **Decision**: Implement a stateless Vercel serverless function (`/api/proxy`) that forwards requests to the target API. Only used for providers in the `PROXIED_PROVIDERS` set.
- **Consequences**:
  - Pros: All providers work from the browser, no user configuration needed, proxy is stateless (no data logging).
  - Cons: Adds one network hop for proxied providers, Vercel function has cold start latency, limited to Vercel deployment.

---

*Architecture Decision Records for JobMatch AI — v1.0.0*
