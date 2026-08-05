import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

// The centered overlay + panel mechanics, with no opinion on what goes
// inside. Dialog (confirm/alert style) is built on this; anything that
// needs a bigger free-form modal later (e.g. an AI recommendation detail
// view) should use Modal directly instead of copying ConfirmDialog's markup
// the way the old codebase did.
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

  if (!open) return null;

  const maxWidth = size === "lg" ? "max-w-lg" : "max-w-sm";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} rounded-xl bg-white p-6 shadow-lg outline-none`}
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="focus-ring -m-1 rounded-md p-1 text-neutral-400 hover:text-neutral-600"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}
