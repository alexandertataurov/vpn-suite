import { useCallback, useState } from "react";

export function useModalManager<T = unknown>() {
  const [modal, setModal] = useState<T | null>(null);

  const openModal = useCallback((payload: T) => {
    setModal(payload);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  return { modal, isOpen: modal != null, openModal, closeModal };
}

