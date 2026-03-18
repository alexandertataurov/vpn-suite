import type { ReactNode } from "react";

export interface StartHereBlockProps {
  content: string | ReactNode;
}

export function StartHereBlock({ content }: StartHereBlockProps) {
  return (
    <section className="docs-start-here">
      <h2 className="docs-start-here__title">Start here</h2>
      <div className="docs-start-here__content">
        {typeof content === "string" ? <p>{content}</p> : content}
      </div>
    </section>
  );
}
