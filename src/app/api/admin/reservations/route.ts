import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data";
import { getSessionUserFromRequest, can } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "reservations")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(db.reservations.getAll());
}

export async function PATCH(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "reservations:write")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id, status } = await req.json();
  const all = db.reservations.getAll().map((r) => (r.id === id ? { ...r, status } : r));
  db.reservations.save(all);
  return NextResponse.json({ ok: true });
}
