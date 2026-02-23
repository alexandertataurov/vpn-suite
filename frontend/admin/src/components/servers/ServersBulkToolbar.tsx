/**
 * Bottom-fixed bulk action toolbar (Linear style).
 * Slides up with framer-motion when rows selected.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Text } from "@vpn-suite/shared/ui";

export interface ServersBulkToolbarProps {
  count: number;
  onSync: () => void;
  onMarkDraining: () => void;
  onUnmarkDraining: () => void;
  onDisableProvisioning: () => void;
  onEnableProvisioning: () => void;
  onClear: () => void;
  onConfirmBulk?: () => void;
  pendingAction: "mark_draining" | "unmark_draining" | "disable_provisioning" | "enable_provisioning" | null;
  confirmCode: string;
  onConfirmCodeChange: (v: string) => void;
  isLoading: boolean;
  bulkSyncProgress: { done: number; total: number } | null;
}

export function ServersBulkToolbar({
  count,
  onSync,
  onMarkDraining,
  onUnmarkDraining,
  onDisableProvisioning,
  onEnableProvisioning,
  onClear,
  onConfirmBulk,
  pendingAction,
  confirmCode,
  onConfirmCodeChange,
  isLoading,
  bulkSyncProgress,
}: ServersBulkToolbarProps) {
  const showConfirm = pendingAction && (pendingAction === "disable_provisioning" || pendingAction === "enable_provisioning");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4"
      >
        <div className="bulk-toolbar px-4 py-3 flex flex-wrap items-center gap-3">
          <Text variant="muted" className="shrink-0">
            {bulkSyncProgress
              ? `Syncing ${bulkSyncProgress.done}/${bulkSyncProgress.total}`
              : `${count} servers selected`}
          </Text>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onSync}
              disabled={!!bulkSyncProgress || isLoading}
              className="text-xs px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Sync All
            </button>
            <button
              type="button"
              onClick={onMarkDraining}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Mark Draining
            </button>
            <button
              type="button"
              onClick={onUnmarkDraining}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Unmark Draining
            </button>
            <button
              type="button"
              onClick={onDisableProvisioning}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Disable Provisioning
            </button>
            <button
              type="button"
              onClick={onEnableProvisioning}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg border border-surface-border hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Enable Provisioning
            </button>
          </div>
          <AnimatePresence>
            {showConfirm && onConfirmBulk && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <input
                  type="password"
                  placeholder="Confirmation code"
                  value={confirmCode}
                  onChange={(e) => onConfirmCodeChange(e.target.value)}
                  className="w-32 px-2 py-1 text-xs rounded border border-surface-border bg-surface-base text-text-primary placeholder-text-muted"
                />
                <button
                  type="button"
                  onClick={() => onConfirmBulk?.()}
                  disabled={!confirmCode.trim() || isLoading}
                  className="text-xs px-2.5 py-1 rounded-lg bg-accent-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  Confirm
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={onClear}
            className="ml-auto p-1 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
