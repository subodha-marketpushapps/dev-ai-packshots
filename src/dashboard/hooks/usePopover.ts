import { useState, useCallback } from "react";

export function usePopover() {
  const [open, setOpen] = useState(false);
  const openPopover = useCallback(() => setOpen(true), []);
  const closePopover = useCallback(() => setOpen(false), []);
  const togglePopover = useCallback(() => setOpen((v) => !v), []);
  return { open, openPopover, closePopover, togglePopover };
}
