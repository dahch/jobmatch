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
- **Decision**: Define color tokens as CSS custom properties in `src/index.css` with `prefers-color-scheme` media queries. Tailwind config references these variables.
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

## ADR-011: 404 Catch-All Route with i18n

- **Date**: 2025-07-11 (commit `3091507`)
- **Status**: Accepted
- **Context**: Hard-refreshing on client-side routes or navigating to undefined paths returned a blank page or Vercel's default 404.
- **Decision**: Add a `*` catch-all route in `router.tsx` pointing to `NotFoundPage`. The page uses i18n translations for the error message, renders inside the `Layout` component, and includes an SEO `<noindex>` tag.
- **Consequences**:
  - Pros: Consistent UX for invalid routes, i18n support, no SEO leakage of error pages.
  - Cons: Minor bundle addition (lazy-loaded).

---

## ADR-012: SEO via react-helmet-async + Static Files

- **Date**: 2025-07-11 (commits `11234aa`, `b92f68b`)
- **Status**: Accepted
- **Context**: The SPA had no SEO presence — no meta tags, no structured data, no sitemap. Search engines couldn't index routes, and social sharing showed generic or missing previews.
- **Decision**: Use `react-helmet-async` for per-route `<head>` management. Centralize SEO config in `seo-config.ts` with route keys. Add static `robots.txt` and `sitemap.xml` in `public/`. Render JSON-LD structured data (SoftwareApplication, Organization, WebSite, FAQPage) via a dedicated `StructuredData` component. Wrap the app in `HelmetProvider`.
- **Consequences**:
  - Pros: Per-route meta tags without complex SSR, structured data for rich search results, social sharing previews, i18n-aware hreflang.
  - Cons: Client-side rendering means crawlers that don't execute JS won't see meta tags (acceptable for Vercel-deployed SPA), sitemap is static (must be updated manually when routes change).

---

## ADR-013: Real Job Data Sources Replace AI-Generated Listings

- **Date**: 2026-07-11 (updated 2026-07-23)
- **Status**: Accepted
- **Context**: ADR-004 established a single-shot AI approach where the model generates 5 "realistic" job listings from a structured prompt, with no tool calling, scraping, or agent loop. In practice this means every listing — including URLs — is fabricated by the LLM. This holds regardless of provider quality (OpenAI, Anthropic, or free NVIDIA NIM/OpenRouter models all hallucinate equally plausible-but-fake postings), because there is no real data source behind the generation step. Users report broken links, stale-sounding listings, and no way to actually apply. Client-side scraping of LinkedIn/Indeed/InfoJobs is not viable: CORS blocks nearly all cross-origin requests to these sites, they require JS-heavy rendering and bot detection evasion (headless browser), and direct scraping violates their ToS.
- **Decision**: Replace AI-generated job discovery with real data sources, keeping the app frontend-first:
  - **Primary source: SerpApi (Google Jobs engine)**, called through the existing `/api/proxy` Vercel serverless function (established in ADR-010). SerpApi does not support direct browser calls under any circumstances — <cite index="10-1">SerpApi does not support Cross-Origin Resource Sharing, which is required to use APIs in a browser environment, because your API key would be exposed</cite> — so every search round-trips through the proxy, not just a CORS-restricted edge case. The API key is user-supplied (BYOK) via Settings and forwarded per-request by the proxy, never persisted server-side, consistent with the existing "keys never touch our servers to store" stance. Free tier is 250 searches/month per key, which is adequate for personal use plus occasional portfolio-demo traffic since each visitor would use their own key. SerpApi's Google Jobs engine aggregates listings Google itself indexes from LinkedIn, Indeed, ZipRecruiter, Workday, Lever, and direct company career pages, giving real `apply_options` deep links rather than a single equivocal source.
  - **Secondary source, conditional: Arbeitnow** (`https://arbeitnow.com/api/job-board-api`), called directly from the browser (confirmed CORS-enabled, free, no auth). Despite marketing itself as European, Arbeitnow's actual employer base is concentrated in Germany/DACH and remote-EU tech roles — testing a Barcelona/frontend/React search returned overwhelmingly German-language, German-city listings unrelated to the query. Arbeitnow is therefore only queried when the user's `SearchProfile` targets Germany, Austria, Switzerland, or explicit EU-remote — not as a default fallback for arbitrary locations. A separate bug was also observed where multi-value `tags[]` filters (e.g. `tags[0]=javascript&tags[1]=remote`) did not appear to filter results at all; this needs isolating and confirming against the raw API (single tag at a time) before Arbeitnow is wired into the adapter, independent of the regional-coverage decision above.
  - **Adzuna — evaluated and rejected.** Adzuna's live job-search endpoint is not available on its free tier; testing returned `"PRO FEATURE ONLY"` from the API (HTTP 400) even through the proxy. Revisit only if a paid Adzuna plan is justified later; not part of this architecture for now.
  - The user's configured AI provider (`aiClient`) is repurposed from _generating_ listings to _post-processing_ real results: normalizing fields across sources, optional semantic re-ranking on top of the existing deterministic `matchScore.ts`, and — unchanged — parsing pasted job descriptions (`parseJD.ts`).
  - `jobSearchAgent.ts` becomes a multi-source fetcher + merger/deduplicator instead of a prompt-to-JSON generator, with Arbeitnow's inclusion gated by profile location. If all applicable sources return zero results for a query, the UI should say so explicitly rather than falling back to AI generation.
- **Consequences**:
  - Pros: Listings have real, working apply links; no dependency on model quality/hallucination for factual accuracy; SerpApi's Google Jobs aggregation gives broad, location-accurate coverage instead of relying on one narrow board; extends the existing proxy pattern (ADR-005, ADR-010) instead of introducing a new layer; sources can be evaluated and added/removed independently as this ADR's Adzuna outcome shows.
  - Cons: The primary source (SerpApi) now depends on the serverless proxy being up for 100% of searches, not as an edge-case fallback — this is a bigger architectural reliance on server-side execution than any prior ADR, even though it doesn't require a stateful backend. SerpApi's API key is BYOK but does pass through the proxy server per-request (unlike most AI providers, which the browser can call directly), a bigger trust ask than prior proxied cases. Free-tier SerpApi quota (250/month) is a hard ceiling per user; Arbeitnow's regional gating means many searches (anything outside DACH) have no free fallback if SerpApi quota is exhausted. Match quality depends on how well each source's taxonomy maps to the user's `SearchProfile`. `jobSearchAgent.ts` and its tests need a non-trivial rewrite (source adapters, merge/dedupe logic, regional gating) rather than a small patch.
- **Deferred**: Full scraping coverage beyond what SerpApi/Google Jobs already aggregates (e.g. direct LinkedIn/Indeed scraping) requires a headless-browser scraping service and is tracked separately — it does not require abandoning the frontend-first architecture, since it can be called from the same serverless proxy pattern rather than a dedicated backend. The Arbeitnow `tags[]` filtering bug is also deferred for isolated debugging before that source is wired in.

_Architecture Decision Records for JobMatch AI — v1.0.1_
