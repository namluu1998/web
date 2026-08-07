import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_NAME = "admin_session";

async function verifyToken(token: string): Promise<{ role: string } | null> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32) return null;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const rawSig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expectedHex = Array.from(new Uint8Array(rawSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedHex !== sig) return null;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { role: string };
  } catch {
    return null;
  }
}

const ADMIN_ONLY = ["/admin/users", "/admin/cai-dat"];
const EDITOR_PLUS = ["/admin/bai-viet", "/admin/thuc-don", "/admin/danh-gia"];

function getRequiredRole(pathname: string): "admin" | "editor" | "viewer" | null {
  if (ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "admin";
  if (EDITOR_PLUS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "editor";
  return "viewer";
}

function roleLevel(role: string): number {
  return role === "admin" ? 3 : role === "editor" ? 2 : 1;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.SESSION_SECRET ?? "";

  if (!secret || secret.length < 32) {
    if (pathname === "/admin/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const token = request.cookies.get(TOKEN_NAME)?.value ?? "";
  const session = token ? await verifyToken(token) : null;
  const isLoggedIn = session !== null;

  if (pathname === "/admin/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const required = getRequiredRole(pathname);
  if (required && roleLevel(session.role) < roleLevel(required)) {
    return NextResponse.redirect(new URL("/admin?denied=1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
