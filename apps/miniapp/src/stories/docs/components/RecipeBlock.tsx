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

function getRecipeKey(recipe: RecipeItem) {
  return `${recipe.title}-${recipe.language ?? "text"}`;
}

export function RecipeBlock({
  recipes,
  title = "Recipes",
}: RecipeBlockProps) {
  if (recipes.length === 0) {
    return null;
  }

  return (
    <section className="docs-recipes">
      <h2 className="docs-recipes__title">{title}</h2>
      <div className="docs-recipes__list">
        {recipes.map((recipe) => (
          <div key={getRecipeKey(recipe)} className="docs-recipes__item">
            <h3 className="docs-recipes__item-title">{recipe.title}</h3>
            {recipe.description != null ? (
              <p className="docs-recipes__item-desc">{recipe.description}</p>
            ) : null}
            <pre className="docs-recipes__code" data-language={recipe.language ?? "text"}>
              <code>{recipe.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
