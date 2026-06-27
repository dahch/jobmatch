import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-[13px] font-medium text-surface-600">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "block w-full rounded-lg border bg-white px-3 py-2 text-sm text-surface-800 resize-y",
            "placeholder:text-surface-400",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
              : "border-surface-200 hover:border-surface-300 focus:border-brand-400 focus:ring-brand-500/20",
            "disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
