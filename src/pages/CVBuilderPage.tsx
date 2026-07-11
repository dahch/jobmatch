import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Download,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Palette,
} from "lucide-react";
import { Button } from "@/shared/ui";
import { Layout } from "@/shared/ui/Layout";
import { SEO } from "@/shared/ui/SEO";
import { useCVStore } from "@/features/cv-builder/model/store";
import { useJobsStore } from "@/features/job-search/model/store";
import { CVDiffViewer } from "@/features/cv-builder/ui/CVDiffViewer";
import { CVEditor } from "@/features/cv-builder/ui/CVEditor";
import {
  generatePDF,
  downloadBlob,
  getFilename,
} from "@/features/cv-builder/lib/pdfExporter";
import { MinimalTemplate } from "@/features/cv-builder/templates/MinimalTemplate";
import { ProfessionalTemplate } from "@/features/cv-builder/templates/ProfessionalTemplate";
import { TechnicalTemplate } from "@/features/cv-builder/templates/TechnicalTemplate";
import type { TemplateName } from "@/features/cv-builder/templates";
import type { OptimizedCV } from "@/shared/types";
import { PDFViewer } from "@react-pdf/renderer";

const ACCENT_COLORS = [
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#be185d",
  "#374151",
];

export function CVBuilderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { parsedCV, optimizedCVs, isGeneratingCV, generationError } =
    useCVStore();
  const { jobs } = useJobsStore();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [template, setTemplate] = useState<TemplateName>("minimal");
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [editing, setEditing] = useState(false);
  const [currentCV, setCurrentCV] = useState<OptimizedCV | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selected = selectedIdx !== null ? optimizedCVs[selectedIdx] : null;
  const displayCV = currentCV || selected?.cv || null;

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setCurrentCV(null);
    setEditing(false);
    setShowPreview(false);
  };

  const handleDownload = async () => {
    if (!displayCV) return;
    setDownloading(true);
    try {
      const blob = await generatePDF(displayCV, template, accentColor);
      downloadBlob(blob, getFilename(displayCV));
    } catch (err) {
      if (import.meta.env.DEV) console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const templateElement = useMemo(() => {
    if (!displayCV) return null;
    switch (template) {
      case "professional":
        return <ProfessionalTemplate cv={displayCV} accentColor={accentColor} />;
      case "technical":
        return <TechnicalTemplate cv={displayCV} />;
      default:
        return <MinimalTemplate cv={displayCV} />;
    }
  }, [displayCV, template, accentColor]);

  if (!parsedCV) {
    return (
      <Layout>
        <SEO route="/cv/builder" />
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
              <FileText size={18} className="text-surface-500" />
            </div>
            <h1 className="text-xl font-semibold text-surface-900">
              {t("cv_builder.title")}
            </h1>
          </div>
        </div>
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <FileText className="h-7 w-7 text-surface-300" />
          </div>
          <p className="text-base font-medium text-surface-700 mb-1">
            {t("cv_builder.upload_first")}
          </p>
          <p className="text-sm text-surface-400 mb-5">
            {t("cv_builder.subtitle")}
          </p>
          <Button onClick={() => navigate("/cv/upload")}>
            {t("cv_builder.upload_cv_button")}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO route="/cv/builder" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
              <FileText size={18} className="text-surface-500" />
            </div>
            <h1 className="text-xl font-semibold text-surface-900">
              {t("cv_builder.title")}
            </h1>
          </div>
          <p className="text-sm text-surface-400 ml-12">
            {t("cv_builder.subtitle")}
          </p>
        </div>
        {selected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedIdx(null);
              setCurrentCV(null);
              setEditing(false);
            }}
          >
            <ChevronLeft size={14} className="mr-1" /> {t("cv_builder.title")}
          </Button>
        )}
      </div>

      {isGeneratingCV && (
        <div className="bg-brand-50 border border-brand-100/60 rounded-xl p-4 mb-4 text-sm text-brand-600 flex items-center gap-2">
          <Loader2 size={15} className="animate-spin" />
          <span>{t("cv_builder.generating")}</span>
        </div>
      )}

      {generationError && (
        <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 mb-4 text-sm text-red-600">
          {generationError}
        </div>
      )}

      {selectedIdx === null ? (
        optimizedCVs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
              <FileText className="h-7 w-7 text-surface-300" />
            </div>
            <p className="text-base font-medium text-surface-700 mb-1">
              {t("cv_builder.no_cvs")}
            </p>
            <p className="text-sm text-surface-400 mb-5">
              {t("cv_builder.no_cvs_hint")}
            </p>
            <Button onClick={() => navigate("/jobs")}>
              {t("cv_builder.browse_jobs")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {optimizedCVs.map((entry, i) => {
              const entryJob = jobs.find((j) => j.id === entry.jobId);
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className="card-interactive w-full text-left p-4 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-surface-800 group-hover:text-brand-600 transition-colors">
                        {entry.cv.target_job}
                      </h3>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {entry.cv.target_company}
                      </p>
                      <p className="text-[11px] text-surface-400 font-mono mt-1">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                      {entry.cv.ats_keywords_used.slice(0, 4).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100/60 font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                  {entryJob && (
                    <p className="mt-2.5 text-xs text-surface-400 line-clamp-1">
                      {entryJob.raw_description.slice(0, 100)}...
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )
      ) : displayCV ? (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-surface-200">
              <div>
                <h2 className="text-base font-semibold text-surface-800">
                  {displayCV.target_job}
                </h2>
                <p className="text-sm text-surface-500 mt-0.5">
                  {displayCV.target_company}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    value={template}
                    onChange={(e) =>
                      setTemplate(e.target.value as TemplateName)
                    }
                    className="appearance-none text-sm border border-surface-200 rounded-lg px-3 py-1.5 pr-7 text-surface-700 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  >
                    <option value="minimal">
                      {t("cv_builder.template_minimal")}
                    </option>
                    <option value="professional">
                      {t("cv_builder.template_professional")}
                    </option>
                    <option value="technical">
                      {t("cv_builder.template_technical")}
                    </option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                  />
                </div>
                {template === "professional" && (
                  <div className="flex items-center gap-1 ml-1">
                    <Palette size={13} className="text-surface-400" />
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setAccentColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          accentColor === c
                            ? "border-surface-800 scale-110"
                            : "border-surface-200 hover:border-surface-300"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing((e) => !e)}
                >
                  <Edit3 size={13} className="mr-1" />{" "}
                  {editing ? t("cv_builder.done") : t("cv_builder.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPreview((p) => !p)}
                >
                  <Eye size={13} className="mr-1" />{" "}
                  {showPreview ? t("cv_builder.hide") : t("cv_builder.preview")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  isLoading={downloading}
                >
                  <Download size={13} className="mr-1" />{" "}
                  {t("cv_builder.download")}
                </Button>
              </div>
            </div>

            {editing ? (
              <CVEditor
                cv={displayCV}
                onSave={(updated) => {
                  setCurrentCV(updated);
                  setEditing(false);
                }}
                onCancel={() => {
                  setEditing(false);
                  setCurrentCV(null);
                }}
              />
            ) : (
              <div className="text-sm text-surface-600 space-y-2">
                <p>
                  <span className="text-surface-400">
                    {t("cv_builder.contact")}
                  </span>{" "}
                  {displayCV.contact.email} · {displayCV.contact.phone} ·{" "}
                  {displayCV.contact.location}
                </p>
                {displayCV.summary && (
                  <p>
                    <span className="text-surface-400">
                      {t("cv_builder.summary_label")}
                    </span>{" "}
                    {displayCV.summary}
                  </p>
                )}
                <p>
                  <span className="text-surface-400">
                    {t("cv_builder.experience_label")}
                  </span>{" "}
                  {displayCV.work_experience.length} {t("cv_upload.positions")}
                </p>
                <p>
                  <span className="text-surface-400">
                    {t("cv_builder.skills_label")}
                  </span>{" "}
                  {displayCV.skills.map((s) => s.category).join(", ")}
                </p>
              </div>
            )}
          </div>

          {parsedCV && !editing && (
            <CVDiffViewer original={parsedCV} optimized={displayCV} />
          )}

          {showPreview && !editing && templateElement && (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-50 border-b border-surface-100 text-xs text-surface-400 text-center font-medium">
                {t("cv_builder.pdf_preview")}
              </div>
              <PDFViewer key={template} width="100%" height={800} showToolbar={false}>
                {templateElement}
              </PDFViewer>
            </div>
          )}
        </div>
      ) : null}
    </Layout>
  );
}
