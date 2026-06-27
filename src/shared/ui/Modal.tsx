import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-panel border border-surface-200/50 animate-slide-up",
          className
        )}
      >
        <div className="flex items-center justify-between mb-5">
          {title && <h2 className="text-base font-semibold text-surface-800">{title}</h2>}
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg p-1 transition-colors ml-auto"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
