import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const SESSION_MAX_AGE_SECONDS = 30 * 60;

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  return NextResponse.json(
    { authenticated: Boolean(token) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const token =
    body && typeof body === "object" && "token" in body
      ? body.token
      : null;

  if (typeof token !== "string" || token.split(".").length !== 3) {
    return NextResponse.json(
      { detail: "A valid access token is required" },
      { status: 400 },
    );
  }

  (await cookies()).set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  (await cookies()).delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ authenticated: false });
}