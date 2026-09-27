import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

type BackendEndpoint = "/user/access" | "/agent/generate";

export async function forwardAuthenticatedRequest(
  request: Request,
  endpoint: BackendEndpoint,
) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 },
    );
  }

  const headers = new Headers({ "Bearer-auth": token });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) responseHeaders.set("content-type", responseType);

    const forwardedResponse = new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
    if (response.status === 401) {
      forwardedResponse.cookies.delete(AUTH_COOKIE_NAME);
    }
    return forwardedResponse;
  } catch {
    return NextResponse.json(
      { detail: "The API server is unavailable" },
      { status: 502 },
    );
  }
}