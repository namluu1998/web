import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest, getUsers, saveUsers, hashPassword, can, toPublicUser } from "@/lib/auth";
import type { Role } from "@/lib/roles";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "users")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

  const user = users[idx];

  // Can't demote the last admin
  if (user.role === "admin" && body.role && body.role !== "admin") {
    const adminCount = users.filter(u => u.role === "admin").length;
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Phải có ít nhất 1 quản trị viên" }, { status: 400 });
    }
  }

  const name = String(body.name ?? user.name).trim();
  const role = (body.role as Role) ?? user.role;
  if (!["admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
  }

  users[idx] = {
    ...user,
    name: name || user.name,
    role,
    ...(body.password && body.password.length >= 6
      ? { passwordHash: hashPassword(body.password) }
      : {}),
  };
  saveUsers(users);

  return NextResponse.json(toPublicUser(users[idx]));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "users")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (me!.id === id) return NextResponse.json({ error: "Không thể xóa tài khoản của chính mình" }, { status: 400 });

  const users = getUsers();
  const target = users.find(u => u.id === id);
  if (!target) return NextResponse.json({ error: "Không tìm thấy user" }, { status: 404 });

  if (target.role === "admin" && users.filter(u => u.role === "admin").length <= 1) {
    return NextResponse.json({ error: "Phải có ít nhất 1 quản trị viên" }, { status: 400 });
  }

  saveUsers(users.filter(u => u.id !== id));
  return NextResponse.json({ ok: true });
}
