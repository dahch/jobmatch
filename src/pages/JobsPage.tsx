import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/shared/ui/Layout";
import { Button, Badge, Modal } from "@/shared/ui";
import { useJobsStore } from "@/features/job-search/model/store";
import { useCVStore } from "@/features/cv-builder/model/store";
import { useAIProviderStore } from "@/features/ai-provider/model/store";
import { calculateMatchScore } from "@/features/job-search/api/matchScore";
import { parseJDText } from "@/features/job-search/api/parseJD";
import { JobDetailPanel } from "@/features/job-search/ui/JobDetailPanel";
import {
  Briefcase,
  ExternalLink,
  Trash2,
  Search,
  FileText,
  ClipboardPlus,
  Loader2,
} from "lucide-react";
import type { JobOffer } from "@/shared/types";

const statusColors = {
  new: "info" as const,
  reviewing: "warning" as const,
  applied: "success" as const,
  discarded: "danger" as const,
};

export function JobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    jobs,
    isSearching,
    searchProgress,
    searchError,
    updateJobStatus,
    clearJobs,
    addJob,
  } = useJobsStore();
  const { parsedCV, isGeneratingCV, generationError, generateOptimizedCV } =
    useCVStore();
  const aiConfig = useAIProviderStore((s) => s.config);

  const [selectedDetail, setSelectedDetail] = useState<JobOffer | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const matchScores = useMemo(() => {
    if (!parsedCV) return {};
    const scores: Record<string, ReturnType<typeof calculateMatchScore>> = {};
    for (const job of jobs) {
      scores[job.id] = calculateMatchScore(parsedCV, job);
    }
    return scores;
  }, [parsedCV, jobs]);

  const handleGenerateCV = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job && aiConfig) {
      await generateOptimizedCV(job, aiConfig);
      navigate("/cv/builder");
    }
  };

  const handlePasteJD = async () => {
    if (!pasteText.trim()) return;
    if (!aiConfig) {
      setPasteError(t("jd_paste.no_provider"));
      return;
    }
    setParsing(true);
    setPasteError(null);
    try {
      const job = await parseJDText(aiConfig, pasteText.trim());
      addJob(job);
      setPasteOpen(false);
      setPasteText("");
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : t("jd_paste.error"));
    } finally {
      setParsing(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
              <Briefcase size={18} className="text-surface-500" />
            </div>
            <h1 className="text-xl font-semibold text-surface-900">
              {t("jobs.title")}
            </h1>
          </div>
          <p className="text-sm text-surface-400 ml-12">
            {jobs.length > 0
              ? t("jobs_page.count_found", { count: jobs.length })
              : t("jobs_page.count_none")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPasteOpen(true)}
          >
            <ClipboardPlus size={14} className="mr-1" />
            {t("jobs.paste_jd")}
          </Button>
          {jobs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearJobs}>
              <Trash2 size={14} className="mr-1" />
              {t("jobs.clear_all")}
            </Button>
          )}
          <Button size="sm" onClick={() => navigate("/search")}>
            <Search size={14} className="mr-1" />
            {t("jobs.new_search")}
          </Button>
        </div>
      </div>

      {isSearching && (
        <div className="bg-brand-50 border border-brand-100/60 rounded-xl p-4 mb-4 text-sm text-brand-600 flex items-center gap-2">
          <Loader2 size={15} className="animate-spin" />
          <span>{searchProgress?.phase || t("search.searching")}</span>
        </div>
      )}

      {searchError && (
        <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 mb-4 text-sm text-red-600">
          {searchError}
        </div>
      )}

      {generationError && (
        <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 mb-4 text-sm text-red-600">
          {generationError}
        </div>
      )}

      {!parsedCV && jobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-4 text-sm text-amber-700">
          {t("jobs.upload_cv_hint")}{" "}
          <a href="/cv/upload" className="underline font-medium text-amber-800">
            {t("jobs.upload_cv_link")}
          </a>
        </div>
      )}

      {jobs.length === 0 && !isSearching ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <Briefcase className="h-7 w-7 text-surface-300" />
          </div>
          <p className="text-base font-medium text-surface-700 mb-1">
            {t("jobs.no_jobs")}
          </p>
          <p className="text-sm text-surface-400 mb-5">{t("jobs_page.hint")}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate("/search")}>
              {t("jobs.go_to_search")}
            </Button>
            <Button variant="outline" onClick={() => setPasteOpen(true)}>
              {t("jobs.paste_a_jd")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const match = matchScores[job.id];
            return (
              <div
                key={job.id}
                onClick={() => setSelectedDetail(job)}
                className="card-interactive p-4 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-surface-800 group-hover:text-brand-600 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-surface-500 mt-0.5">
                      {job.company} · {job.location}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-surface-400 font-mono">
                        {job.source_portal}
                      </span>
                      {job.modality !== "Unknown" && (
                        <Badge variant="default">{job.modality}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 sm:self-start self-end">
                    <Badge variant={statusColors[job.status]}>
                      {t(`jobs.status.${job.status}`)}
                    </Badge>
                    {match && (
                      <Badge
                        variant={
                          match.score >= 70
                            ? "success"
                            : match.score >= 40
                              ? "warning"
                              : "danger"
                        }
                      >
                        {match.score}%
                      </Badge>
                    )}
                    <a
                      href={
                        job.url ||
                        `https://www.google.com/search?q=${encodeURIComponent(job.company + " " + job.title + " jobs")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-surface-300 hover:text-brand-500 transition-colors"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
                {job.raw_description && (
                  <p className="mt-2.5 text-sm text-surface-500 line-clamp-2 leading-relaxed">
                    {job.raw_description.slice(0, 250)}...
                  </p>
                )}
                {job.extracted_requirements.technologies.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {job.extracted_requirements.technologies
                      .slice(0, 6)
                      .map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    {job.extracted_requirements.technologies.length > 6 && (
                      <span className="text-[10px] text-surface-400">
                        +
                        {t("jobs_page.more", {
                          count:
                            job.extracted_requirements.technologies.length - 6,
                        })}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-surface-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    {(
                      ["new", "reviewing", "applied", "discarded"] as const
                    ).map((status) => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateJobStatus(job.id, status);
                        }}
                        className={`text-[11px] px-2 py-1 rounded-md font-medium transition-all ${
                          job.status === status
                            ? "bg-brand-50 text-brand-600 border border-brand-100"
                            : "text-surface-400 hover:text-surface-600 hover:bg-surface-50 border border-transparent"
                        }`}
                      >
                        {t(`jobs.status.${status}`)}
                      </button>
                    ))}
                  </div>
                  {parsedCV && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateCV(job.id);
                      }}
                      isLoading={isGeneratingCV}
                    >
                      <FileText size={13} className="mr-1" />{" "}
                      {t("jobs.generate_cv")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={pasteOpen}
        onClose={() => {
          setPasteOpen(false);
          setPasteError(null);
        }}
        title={t("jd_paste.title")}
      >
        <div className="space-y-4">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={t("jd_paste.placeholder")}
            rows={12}
            className="w-full border border-surface-200 rounded-lg p-3 text-sm text-surface-800 placeholder:text-surface-400 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none"
          />
          {pasteError && <p className="text-sm text-red-500">{pasteError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPasteOpen(false);
                setPasteError(null);
              }}
            >
              {t("jd_paste.cancel")}
            </Button>
            <Button
              onClick={handlePasteJD}
              isLoading={parsing}
              disabled={!pasteText.trim()}
            >
              {parsing ? t("jd_paste.parsing") : t("jd_paste.parse")}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedDetail && (
        <JobDetailPanel
          job={selectedDetail}
          matchResult={parsedCV ? matchScores[selectedDetail.id] || null : null}
          hasCV={!!parsedCV}
          isGenerating={isGeneratingCV}
          onGenerateCV={() => handleGenerateCV(selectedDetail.id)}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </Layout>
  );
}
