import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/portal/session";
import { getDeveloperSession } from "@/lib/studio/session";
import { STATE_COOKIE, STATE_MAX_AGE_SECONDS, authorizeUrl } from "@/lib/studio/github";

/** Starts the GitHub sign-in. Only the developer portal account gets this far. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  if (!(await getSession())) return NextResponse.redirect(`${origin}/portal`);
  if (!(await getDeveloperSession())) return new NextResponse(null, { status: 404 });

  const state = randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/studio/auth",
    maxAge: STATE_MAX_AGE_SECONDS,
  });

  return NextResponse.redirect(authorizeUrl(origin, state));
}
