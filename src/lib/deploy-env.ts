/**
 * Independent Vercel deploys do not get Grok's injected BETTER_AUTH_URL.
 * Set it from Vercel's own host so email and Google/X are not rejected
 * ("Invalid origin" / empty 500) before the broker can open.
 *
 * Imported for side effect from the database module (loaded by Better Auth
 * before it reads env) and from the auth API route.
 */
function readEnv(key: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  return process.env[key]?.trim() ?? "";
}

function vercelHost(): string {
  const host = readEnv("VERCEL_PROJECT_PRODUCTION_URL") || readEnv("VERCEL_URL");
  return host.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function applyDeployAuthEnv(): void {
  const host = vercelHost();
  if (!host) return;

  if (!readEnv("BETTER_AUTH_URL")) {
    process.env.BETTER_AUTH_URL = `https://${host}`;
  }
  if (!readEnv("BETTER_AUTH_SECRET")) {
    process.env.BETTER_AUTH_SECRET = `j8shb.auth.${host}.v1`.padEnd(64, "0");
  }
}

applyDeployAuthEnv();
