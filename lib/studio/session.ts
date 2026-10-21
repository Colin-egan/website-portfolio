import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getSession } from "@/lib/portal/session";
import { getClientFeatures } from "@/lib/portal/client";
import { studioDevMode } from "@/lib/studio/devMode";

/**
 * Studio access is two locks, both required on every request:
 *
 * 1. A portal session whose account has the `studio` flag (the developer account).
 * 2. A studio session, issued only after GitHub confirms the signed-in GitHub user is
 *    STUDIO_GITHUB_USER_ID. It's bound to the portal account that started the sign-in,
 *    so it's worthless on its own or under any other portal login.
 *
 * The studio cookie is shorter-lived than the portal's — it gates commit access to
 * every client repo, so a leaked portal password alone is never enough.
 */

const COOKIE_NAME = "studio_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours
// Keeps a studio token from ever verifying as a portal token, or the reverse —
// both are signed with SESSION_SECRET.
const AUDIENCE = "studio";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET env var");
  }
  return new TextEncoder().encode(secret);
}

/** The numeric GitHub user id allowed into the studio. Ids survive username changes. */
export function getAllowedGitHubId(): number {
  const id = Number(process.env.STUDIO_GITHUB_USER_ID);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Missing or invalid STUDIO_GITHUB_USER_ID env var");
  }
  return id;
}

/** The portal session, only if its account has the `studio` flag. */
export async function getDeveloperSession(): Promise<{ clientId: string } | null> {
  if (studioDevMode()) return { clientId: "studio-dev-mode" };

  const session = await getSession();
  if (!session) return null;

  const features = await getClientFeatures();
  return features.includes("studio") ? session : null;
}

export async function createStudioSession(clientId: string, github: { id: number; login: string }) {
  const token = await new SignJWT({ clientId, githubId: github.id, githubLogin: github.login })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export type StudioSession = { clientId: string; githubLogin: string };

/**
 * Both locks, checked together. Returns null unless the portal account has the
 * `studio` flag AND the studio cookie was issued to that same account for the
 * allowed GitHub user. Every studio page and action goes through this.
 */
export async function getStudioSession(): Promise<StudioSession | null> {
  if (studioDevMode()) return { clientId: "studio-dev-mode", githubLogin: "local-dev" };

  const developer = await getDeveloperSession();
  if (!developer) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { audience: AUDIENCE });
    if (payload.clientId !== developer.clientId) return null;
    if (payload.githubId !== getAllowedGitHubId()) return null;
    if (typeof payload.githubLogin !== "string") return null;
    return { clientId: developer.clientId, githubLogin: payload.githubLogin };
  } catch {
    return null;
  }
}

export async function destroyStudioSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
