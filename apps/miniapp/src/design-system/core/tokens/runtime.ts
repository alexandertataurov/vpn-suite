function extractVarReference(value: string) {
  const match = value.match(/var\((--[^,\s)]+)(?:,\s*[^)]+)?\)/);
  return match?.[1] ?? null;
}

export function normalizeCssValue(value: string) {
  return value.replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

export function resolveTokenValue(token: string, visited = new Set<string>()): string {
  if (visited.has(token)) return "";
  visited.add(token);

  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!rawValue) return "";

  const referencedToken = extractVarReference(rawValue);
  if (!referencedToken) return rawValue;
  return resolveTokenValue(referencedToken, visited);
}

export function getTokenCoverage(tokenMap: Record<string, string>, expectedValues?: Record<string, string>) {
  const results = Object.values(tokenMap).map((token) => {
    const actual = resolveTokenValue(token);
    const expected = expectedValues?.[token];
    const pass = expected == null
      ? actual.length > 0
      : normalizeCssValue(actual) === normalizeCssValue(expected);
    return { token, expected, actual, pass };
  });

  return {
    total: results.length,
    passing: results.filter((result) => result.pass).length,
    failing: results.filter((result) => !result.pass),
    results,
  };
}
