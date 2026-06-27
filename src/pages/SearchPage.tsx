import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, Loader2, ChevronDown } from "lucide-react";
import { Layout } from "@/shared/ui/Layout";
import { Button, Input, Textarea } from "@/shared/ui";
import { useJobSearchStore } from "@/features/job-search/model/profileStore";
import { useJobsStore } from "@/features/job-search/model/store";
import { useAIProviderStore } from "@/features/ai-provider/model/store";
import type { SearchProfile, Modality, Seniority } from "@/shared/types";

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs px-2 py-1 rounded-md border border-brand-100/60 font-medium"
          >
            {tag}
            <button
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="hover:text-brand-800 transition-colors"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="block flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}

export function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, setProfile } = useJobSearchStore();
  const {
    isSearching,
    searchProgress,
    searchError,
    searchJobs: runSearch,
  } = useJobsStore();
  const aiConfig = useAIProviderStore((s) => s.config);

  const [form, setForm] = useState<SearchProfile>(
    profile || {
      job_titles: [],
      technologies: [],
      location: "",
      modality: "Any",
      seniority: "Any",
      exclude_keywords: [],
      extra_context: "",
    },
  );

  const handleSave = () => {
    setProfile(form);
  };

  const handleSearch = async () => {
    if (!aiConfig) return;
    setProfile(form);
    await runSearch(aiConfig);
    navigate("/jobs");
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
            <Search size={18} className="text-surface-500" />
          </div>
          <h1 className="text-xl font-semibold text-surface-900">
            {t("search.title")}
          </h1>
        </div>
        <p className="text-sm text-surface-400 ml-12">
          {t("search_page.subtitle")}
        </p>
      </div>

      <div className="card p-6 max-w-xl space-y-5 animate-fade-in">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-surface-600 block">
            {t("search.job_titles")}
          </label>
          <TagInput
            value={form.job_titles}
            onChange={(job_titles) => setForm({ ...form, job_titles })}
            placeholder={t("search_page.placeholder_titles")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-surface-600 block">
            {t("search.technologies")}
          </label>
          <TagInput
            value={form.technologies}
            onChange={(technologies) => setForm({ ...form, technologies })}
            placeholder={t("search_page.placeholder_tech")}
          />
        </div>

        <Input
          label={t("search.location")}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder={t("search_page.placeholder_location")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-surface-600 block">
              {t("search.modality")}
            </label>
            <div className="relative">
              <select
                value={form.modality}
                onChange={(e) =>
                  setForm({ ...form, modality: e.target.value as Modality })
                }
                className="block w-full appearance-none rounded-lg border border-surface-200 bg-white px-3 py-2 pr-8 text-sm text-surface-800 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              >
                {["On-site", "Remote", "Hybrid", "Any"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-surface-600 block">
              {t("search.seniority")}
            </label>
            <div className="relative">
              <select
                value={form.seniority}
                onChange={(e) =>
                  setForm({ ...form, seniority: e.target.value as Seniority })
                }
                className="block w-full appearance-none rounded-lg border border-surface-200 bg-white px-3 py-2 pr-8 text-sm text-surface-800 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
              >
                {["Junior", "Mid", "Senior", "Staff / Principal", "Any"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-surface-600 block">
            {t("search.exclude_keywords")}
          </label>
          <TagInput
            value={form.exclude_keywords}
            onChange={(exclude_keywords) =>
              setForm({ ...form, exclude_keywords })
            }
            placeholder={t("search_page.placeholder_exclude")}
          />
        </div>

        <Textarea
          label={t("search.extra_context")}
          value={form.extra_context}
          onChange={(e) => setForm({ ...form, extra_context: e.target.value })}
          placeholder={t("search_page.placeholder_context")}
          rows={3}
        />

        <div className="flex items-center gap-3 pt-3 border-t border-surface-100">
          <Button onClick={handleSave} variant="outline">
            {t("search.save")}
          </Button>
          <Button
            onClick={handleSearch}
            isLoading={isSearching}
            disabled={!aiConfig}
          >
            {isSearching
              ? searchProgress?.phase || "Searching..."
              : t("search.search_button")}
          </Button>
        </div>

        {!aiConfig && (
          <p className="text-xs text-amber-600">
            {t("search_page.configure_provider")}
          </p>
        )}

        {searchError && (
          <div className="bg-red-50 border border-red-200/60 rounded-lg p-3 text-sm text-red-600">
            {searchError}
          </div>
        )}

        {isSearching && searchProgress && (
          <div className="bg-brand-50 border border-brand-100/60 rounded-lg p-3 text-sm text-brand-600 flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" />
            <span>{searchProgress.phase}</span>
            {searchProgress.detail && (
              <span className="text-brand-400 text-xs ml-1">
                ({searchProgress.detail})
              </span>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
