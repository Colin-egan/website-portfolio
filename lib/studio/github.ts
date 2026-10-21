/**
 * GitHub OAuth for the studio sign-in. Used only to prove who you are: the access
 * token is read once to fetch the GitHub user, then dropped. No scopes are requested,
 * so the token could only ever read public profile data anyway.
 */

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

export const STATE_COOKIE = "studio_oauth_state";
export const STATE_MAX_AGE_SECONDS = 60 * 10;

function getClientCredentials() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET env var");
  }
  return { clientId, clientSecret };
}

export function callbackUrl(origin: string) {
  return `${origin}/studio/auth/github/callback`;
}

export function authorizeUrl(origin: string, state: string) {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(origin),
    state,
    allow_signup: "false",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

/** Exchanges the callback code for the GitHub user it belongs to, or null on any failure. */
export async function fetchGitHubUser(
  code: string,
  origin: string
): Promise<{ id: number; login: string } | null> {
  const { clientId, clientSecret } = getClientCredentials();

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl(origin),
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return null;

  const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string };
  if (!accessToken) return null;

  const userRes = await fetch(USER_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!userRes.ok) return null;

  const user = (await userRes.json()) as { id?: unknown; login?: unknown };
  if (typeof user.id !== "number" || typeof user.login !== "string") return null;
  return { id: user.id, login: user.login };
}
