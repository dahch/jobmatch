import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileText, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/shared/ui/Layout";
import { SEO } from "@/shared/ui/SEO";
import { Button } from "@/shared/ui";
import { useCVStore } from "@/features/cv-builder/model/store";
import { useAIProviderStore } from "@/features/ai-provider/model/store";

export function CVUploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { parsedCV, isParsingCV, setParsedCV, setIsParsingCV } = useCVStore();
  const config = useAIProviderStore((s) => s.config);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!config) {
      setError(
        t("cv_upload.no_provider") ||
          "AI provider not configured. Go to Settings first.",
      );
      return;
    }
    setIsParsingCV(true);
    setError(null);
    try {
      const { parseCVFile } = await import("@/features/cv-parser/lib/cvParser");
      const cv = await parseCVFile(file, config);
      setParsedCV(cv);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("cv.parse_failed");
      setError(msg);
      if (import.meta.env.DEV) console.error("CV parsing failed:", err);
    } finally {
      setIsParsingCV(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Layout>
      <SEO route="/cv/upload" />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
            <Upload size={18} className="text-surface-500" />
          </div>
          <h1 className="text-xl font-semibold text-surface-900">
            {t("cv.upload_title")}
          </h1>
        </div>
        <p className="text-sm text-surface-400 ml-12">
          {t("cv_upload.subtitle")}
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-14 text-center transition-all duration-200 cursor-pointer ${
          dragActive
            ? "border-brand-400 bg-brand-50/50 shadow-glow"
            : "border-surface-200 hover:border-surface-300 hover:bg-surface-50/50"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          className="hidden"
          id="cv-upload"
        />
        <label htmlFor="cv-upload" className="cursor-pointer">
          {isParsingCV ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center animate-pulse-subtle">
                <div className="animate-spin h-6 w-6 border-[2.5px] border-brand-500 border-t-transparent rounded-full" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-700">
                  {t("cv.parsing")}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  {t("cv_upload.processing")}
                </p>
              </div>
            </div>
          ) : parsedCV ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  {t("cv.parsed_success")}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  {parsedCV.full_name}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {t("cv_upload.upload_different")}
                </Button>
                <Button size="sm" onClick={() => navigate("/jobs")}>
                  {t("cv_upload.browse_jobs")}{" "}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-surface-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-700">
                  {t("cv.drag_drop")}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  {t("cv.supported_formats")}
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-5 bg-red-50 border border-red-200/60 rounded-xl p-4 text-sm text-red-600">
          <p className="font-medium mb-1 text-red-700">
            {t("cv_upload.parse_failed")}
          </p>
          <p>{error}</p>
        </div>
      )}

      {parsedCV && (
        <div className="mt-6 card p-6 animate-fade-in">
          <h2 className="text-sm font-semibold text-surface-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-surface-400" />
            {t("cv_upload.preview_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-xs text-surface-400 block">
                {t("cv_upload.name")}
              </span>
              <span className="text-surface-700 font-medium">
                {parsedCV.full_name}
              </span>
            </div>
            <div>
              <span className="text-xs text-surface-400 block">
                {t("cv_upload.email")}
              </span>
              <span className="text-surface-700 font-medium">
                {parsedCV.contact.email || "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-surface-400 block">
                {t("cv_upload.experience")}
              </span>
              <span className="text-surface-700 font-medium">
                {parsedCV.work_experience.length} {t("cv_upload.positions")}
              </span>
            </div>
            <div>
              <span className="text-xs text-surface-400 block">
                {t("cv_upload.education")}
              </span>
              <span className="text-surface-700 font-medium">
                {parsedCV.education.length} {t("cv_upload.entries")}
              </span>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
