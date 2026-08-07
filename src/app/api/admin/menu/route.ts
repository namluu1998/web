import { NextRequest, NextResponse } from "next/server";
import { db, MenuItem } from "@/lib/data";
import { can, getSessionUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "menu")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json(db.menu.getAll());
}

export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "menu")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const items = db.menu.getAll();
  const newItem: MenuItem = {
    id: Date.now().toString(),
    emoji: body.emoji || "🍽️",
    name: body.name,
    desc: body.desc,
    price: body.price,
    tag: body.tag || "",
    available: body.available ?? true,
  };
  db.menu.save([...items, newItem]);
  return NextResponse.json(newItem, { status: 201 });
}
