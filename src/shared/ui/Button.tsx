import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantStyles = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md focus:ring-brand-500/30 active:bg-brand-800",
  secondary:
    "bg-surface-100 text-surface-700 border border-surface-200 hover:bg-surface-200 hover:border-surface-300 focus:ring-surface-300/30",
  ghost:
    "text-surface-600 hover:bg-surface-100 hover:text-surface-800 focus:ring-surface-300/30",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500/30 active:bg-red-800",
  outline:
    "border border-surface-200 text-surface-700 hover:bg-surface-50 hover:border-surface-300 focus:ring-surface-300/30",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-sm rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
