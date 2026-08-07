import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data";
import { getSessionUserFromRequest, can } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "settings")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(db.settings.get());
}

export async function PUT(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "settings")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const current = db.settings.get();
  db.settings.save({ ...current, ...body });
  return NextResponse.json({ ok: true });
}
