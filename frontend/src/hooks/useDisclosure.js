import { useCallback, useState } from "react";

// FarmDetailsPage and MyFarmsPage each had their own
// `const [confirmOpen, setConfirmOpen] = useState(...)` plus open/close
// callbacks. Nothing wrong with that pattern, just worth naming once so
// new features (Drawer nav, future modals) don't reinvent it.
export function useDisclosure(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
