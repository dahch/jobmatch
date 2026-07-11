import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, ROUTE_SEO } from "@/shared/lib/seo-config";

interface SEOProps {
  route?: string;
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown>[];
}

export function SEO({
  route,
  title,
  description,
  image,
  noindex,
  structuredData,
}: SEOProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";
  const routeConfig = route ? ROUTE_SEO[route] : undefined;

  const resolvedTitle = title || routeConfig?.title || `${SITE_NAME} — AI Job Search & CV Optimization`;
  const resolvedDescription = description || routeConfig?.description || DEFAULT_DESCRIPTION;
  const resolvedPath = routeConfig?.path || route || "/";
  const resolvedNoindex = noindex ?? routeConfig?.noindex ?? false;
  const ogImage = image || `${SITE_URL}/og-default.png`;
  const canonicalUrl = `${SITE_URL}${resolvedPath}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      {resolvedNoindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:160, max-image-preview:large" />
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang for i18n */}
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}${resolvedPath}`} />
      <link rel="alternate" hrefLang="es" href={`${SITE_URL}/es${resolvedPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${resolvedPath}`} />

      {/* Open Graph */}
      <meta property="og:type" content={routeConfig?.ogType || "website"} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={lang === "es" ? "es_ES" : "en_US"} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Theme */}
      <meta name="theme-color" content="#6366f1" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Structured Data */}
      {structuredData?.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
