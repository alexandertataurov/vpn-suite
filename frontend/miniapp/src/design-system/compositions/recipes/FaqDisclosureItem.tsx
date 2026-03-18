import { useState, type ReactNode } from "react";
import { IconPlus } from "@/design-system/icons";
import "./FaqDisclosureItem.css";

export interface FaqDisclosureItemProps {
  question?: string;
  answer?: string | ReactNode;
  defaultOpen?: boolean;
  /** @deprecated Use question */
  title?: string;
  /** @deprecated Use answer */
  body?: string;
  /** @deprecated Use defaultOpen for uncontrolled */
  isOpen?: boolean;
  /** @deprecated Use internal state for uncontrolled */
  onToggle?: () => void;
}

export function FaqDisclosureItem(props: FaqDisclosureItemProps) {
  const {
    question: questionProp,
    answer: answerProp,
    defaultOpen = false,
    title,
    body,
    isOpen: isOpenProp,
    onToggle,
  } = props;
  const question = questionProp ?? title ?? "";
  const answer = answerProp ?? body ?? "";
  const isControlled = isOpenProp !== undefined && onToggle !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? isOpenProp! : internalOpen;
  const handleToggle = isControlled ? onToggle! : () => setInternalOpen((v) => !v);

  return (
    <div className="faq-item" data-open={isOpen}>
      <button
        type="button"
        className="faq-trigger"
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        <span className="faq-question">{question}</span>
        <span className="faq-icon" aria-hidden="true">
          <IconPlus size={14} strokeWidth={1.75} />
        </span>
      </button>
      <div
        className="faq-answer"
        role="region"
        hidden={!isOpen}
      >
        <div className="faq-answer-inner">
          {answer}
        </div>
      </div>
    </div>
  );
}
