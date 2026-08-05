import { useEffect } from "react";

// Both Modal and Drawer need this - previously ConfirmDialog didn't lock
// scroll at all, so the page behind a confirm dialog could still scroll.
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);
}
