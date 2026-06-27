import { cn } from "@/shared/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "brand";
  className?: string;
}

const badgeVariants = {
  default: "bg-surface-100 text-surface-600 border-surface-200/80",
  success: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
  warning: "bg-amber-50 text-amber-600 border-amber-200/60",
  danger: "bg-red-50 text-red-600 border-red-200/60",
  info: "bg-sky-50 text-sky-600 border-sky-200/60",
  brand: "bg-brand-50 text-brand-600 border-brand-200/60",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
