import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

// Mobile-only nav surface (Sidebar collapses to this below md).
export default function Drawer({ open, onClose, title, children, side = "left" }) {
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

  const isRight = side === "right";
  const xFrom = isRight ? "100%" : "-100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: xFrom }}
            animate={{ x: 0 }}
            exit={{ x: xFrom }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative flex h-full w-72 max-w-[85vw] flex-col border-neutral-100 bg-white/95 shadow-[var(--shadow-soft-xl)] outline-none backdrop-blur-xl ${
              isRight ? "right-0 border-l" : "left-0 border-r"
            }`}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              {title && <span className="font-semibold text-neutral-900">{title}</span>}
              <button
                type="button"
                onClick={onClose}
                className="focus-ring -m-1 ml-auto rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                aria-label={t("common.closeMenu")}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
