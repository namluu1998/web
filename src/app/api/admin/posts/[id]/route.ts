import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data";
import { can, getSessionUserFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "posts")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const posts = db.posts.getAll().map((p) => (p.id === id ? { ...p, ...body, id } : p));
  db.posts.save(posts);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "posts")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  db.posts.save(db.posts.getAll().filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
