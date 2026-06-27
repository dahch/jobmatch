import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Settings,
  Search,
  Briefcase,
  Upload,
  FileText,
  Globe,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { path: "/settings", icon: Settings, labelKey: "nav.settings" },
  { path: "/search", icon: Search, labelKey: "nav.search" },
  { path: "/jobs", icon: Briefcase, labelKey: "nav.jobs" },
  { path: "/cv/upload", icon: Upload, labelKey: "nav.cv_upload" },
  { path: "/cv/builder", icon: FileText, labelKey: "nav.cv_builder" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "es" : "en");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-50 text-surface-600">
      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-white border-b border-sidebar-border flex items-center justify-between px-4 sticky top-0 z-30 w-full select-none">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="text-sidebar-muted hover:text-sidebar-text p-1.5 rounded-lg hover:bg-sidebar-hoverBg transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="bg-gradient-to-r from-surface-900 via-brand-600 to-brand-500 dark:from-white dark:via-brand-300 dark:to-brand-200 bg-clip-text text-sm font-semibold tracking-tight text-transparent">
          JobMatch AI
        </span>
        <button
          onClick={toggleLang}
          className="text-xs font-mono text-sidebar-muted p-1.5 rounded-lg hover:bg-sidebar-hoverBg transition-colors"
        >
          {i18n.language === "en" ? "ES" : "EN"}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm z-35 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar / Navigation Drawer */}
      <aside
        className={cn(
          "sidebar-menu-aside w-60 flex flex-col border-r border-sidebar-border text-sidebar-text select-none",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 via-brand-500 to-indigo-600 flex items-center justify-center shadow-glow">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-surface-900 via-brand-600 to-brand-500 dark:from-white dark:via-brand-300 dark:to-brand-200 bg-clip-text text-sm font-semibold tracking-tight text-transparent">
                JobMatch AI
              </h1>
              <p className="text-[10px] text-brand-600 dark:text-brand-300 font-mono">
                v1.0.0
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hoverBg rounded-lg p-1.5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, icon: Icon, labelKey }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative overflow-hidden border border-transparent",
                  active
                    ? "bg-sidebar-activeBg text-sidebar-activeText border-brand-500/10 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.08)]"
                    : "text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hoverBg hover:border-sidebar-border/30",
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    "transition-colors",
                    active
                      ? "text-sidebar-activeText"
                      : "text-sidebar-muted group-hover:text-sidebar-text",
                  )}
                />
                {t(labelKey)}
                {active && (
                  <div className="ml-auto w-1 h-3 rounded-full bg-sidebar-activeText shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border md:block hidden">
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hoverBg transition-all w-full border border-transparent hover:border-sidebar-border/30"
          >
            <Globe size={14} className="text-brand-500 dark:text-brand-400" />
            <span className="font-mono text-xs">
              {i18n.language === "en" ? "ES" : "EN"}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
