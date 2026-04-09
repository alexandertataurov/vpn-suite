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
    <section className="docs-recipes">
      <h2 className="docs-recipes__title">{title}</h2>
      <div className="docs-recipes__list">
        {recipes.map((recipe, i) => (
          <div key={i} className="docs-recipes__item">
            <h3 className="docs-recipes__item-title">{recipe.title}</h3>
            {recipe.description != null && (
              <p className="docs-recipes__item-desc">{recipe.description}</p>
            )}
            <pre className="docs-recipes__code">
              <code>{recipe.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
