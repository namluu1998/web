import { NextRequest, NextResponse } from "next/server";
import { db, Post } from "@/lib/data";
import { can, getSessionUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "posts")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json(db.posts.getAll());
}

export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "posts")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const posts = db.posts.getAll();
  const newPost: Post = {
    id: Date.now().toString(),
    emoji: body.emoji || "📝",
    title: body.title,
    date: new Date().toLocaleDateString("vi-VN"),
    views: "0",
    excerpt: body.excerpt,
    content: body.content,
    tag: body.tag || "",
    tags: body.tags || "",
    published: body.published ?? true,
    featured: body.featured ?? false,
  };
  db.posts.save([newPost, ...posts]);
  return NextResponse.json(newPost, { status: 201 });
}
