import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data";
import { can, getSessionUserFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "menu")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const items = db.menu.getAll().map((m) => (m.id === id ? { ...m, ...body, id } : m));
  db.menu.save(items);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "menu")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  db.menu.save(db.menu.getAll().filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
