import { NextRequest, NextResponse } from "next/server";
import { can, getSessionUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/data";

function auth(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "settings")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const e = auth(req); if (e) return e;
  return NextResponse.json(db.faqs.getAll());
}

export async function PUT(req: NextRequest) {
  const e = auth(req); if (e) return e;
  const items = await req.json();
  db.faqs.save(items);
  return NextResponse.json({ ok: true });
}
