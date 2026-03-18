import { useState, type ReactNode } from "react";
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            <line x1="7" y1="1" x2="7" y2="13" />
            <line x1="1" y1="7" x2="13" y2="7" />
          </svg>
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
