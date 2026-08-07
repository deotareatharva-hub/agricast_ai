import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

// The centered overlay + panel mechanics, with no opinion on what goes
// inside. Dialog (confirm/alert style) is built on this.
export default function Modal({ open, onClose, title, children, size = "sm" }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const maxWidth = size === "lg" ? "max-w-lg" : "max-w-sm";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-full ${maxWidth} rounded-2xl border border-white/60 bg-white/95 p-6 shadow-[var(--shadow-soft-xl)] outline-none backdrop-blur-xl`}
          >
            <div className="flex items-start justify-between gap-4">
              {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
              <button
                type="button"
                onClick={onClose}
                className="focus-ring -m-1 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
