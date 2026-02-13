import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEV_FALLBACK_SECRET = "dev-only-insecure-session-secret-change-me";
let cachedDerivedSecret: string | null = null;

export interface SessionPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK_SECRET;
  }

  // Fallback for misconfigured production environments so auth does not hard-fail.
  // Set SESSION_SECRET/JWT_SECRET explicitly in deployment settings for best security.
  if (cachedDerivedSecret) {
    return cachedDerivedSecret;
  }

  const seed = process.env.MONGODB_URI || process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!seed) {
    throw new Error("Missing SESSION_SECRET in production and no stable fallback seed available");
  }

  cachedDerivedSecret = createHash("sha256")
    .update(`brain-session:${seed}`)
    .digest("hex");

  console.warn(
    "SESSION_SECRET/JWT_SECRET is not set in production. Using derived fallback secret. Configure SESSION_SECRET for stronger security.",
  );
  return cachedDerivedSecret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(userId: string, username: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId,
    username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expected = sign(payloadPart);
  const provided = Buffer.from(signaturePart);
  const computed = Buffer.from(expected);

  if (provided.length !== computed.length) return null;
  if (!timingSafeEqual(provided, computed)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
    if (!payload?.userId || !payload?.username || !payload?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return new Map<string, string>();
  const map = new Map<string, string>();

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawVal] = part.trim().split("=");
    if (!rawKey || rawVal.length === 0) continue;
    map.set(rawKey, rawVal.join("="));
  }

  return map;
}

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies.get(SESSION_COOKIE_NAME);
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
