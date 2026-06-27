import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Settings, CheckCircle, AlertCircle, RefreshCw, ChevronDown, Zap } from "lucide-react";
import { Layout } from "@/shared/ui/Layout";
import { Button, Input } from "@/shared/ui";
import { useAIProviderStore } from "@/features/ai-provider/model/store";
import { PROVIDER_MODELS } from "@/shared/types";
import { listModels } from "@/features/ai-provider/api/aiClient";
import type { Provider } from "@/shared/types";

const providers: { value: Provider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "opencode", label: "OpenCode" },
  { value: "custom", label: "Custom (OpenAI-compatible)" },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const { config, isConnected, setConfig, testConnection } = useAIProviderStore();
  const [provider, setProvider] = useState<Provider>(config?.provider || "openai");
  const [apiKey, setApiKey] = useState(config?.apiKey || "");
  const [model, setModel] = useState(config?.model || "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || "");
  const [testing, setTesting] = useState(false);

  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const staticModels = PROVIDER_MODELS[provider];
  const allModels = Array.from(new Set([...staticModels, ...fetchedModels]));

  const filteredModels = model
    ? allModels.filter((m) => m.toLowerCase().includes(model.toLowerCase()))
    : allModels;

  const fetchModels = async () => {
    if (!apiKey) return;
    setFetchingModels(true);
    setModelsError(false);
    const models = await listModels(provider, apiKey, (provider === "custom" || provider === "opencode") ? baseUrl : undefined);
    if (models.length === 0 && staticModels.length === 0) {
      setModelsError(true);
    }
    setFetchedModels(models);
    setFetchingModels(false);
  };

  useEffect(() => {
    if (apiKey) {
      fetchModels();
    } else {
      setFetchedModels([]);
    }
  }, [provider, apiKey, baseUrl]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectModel = (m: string) => {
    setModel(m);
    setDropdownOpen(false);
    setHighlightIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setDropdownOpen(true);
        return;
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % filteredModels.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => (i <= 0 ? filteredModels.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && filteredModels[highlightIdx]) {
        selectModel(filteredModels[highlightIdx]);
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const handleSave = () => {
    setConfig({ provider, apiKey, model, baseUrl: (provider === "custom" || provider === "opencode") ? baseUrl : undefined });
  };

  const handleTest = async () => {
    handleSave();
    setTesting(true);
    await testConnection();
    setTesting(false);
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center">
            <Settings size={18} className="text-surface-500" />
          </div>
          <h1 className="text-xl font-semibold text-surface-900">{t("settings.title")}</h1>
        </div>
        <p className="text-sm text-surface-400 ml-12">{t("settings_page.subtitle")}</p>
      </div>

      <div className="card p-6 max-w-xl space-y-5 animate-fade-in">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-surface-600">{t("settings.provider")}</label>
          <div className="relative">
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value as Provider);
                setModel("");
                setFetchedModels([]);
              }}
              className="block w-full appearance-none rounded-lg border border-surface-200 bg-white px-3 py-2 pr-8 text-sm text-surface-800 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            >
              {providers.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          </div>
        </div>

        <Input
          label={t("settings.api_key")}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          hint={t("settings_page.api_key_hint")}
        />

        {(provider === "custom" || provider === "opencode") && (
          <Input
            label={t("settings.base_url")}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://your-api.com/v1"
          />
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-surface-600">{t("settings.model")}</label>
            <button
              type="button"
              onClick={fetchModels}
              disabled={!apiKey || fetchingModels}
              className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <RefreshCw size={11} className={fetchingModels ? "animate-spin" : ""} />
              {fetchingModels ? t("settings_page.fetching") : t("settings.refresh_models")}
            </button>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <input
                ref={inputRef}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setDropdownOpen(true);
                  setHighlightIdx(-1);
                }}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={
                  fetchingModels
                    ? t("settings_page.loading_models")
                    : allModels.length > 0
                    ? t("settings.model_placeholder")
                    : t("settings_page.placeholder_model")
                }
                disabled={fetchingModels}
                className="block w-full rounded-lg border border-surface-200 border-r-0 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 hover:border-surface-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 disabled:bg-surface-50 disabled:text-surface-400"
              />
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen((o) => !o);
                  inputRef.current?.focus();
                }}
                className="px-2.5 rounded-lg border border-surface-200 bg-surface-50 hover:bg-surface-100 text-surface-400 transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {dropdownOpen && filteredModels.length > 0 && (
              <ul className="absolute z-10 mt-1.5 w-full max-h-56 overflow-auto rounded-lg border border-surface-200 bg-white shadow-panel animate-fade-in">
                {filteredModels.map((m, i) => (
                  <li
                    key={m}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectModel(m)}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      i === highlightIdx ? "bg-brand-50 text-brand-700" : "text-surface-700 hover:bg-surface-50"
                    } ${model === m ? "font-medium" : ""}`}
                  >
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {modelsError && (
            <p className="text-xs text-amber-600">{t("settings.models_fetch_error")}</p>
          )}
          {allModels.length === 0 && !fetchingModels && (
            <p className="text-xs text-surface-400">
              {apiKey ? t("settings.model_manual") : t("settings.model_no_key")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-surface-100">
          <Button onClick={handleSave}>{t("settings.save")}</Button>
          <Button variant="outline" onClick={handleTest} isLoading={testing}>
            {t("settings.test_connection")}
          </Button>
          {isConnected && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle size={15} /> {t("settings.connection_ok")}
            </span>
          )}
          {!isConnected && config && !testing && (
            <span className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
              <AlertCircle size={15} /> {t("settings.connection_fail")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 max-w-xl">
        <div className="card p-4 bg-brand-50/30 border-brand-100/50">
          <div className="flex items-start gap-2.5">
            <Zap size={14} className="text-brand-500 mt-0.5 shrink-0" />
            <p className="text-xs text-surface-600 leading-relaxed">{t("privacy_notice")}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
