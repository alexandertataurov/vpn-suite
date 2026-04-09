const BLOCKING_OVERLAY_DATASET_KEY = "modalOpenCount";
const BLOCKING_OVERLAY_EVENT = "miniapp:blocking-overlay-change";

function readBlockingOverlayCount() {
  if (typeof document === "undefined") {
    return 0;
  }

  const value = Number(document.documentElement.dataset[BLOCKING_OVERLAY_DATASET_KEY] ?? "0");
  return Number.isFinite(value) ? value : 0;
}

function emitBlockingOverlayChange(next: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<number>(BLOCKING_OVERLAY_EVENT, { detail: next }));
}

export function getBlockingOverlayCount() {
  return readBlockingOverlayCount();
}

export function hasBlockingOverlayOpen() {
  return readBlockingOverlayCount() > 0;
}

export function subscribeToBlockingOverlayChange(listener: (count: number) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = (event: Event) => {
    listener((event as CustomEvent<number>).detail ?? readBlockingOverlayCount());
  };

  window.addEventListener(BLOCKING_OVERLAY_EVENT, handleChange as EventListener);
  return () => {
    window.removeEventListener(BLOCKING_OVERLAY_EVENT, handleChange as EventListener);
  };
}

export function incrementBlockingOverlayCount() {
  if (typeof document === "undefined") {
    return;
  }

  const next = readBlockingOverlayCount() + 1;
  document.documentElement.dataset[BLOCKING_OVERLAY_DATASET_KEY] = String(next);
  emitBlockingOverlayChange(next);
}

export function decrementBlockingOverlayCount() {
  if (typeof document === "undefined") {
    return;
  }

  const next = Math.max(readBlockingOverlayCount() - 1, 0);
  if (next === 0) {
    delete document.documentElement.dataset[BLOCKING_OVERLAY_DATASET_KEY];
    emitBlockingOverlayChange(0);
    return;
  }

  document.documentElement.dataset[BLOCKING_OVERLAY_DATASET_KEY] = String(next);
  emitBlockingOverlayChange(next);
}
