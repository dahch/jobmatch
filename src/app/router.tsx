import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Spinner } from "@/shared/ui";

const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then(m => ({ default: m.SearchPage })));
const JobsPage = lazy(() => import("@/pages/JobsPage").then(m => ({ default: m.JobsPage })));
const CVUploadPage = lazy(() => import("@/pages/CVUploadPage").then(m => ({ default: m.CVUploadPage })));
const CVBuilderPage = lazy(() => import("@/pages/CVBuilderPage").then(m => ({ default: m.CVBuilderPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <LazyPage><SearchPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
  {
    path: "/search",
    element: (
      <ErrorBoundary>
        <LazyPage><SearchPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
  {
    path: "/settings",
    element: (
      <ErrorBoundary>
        <LazyPage><SettingsPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
  {
    path: "/jobs",
    element: (
      <ErrorBoundary>
        <LazyPage><JobsPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
  {
    path: "/cv/upload",
    element: (
      <ErrorBoundary>
        <LazyPage><CVUploadPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
  {
    path: "/cv/builder",
    element: (
      <ErrorBoundary>
        <LazyPage><CVBuilderPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
  {
    path: "*",
    element: (
      <ErrorBoundary>
        <LazyPage><NotFoundPage /></LazyPage>
      </ErrorBoundary>
    ),
  },
]);
