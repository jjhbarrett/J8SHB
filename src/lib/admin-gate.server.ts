import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  deleteCookie,
  getCookie,
  getRequestProtocol,
  setCookie,
} from "@tanstack/react-start/server";
import {
  ADMIN_X_HANDLE,
  ADMIN_X_USER_ID,
} from "@/lib/admin-allowlist";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 30;
const PROOF_MAX_AGE = 60 * 10;

type XProfile = {
  screenName: string;
  id: string;
  bio: string;
  website: string;
};

function isHttps(): boolean {
  try {
    return getRequestProtocol() === "https";
  } catch {
    return true;
  }
}

function adminCookieName(): string {
  return isHttps() ? "__Host-j8-admin" : "j8-admin";
}

function proofCookieName(): string {
  return isHttps() ? "__Host-j8-xproof" : "j8-xproof";
}

function secret(): string {
  const fromEnv = process.env.BETTER_AUTH_SECRET?.trim();
  return fromEnv && fromEnv.length >= 16
    ? fromEnv
    : "j8shb.auth.local.preview.v1".padEnd(64, "0");
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function pack(value: string, maxAgeSec: number): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = `${value}.${exp}`;
  return `${body}.${sign(body)}`;
}

function unpack(raw: string | undefined): string | null {
  if (!raw) return null;
  const split = raw.lastIndexOf(".");
  if (split < 1) return null;
  const body = raw.slice(0, split);
  const mac = raw.slice(split + 1);
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const expAt = body.lastIndexOf(".");
  if (expAt < 1) return null;
  const value = body.slice(0, expAt);
  const exp = Number(body.slice(expAt + 1));
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  return value;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isHttps(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function hasAdminCookie(): boolean {
  return unpack(getCookie(adminCookieName())) === ADMIN_X_HANDLE;
}

export function setAdminCookie(): void {
  setCookie(
    adminCookieName(),
    pack(ADMIN_X_HANDLE, ADMIN_MAX_AGE),
    cookieOptions(ADMIN_MAX_AGE),
  );
}

export function clearAdminCookie(): void {
  const opts = { path: "/", secure: isHttps() };
  deleteCookie(adminCookieName(), opts);
  deleteCookie(proofCookieName(), opts);
}

export function startHandleProof(): string {
  const code = `j8-${randomBytes(3).toString("hex")}`;
  setCookie(
    proofCookieName(),
    pack(code, PROOF_MAX_AGE),
    cookieOptions(PROOF_MAX_AGE),
  );
  return code;
}

function parseProfile(data: unknown): XProfile | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const user =
    root.user && typeof root.user === "object"
      ? (root.user as Record<string, unknown>)
      : root;
  const screenName = String(user.screen_name ?? "")
    .replace(/^@/, "")
    .toLowerCase();
  const id = String(user.id ?? "");
  const bio = String(user.description ?? "");
  const websiteObj =
    user.website && typeof user.website === "object"
      ? (user.website as Record<string, unknown>)
      : null;
  const website = String(websiteObj?.url ?? user.url ?? "");
  if (!screenName || !id) return null;
  return { screenName, id, bio, website };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "j8studios-admin",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Could not read X.");
  return response.json();
}

async function fetchJ8Profile(): Promise<XProfile> {
  const urls = [
    `https://api.fxtwitter.com/${ADMIN_X_HANDLE}`,
    `https://api.vxtwitter.com/${ADMIN_X_HANDLE}`,
  ];
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const profile = parseProfile(await fetchJson(url));
      if (!profile) continue;
      if (
        profile.screenName === ADMIN_X_HANDLE &&
        profile.id === ADMIN_X_USER_ID
      ) {
        return profile;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Could not read X.");
    }
  }
  throw lastError ?? new Error("Could not read the X profile.");
}

export async function confirmHandleProof(): Promise<void> {
  const code = unpack(getCookie(proofCookieName()));
  if (!code) throw new Error("That code expired. Continue with X again.");
  const profile = await fetchJ8Profile();
  const haystack = `${profile.bio} ${profile.website}`.toLowerCase();
  if (!haystack.includes(code.toLowerCase())) {
    throw new Error("Add the code to the @j8shb bio or website, then continue.");
  }
  setAdminCookie();
  deleteCookie(proofCookieName(), { path: "/", secure: isHttps() });
}

export function isAdminRequest(): boolean {
  return hasAdminCookie();
}
