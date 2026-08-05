import { useEffect, useState } from "react";

// MyFarmsPage fed `search`/`crop` straight into useFarms() on every
// keystroke, so each keypress produced a new query-key and a new network
// request (see FrontendAudit.md - "Performance Problems"). This delays the
// value TanStack Query actually sees until typing pauses.
export function useDebouncedValue(value, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
