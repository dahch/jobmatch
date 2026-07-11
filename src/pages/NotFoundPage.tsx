import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Layout } from "@/shared/ui/Layout";
import { SEO } from "@/shared/ui/SEO";
import { Button } from "@/shared/ui";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Layout>
      <SEO
        title="Page Not Found — JobMatch AI"
        description="The page you are looking for does not exist or has been moved."
        noindex
      />
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
          <Search size={28} className="text-surface-400" />
        </div>
        <h1 className="text-4xl font-bold text-surface-900 mb-2">404</h1>
        <p className="text-surface-500 mb-8 max-w-md">
          {t("not_found.message", "The page you're looking for doesn't exist or has been moved.")}
        </p>
        <Link to="/">
          <Button>{t("not_found.go_home", "Back to Home")}</Button>
        </Link>
      </div>
    </Layout>
  );
}
