import { useState } from "react";
import { Modal, Button } from "@/design-system";

export interface DualKeyModalProps {
  open: boolean;
  onClose: () => void;
  onExecute: () => void;
  title: string;
  description: string;
  switch1Label: string;
  switch2Label: string;
  executeLabel?: string;
}

export function DualKeyModal({
  open,
  onClose,
  onExecute,
  title,
  description,
  switch1Label,
  switch2Label,
  executeLabel = "Execute",
}: DualKeyModalProps) {
  const [key1, setKey1] = useState(false);
  const [key2, setKey2] = useState(false);
  const bothOn = key1 && key2;

  const handleExecute = () => {
    if (!bothOn) return;
    onExecute();
    onClose();
    setKey1(false);
    setKey2(false);
  };

  const handleClose = () => {
    onClose();
    setKey1(false);
    setKey2(false);
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <p className="dual-key-modal-desc">{description}</p>
      <div className="dual-key-modal-switches">
        <label className="dual-key-modal-switch">
          <input
            type="checkbox"
            checked={key1}
            onChange={(e) => setKey1(e.target.checked)}
            aria-label={switch1Label}
          />
          <span className="dual-key-modal-switch-slider" />
          <span className="dual-key-modal-switch-label">{switch1Label}</span>
        </label>
        <label className="dual-key-modal-switch">
          <input
            type="checkbox"
            checked={key2}
            onChange={(e) => setKey2(e.target.checked)}
            aria-label={switch2Label}
          />
          <span className="dual-key-modal-switch-slider" />
          <span className="dual-key-modal-switch-label">{switch2Label}</span>
        </label>
      </div>
      <div className="dual-key-modal-actions">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleExecute}
          disabled={!bothOn}
          aria-label={executeLabel}
        >
          {executeLabel}
        </Button>
      </div>
    </Modal>
  );
}
