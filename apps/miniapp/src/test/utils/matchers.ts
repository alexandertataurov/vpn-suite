import { expect } from "vitest";

/** Assert that a mock post call matches the expected path and body shape. */
export function expectApiPostCall(
  call: unknown[],
  expectedPath: string,
  bodyMatch?: Record<string, unknown>,
) {
  expect(call).toHaveLength(2);
  const [path, body] = call as [string, Record<string, unknown>];
  expect(path).toBe(expectedPath);
  if (bodyMatch) {
    expect(body).toMatchObject(bodyMatch);
  }
  return { path, body };
}
