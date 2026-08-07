// Client-safe role constants — no server imports

export type Role = "admin" | "editor" | "viewer";

export const ROLES: Role[] = ["admin", "editor", "viewer"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  viewer: "Người xem",
};

export const ROLE_COLORS: Record<Role, { color: string; bg: string }> = {
  admin: { color: "#1a5276", bg: "#d6eaf8" },
  editor: { color: "#b7770d", bg: "#fef9e7" },
  viewer: { color: "#16a34a", bg: "#f0fdf4" },
};
