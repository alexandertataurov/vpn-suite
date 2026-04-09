import type { ReactNode } from "react";
import { DisclosureItem } from "../../patterns";
import "./FaqDisclosureItem.css";

export interface FaqDisclosureItemProps {
  question?: string;
  answer?: string | ReactNode;
  defaultOpen?: boolean;
  /** @deprecated Use question */
  title?: string;
  /** @deprecated Use answer */
  body?: string;
  /** @deprecated Use question */
  isOpen?: boolean;
  /** @deprecated Use internal state for uncontrolled */
  onToggle?: () => void;
}

/** FAQ disclosure recipe. Uses DisclosureItem pattern. */
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

  return (
    <DisclosureItem
      trigger={question}
      defaultOpen={defaultOpen}
      isOpen={isOpenProp}
      onToggle={onToggle}
    >
      {answer}
    </DisclosureItem>
  );
}
