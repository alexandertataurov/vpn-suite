import { useCallback, useState } from "react";

/**
 * Purpose: Simple open/close/toggle for modal state.
 * Used in: ServersPage, UsersPage, DevicesPage, any feature using Modal.
 */
export function useModal(initialOpen = false): {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggle: () => void;
} {
  const [open, setOpen] = useState(initialOpen);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return { open, openModal, closeModal, toggle };
}
