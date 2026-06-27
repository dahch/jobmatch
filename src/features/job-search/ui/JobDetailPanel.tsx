import { useTranslation } from "react-i18next";
import { X, ExternalLink, FileText } from "lucide-react";
import { Button, Badge } from "@/shared/ui";
import type { JobOffer } from "@/shared/types";
import type { MatchResult } from "@/features/job-search/api/matchScore";

interface JobDetailPanelProps {
  job: JobOffer;
  matchResult: MatchResult | null;
  hasCV: boolean;
  isGenerating: boolean;
  onGenerateCV: () => void;
  onClose: () => void;
}

export function JobDetailPanel({
  job,
  matchResult,
  hasCV,
  isGenerating,
  onGenerateCV,
  onClose,
}: JobDetailPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-surface-200 shadow-panel z-50 overflow-auto animate-slide-in">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-surface-100 p-5 flex items-start justify-between z-10">
        <div>
          <h2 className="text-lg font-semibold text-surface-800">
            {job.title}
          </h2>
          <p className="text-sm text-surface-500 mt-0.5">
            {job.company} · {job.location}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg p-1.5 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={
              job.modality === "Remote"
                ? "success"
                : job.modality === "Hybrid"
                  ? "warning"
                  : "default"
            }
          >
            {job.modality}
          </Badge>
          <Badge variant="default">{job.source_portal}</Badge>
          {job.posted_at && (
            <span className="text-[11px] text-surface-400 font-mono">
              {job.posted_at}
            </span>
          )}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
            >
              {t("job_detail.view_original")} <ExternalLink size={11} />
            </a>
          )}
          {!job.url && job.source_portal && (
            <a
              href={getPortalSearchUrl(job.source_portal, job.company)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
            >
              Search on {job.source_portal} <ExternalLink size={11} />
            </a>
          )}
        </div>

        {matchResult && (
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-surface-600 uppercase tracking-wide">
                {t("job_detail.match_score")}
              </span>
              <span
                className={`text-2xl font-bold ${
                  matchResult.score >= 70
                    ? "text-emerald-600"
                    : matchResult.score >= 40
                      ? "text-amber-600"
                      : "text-red-500"
                }`}
              >
                {matchResult.score}%
              </span>
            </div>
            <div className="space-y-2">
              {(
                ["skills", "technologies", "experience", "seniority"] as const
              ).map((key) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-surface-500 w-20 capitalize font-medium">
                    {key}
                  </span>
                  <div className="flex-1 bg-surface-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        matchResult.breakdown[key] >= 70
                          ? "bg-emerald-500"
                          : matchResult.breakdown[key] >= 40
                            ? "bg-amber-500"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${matchResult.breakdown[key]}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-surface-400 w-8 text-right font-mono">
                    {matchResult.breakdown[key]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchResult && (
          <div className="grid grid-cols-2 gap-3">
            {matchResult.matchedTech.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
                  {t("job_detail.matched_tech")}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {matchResult.matchedTech.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100/60 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {matchResult.missingTech.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-red-500 uppercase tracking-wide mb-1.5">
                  {t("job_detail.missing_tech")}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {matchResult.missingTech.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100/60 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {job.extracted_requirements.technologies.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">
              {t("job_detail.technologies")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {job.extracted_requirements.technologies.map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md border border-sky-100/60 font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.extracted_requirements.must_have.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">
              {t("job_detail.must_have")}
            </h4>
            <ul className="space-y-1.5">
              {job.extracted_requirements.must_have.map((r, i) => (
                <li
                  key={i}
                  className="text-sm text-surface-600 flex items-start gap-2"
                >
                  <span className="text-red-400 mt-1 text-xs">&#9679;</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.extracted_requirements.nice_to_have.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">
              {t("job_detail.nice_to_have")}
            </h4>
            <ul className="space-y-1.5">
              {job.extracted_requirements.nice_to_have.map((r, i) => (
                <li
                  key={i}
                  className="text-sm text-surface-600 flex items-start gap-2"
                >
                  <span className="text-amber-400 mt-1 text-xs">&#9679;</span>{" "}
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.extracted_requirements.languages &&
          job.extracted_requirements.languages.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">
                {t("job_detail.languages")}
              </h4>
              <p className="text-sm text-surface-600">
                {job.extracted_requirements.languages.join(", ")}
              </p>
            </div>
          )}

        <div>
          <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">
            {t("job_detail.full_jd")}
          </h4>
          <div className="text-sm text-surface-600 whitespace-pre-wrap leading-relaxed bg-surface-50 rounded-lg p-4 max-h-96 overflow-auto border border-surface-100">
            {job.raw_description}
          </div>
        </div>

        {job.ats_keywords.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">
              {t("job_detail.ats_keywords")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {job.ats_keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100/60 font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasCV && (
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-surface-100 p-5 -m-5 mt-5">
            <Button
              onClick={onGenerateCV}
              isLoading={isGenerating}
              className="w-full"
            >
              <FileText size={15} className="mr-2" />
              {t("job_detail.generate_for_offer")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getPortalSearchUrl(portal: string, company: string): string {
  const q = encodeURIComponent(`${company}`);
  const p = portal.toLowerCase();
  if (p.includes("linkedin"))
    return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
  if (p.includes("indeed")) return `https://www.indeed.com/jobs?q=${q}`;
  if (p.includes("infojobs"))
    return `https://www.infojobs.net/ofertas-trabajo?keywords=${q}`;
  if (p.includes("glassdoor"))
    return `https://www.glassdoor.com/Job/jobs.htm?keyword=${q}`;
  if (p.includes("wellfound") || p.includes("angel"))
    return `https://wellfound.com/roles?q=${q}`;
  return `https://www.google.com/search?q=${q}+jobs`;
}
