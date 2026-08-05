import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

// Before this component existed, Sidebar was `hidden md:block` with no
// mobile equivalent at all - on a phone, an authenticated user had no way
// to reach /dashboard/farms except by typing the URL (see
// FrontendAudit.md - "Responsive Problems"). DashboardLayout now renders
// this on small screens with the same nav items Sidebar shows on desktop.
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

  if (!open) return null;

  const sideClasses = side === "right" ? "right-0" : "left-0";

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-neutral-900/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-lg outline-none ${sideClasses}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          {title && <span className="font-semibold text-neutral-900">{title}</span>}
          <button
            type="button"
            onClick={onClose}
            className="focus-ring -m-1 ml-auto rounded-md p-1 text-neutral-400 hover:text-neutral-600"
            aria-label={t("common.closeMenu")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
