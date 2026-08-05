import { useEffect, useState } from "react";

// Used today by DashboardLayout to decide whether the sidebar or the
// mobile drawer nav renders. Also the hook the premium-effects wrappers
// (TargetCursor, GooeyNav - see MigrationNotes.md) will use to detect
// desktop-only viewports when those are wired in.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// Convenience wrapper matching this project's `md` Tailwind breakpoint,
// since that's the cutoff the Sidebar already used.
export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)");
}
