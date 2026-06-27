import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { ParsedCV, OptimizedCV } from "@/shared/types";

interface CVDiffViewerProps {
  original: ParsedCV;
  optimized: OptimizedCV;
}

export function CVDiffViewer({ original, optimized }: CVDiffViewerProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const changes = optimized.changes_summary || [];
  const keywords = optimized.ats_keywords_used || [];

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 bg-surface-50 hover:bg-surface-100/80 transition-colors border-b border-surface-100"
      >
        <span className="text-[13px] font-medium text-surface-700 flex items-center gap-2">
          <FileText size={15} className="text-surface-400" /> {t("cv_builder.changes_title")}
        </span>
        {expanded ? <ChevronUp size={15} className="text-surface-400" /> : <ChevronDown size={15} className="text-surface-400" />}
      </button>

      {expanded && (
        <div className="p-5 space-y-5 animate-fade-in">
          {changes.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-2">{t("cv_builder.changes_made")}</h4>
              <ul className="space-y-1.5">
                {changes.map((c, i) => (
                  <li key={i} className="text-sm text-surface-600 flex items-start gap-2">
                    <span className="text-brand-400 mt-1 text-xs">&#9679;</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {keywords.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-2">{t("cv_builder.ats_keywords")}</h4>
              <div className="flex flex-wrap gap-1">
                {keywords.map((kw) => (
                  <span key={kw} className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100/60 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">{t("cv_builder.original_summary")}</h4>
              <p className="text-sm text-surface-600 bg-surface-50 p-3 rounded-lg border border-surface-100 leading-relaxed">{original.summary || "—"}</p>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">{t("cv_builder.optimized_summary")}</h4>
              <p className="text-sm text-surface-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/40 leading-relaxed">{optimized.summary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
