import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings, Search, Briefcase, Upload, FileText, Globe, Sparkles } from "lucide-react";
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

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "es" : "en");
  };

  return (
    <div className="min-h-screen flex bg-surface-50">
      <aside className="w-60 flex flex-col bg-surface-900 text-white">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">JobMatch AI</h1>
              <p className="text-[10px] text-surface-400 font-mono">v1.0.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ path, icon: Icon, labelKey }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                  active
                    ? "bg-brand-600/20 text-brand-300 shadow-[inset_0_0_0_1px_rgba(51,102,255,0.2)]"
                    : "text-surface-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={16} className={cn("transition-colors", active ? "text-brand-400" : "text-surface-500 group-hover:text-surface-300")} />
                {t(labelKey)}
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <Globe size={14} />
            <span className="font-mono">{i18n.language === "en" ? "ES" : "EN"}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
