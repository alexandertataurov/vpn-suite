export interface WhenToUseBlockProps {
  whenToUse?: string[];
  whenNotToUse?: string[];
}

export function WhenToUseBlock({
  whenToUse = [],
  whenNotToUse = [],
}: WhenToUseBlockProps) {
  if (whenToUse.length === 0 && whenNotToUse.length === 0) return null;

  return (
    <section className="docs-when-to-use">
      <h2 className="docs-when-to-use__title">When to use</h2>
      <div className="docs-when-to-use__grid">
        {whenToUse.length > 0 && (
          <div className="docs-when-to-use__col docs-when-to-use__col--do">
            <h3 className="docs-when-to-use__col-title">Use when</h3>
            <ul className="docs-when-to-use__list">
              {whenToUse.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {whenNotToUse.length > 0 && (
          <div className="docs-when-to-use__col docs-when-to-use__col--dont">
            <h3 className="docs-when-to-use__col-title">Avoid when</h3>
            <ul className="docs-when-to-use__list">
              {whenNotToUse.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
