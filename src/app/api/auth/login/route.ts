import { NextRequest, NextResponse } from "next/server";
import { getUsers, checkPassword, makeSessionCookie } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  if ((process.env.SESSION_SECRET ?? "").length < 32) {
    return NextResponse.json({ error: "SESSION_SECRET chua duoc cau hinh dung." }, { status: 500 });
  }

  const ip = getClientIp(req);
  const now = Date.now();

  const record = attempts.get(ip);
  if (record) {
    if (now < record.resetAt && record.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return NextResponse.json(
        { error: `Quá nhiều lần thử. Vui lòng đợi ${retryAfter} giây.` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
    if (now >= record.resetAt) attempts.delete(ip);
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Du lieu dang nhap khong hop le" }, { status: 400 });
  }
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  let user: ReturnType<typeof getUsers>[number] | undefined;
  try {
    user = getUsers().find(u => u.username.toLowerCase() === username);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth configuration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!user || !checkPassword(user, password)) {
    const rec = attempts.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
    rec.count += 1;
    attempts.set(ip, rec);
    return NextResponse.json({ error: "Sai tên đăng nhập hoặc mật khẩu" }, { status: 401 });
  }

  attempts.delete(ip);
  const cookie = makeSessionCookie(user);
  const res = NextResponse.json({ ok: true, role: user.role, name: user.name });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
