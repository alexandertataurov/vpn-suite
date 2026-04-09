import { CodeBlock } from "./CodeBlock";

export interface RecipeItem {
  title: string;
  code: string;
  description?: string;
  language?: string;
}

export interface RecipeBlockProps {
  recipes: RecipeItem[];
  title?: string;
}

export function RecipeBlock({
  recipes,
  title = "Recipes",
}: RecipeBlockProps) {
  if (recipes.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <div className="space-y-6">
        {recipes.map((recipe, i) => (
          <div key={i}>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
              {recipe.title}
            </h3>
            {recipe.description != null && (
              <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
                {recipe.description}
              </p>
            )}
            <CodeBlock language={recipe.language ?? "tsx"}>
              {recipe.code}
            </CodeBlock>
          </div>
        ))}
      </div>
    </section>
  );
}
