import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest, getUsers, saveUsers, hashPassword, can, toPublicUser } from "@/lib/auth";
import type { Role } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "users")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = getUsers().map(toPublicUser);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "users")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const username = String(body.username ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "").trim();
  const role = body.role as Role;

  if (!username || !name || !password || !["admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }
  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "Tên đăng nhập chỉ gồm chữ thường, số, gạch dưới (≥ 3 ký tự)" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  }

  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === username)) {
    return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 409 });
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    name,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, newUser]);
  return NextResponse.json(toPublicUser(newUser), { status: 201 });
}
