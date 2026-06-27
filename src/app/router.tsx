import { createBrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { SettingsPage } from "@/pages/SettingsPage";
import { SearchPage } from "@/pages/SearchPage";
import { JobsPage } from "@/pages/JobsPage";
import { CVUploadPage } from "@/pages/CVUploadPage";
import { CVBuilderPage } from "@/pages/CVBuilderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <SearchPage />
      </ErrorBoundary>
    ),
  },
  {
    path: "/search",
    element: (
      <ErrorBoundary>
        <SearchPage />
      </ErrorBoundary>
    ),
  },
  {
    path: "/settings",
    element: (
      <ErrorBoundary>
        <SettingsPage />
      </ErrorBoundary>
    ),
  },
  {
    path: "/jobs",
    element: (
      <ErrorBoundary>
        <JobsPage />
      </ErrorBoundary>
    ),
  },
  {
    path: "/cv/upload",
    element: (
      <ErrorBoundary>
        <CVUploadPage />
      </ErrorBoundary>
    ),
  },
  {
    path: "/cv/builder",
    element: (
      <ErrorBoundary>
        <CVBuilderPage />
      </ErrorBoundary>
    ),
  },
]);
