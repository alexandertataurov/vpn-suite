import { APIRequestContext, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultEmail = "admin@vpn.vega.llc";
const defaultPassword = "admin";

type TokenPair = { access_token: string; refresh_token: string };

let cachedTokens: TokenPair | null = null;
let cachedLocalEnv: Record<string, string> | null = null;

function readLocalEnv(): Record<string, string> {
  if (cachedLocalEnv) return cachedLocalEnv;
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env");
  try {
    const text = fs.readFileSync(envPath, "utf8");
    const parsed: Record<string, string> = {};
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx <= 0) continue;
      parsed[line.slice(0, idx)] = line.slice(idx + 1);
    }
    cachedLocalEnv = parsed;
    return parsed;
  } catch {
    cachedLocalEnv = {};
    return cachedLocalEnv;
  }
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || readLocalEnv().ADMIN_EMAIL || defaultEmail;
}

function getAdminPassword() {
  return (
    process.env.E2E_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    readLocalEnv().E2E_ADMIN_PASSWORD ||
    readLocalEnv().ADMIN_PASSWORD ||
    defaultPassword
  );
}

function getApiBase() {
  const fromEnv =
    process.env.PLAYWRIGHT_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    readLocalEnv().PLAYWRIGHT_API_BASE_URL ||
    readLocalEnv().VITE_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://127.0.0.1:8000/api/v1";
}

export async function loginViaUi(page: Page, timeout = 15000): Promise<boolean> {
  const email = getAdminEmail();
  const password = getAdminPassword();
  await page.goto("login");
  const emailField = page.getByLabel(/email/i);
  const passwordField = page.getByLabel(/password/i);
  if (!(await emailField.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  await emailField.fill(email);
  await passwordField.fill(password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  try {
    await page.waitForURL(/\/admin\/?$/, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function getCachedTokens(request: APIRequestContext): Promise<TokenPair | null> {
  if (cachedTokens) return cachedTokens;
  const email = getAdminEmail();
  const password = getAdminPassword();
  let res;
  try {
    res = await request.post(`${getApiBase()}/auth/login`, {
      data: { email, password },
    });
  } catch {
    // Local dev/e2e runs often don't have the API available. Treat as "cannot auth" so tests can skip.
    return null;
  }
  if (!res.ok()) return null;
  const body = (await res.json()) as TokenPair;
  if (!body?.access_token || !body?.refresh_token) return null;
  cachedTokens = body;
  return cachedTokens;
}

export async function login(page: Page, request: APIRequestContext, timeout = 15000): Promise<boolean> {
  const tokens = await getCachedTokens(request);
  if (!tokens) return false;

  await page.goto("login");
  await page.evaluate(([accessToken, refreshToken]) => {
    sessionStorage.setItem("vpn_admin_access", accessToken);
    sessionStorage.setItem("vpn_admin_refresh", refreshToken);
  }, [tokens.access_token, tokens.refresh_token] as const);
  await page.goto("");

  try {
    await page.waitForURL(/\/admin\/?$/, { timeout });
    return true;
  } catch {
    return false;
  }
}
