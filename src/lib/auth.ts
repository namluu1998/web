import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createHmac, createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

import type { Role } from "@/lib/roles";

export type User = {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
};

export type PublicUser = Omit<User, "passwordHash">;

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_NAME = "admin_session";
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

function secret(): string {
  return process.env.SESSION_SECRET ?? "";
}

function requireSessionSecret(): string {
  const value = secret();
  if (value.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  return value;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, `${requireSessionSecret()}|${salt}`, 210_000, 32, "sha256").toString("hex");
  return `pbkdf2$210000$${salt}$${derived}`;
}

export function checkPassword(user: User, password: string): boolean {
  if (user.passwordHash.startsWith("pbkdf2$")) {
    const [, iterations, salt, stored] = user.passwordHash.split("$");
    if (!iterations || !salt || !stored) return false;
    const derived = pbkdf2Sync(
      password,
      `${requireSessionSecret()}|${salt}`,
      Number(iterations),
      32,
      "sha256",
    ).toString("hex");
    return safeEqualHex(stored, derived);
  }

  const legacy = createHash("sha256").update(secret() + "|" + password).digest("hex");
  return safeEqualHex(user.passwordHash, legacy);
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

// ─── User store ───────────────────────────────────────────────────────────────

function initUsers(): User[] {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be set to at least 12 characters before creating the initial admin user.");
  }
  const admin: User = {
    id: "1",
    username: "admin",
    name: "Administrator",
    passwordHash: hashPassword(adminPassword),
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(USERS_FILE, JSON.stringify([admin], null, 2), "utf8");
  return [admin];
}

export function getUsers(): User[] {
  try {
    const list = JSON.parse(fs.readFileSync(USERS_FILE, "utf8")) as User[];
    if (list.length > 0) return list;
  } catch {}
  return initUsers();
}

export function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// ─── Session token ────────────────────────────────────────────────────────────

export function createToken(user: User): string {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, username: user.username, name: user.name, role: user.role })
  ).toString("base64url");
  const sig = createHmac("sha256", requireSessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function parseToken(token: string): SessionUser | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    if (secret().length < 32) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", requireSessionSecret()).update(payload).digest("hex");
    if (!safeEqualHex(sig, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return { id: data.id, username: data.username, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

// ─── Auth checks ──────────────────────────────────────────────────────────────

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value ?? "";
  const session = parseToken(token);
  if (!session) return null;
  const exists = getUsers().some(u => u.id === session.id && u.role === session.role);
  return exists ? session : null;
}

export function getSessionUserFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(TOKEN_NAME)?.value ?? "";
  const session = parseToken(token);
  if (!session) return null;
  const exists = getUsers().some(u => u.id === session.id && u.role === session.role);
  return exists ? session : null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSessionUser()) !== null;
}

export function isAuthenticatedFromRequest(req: NextRequest): boolean {
  return getSessionUserFromRequest(req) !== null;
}

// ─── Cookie ───────────────────────────────────────────────────────────────────

export const TOKEN_COOKIE_NAME = TOKEN_NAME;

export function makeSessionCookie(user: User) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: TOKEN_NAME,
    value: createToken(user),
    options: {
      httpOnly: true,
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax" as const,
    },
  };
}

// ─── Roles ────────────────────────────────────────────────────────────────────

type Resource = "posts" | "menu" | "reservations" | "reservations:write" | "reviews" | "settings" | "users";

const PERMISSIONS: Record<Role, Resource[]> = {
  admin: ["posts", "menu", "reservations", "reservations:write", "reviews", "settings", "users"],
  editor: ["posts", "menu", "reservations", "reservations:write", "reviews"],
  viewer: ["reservations"],
};

export function can(user: SessionUser | null, resource: Resource): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(resource) ?? false;
}
