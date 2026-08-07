import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data";
import { rateLimit } from "@/lib/rateLimit";

const PHONE_RE = /^[0-9\s\+\-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

export async function POST(req: NextRequest) {
  // 5 đặt bàn / IP / giờ
  const { allowed, retryAfterSec } = rateLimit(getIp(req), 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfterSec} giây.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const body = await req.json();

  const name = stripTags(String(body.name ?? "").trim());
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  const guests = stripTags(String(body.guests ?? "").trim());
  const message = stripTags(String(body.message ?? "").trim().slice(0, 500));
  const date = String(body.date ?? "").trim();
  const time = String(body.time ?? "").trim();

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Tên không hợp lệ" }, { status: 400 });
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }
  if (date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return NextResponse.json({ error: "Ngày đặt bàn không được là ngày trong quá khứ" }, { status: 400 });
    }
  }

  const reservation = db.reservations.add({ name, phone, email, guests, message, date, time });
  return NextResponse.json(reservation, { status: 201 });
}
