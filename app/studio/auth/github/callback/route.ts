import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/portal/session";
import { createStudioSession, getAllowedGitHubId, getDeveloperSession } from "@/lib/studio/session";
import { STATE_COOKIE, fetchGitHubUser } from "@/lib/studio/github";

function sameState(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * GitHub sends you back here. The studio session is issued only when the state
 * matches the one this browser was given, and GitHub vouches for the allowed user.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const fail = (reason: string) => NextResponse.redirect(`${origin}/studio?error=${reason}`);

  if (!(await getSession())) return NextResponse.redirect(`${origin}/portal`);
  const developer = await getDeveloperSession();
  if (!developer) return new NextResponse(null, { status: 404 });

  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete({ name: STATE_COOKIE, path: "/studio/auth" });

  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!expected || !state || !sameState(state, expected)) return fail("expired");
  // No code means you cancelled on GitHub's page.
  if (!code) return fail("github");

  const user = await fetchGitHubUser(code, origin);
  if (!user) return fail("github");
  if (user.id !== getAllowedGitHubId()) return fail("account");

  await createStudioSession(developer.clientId, user);
  return NextResponse.redirect(`${origin}/studio`);
}
