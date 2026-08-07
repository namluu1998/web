"use client";
import { useEffect, useState } from "react";
import { ROLE_LABELS, ROLE_COLORS, ROLES } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import { matchesSearch } from "@/lib/search";

type UserRow = { id: string; username: string; name: string; role: Role; createdAt: string };

const emptyForm = { username: "", name: "", role: "editor" as Role, password: "", confirmPassword: "" };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const [usersRes, meRes] = await Promise.all([
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/admin/me").then(r => r.json()),
    ]);
    setUsers(usersRes);
    setMe(meRes);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function startCreate() {
    setForm(emptyForm);
    setEditing(null);
    setCreating(true);
    setError("");
  }

  function startEdit(u: UserRow) {
    setForm({ username: u.username, name: u.name, role: u.role, password: "", confirmPassword: "" });
    setEditing(u);
    setCreating(false);
    setError("");
  }

  function cancel() { setCreating(false); setEditing(null); setError(""); }

  async function save() {
    setError("");
    if (form.password && form.password !== form.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp");
    }
    setSaving(true);
    try {
      let res;
      if (creating) {
        if (!form.password) return setError("Vui lòng nhập mật khẩu");
        res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username, name: form.name, role: form.role, password: form.password }),
        });
      } else if (editing) {
        res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, role: form.role, ...(form.password ? { password: form.password } : {}) }),
        });
      }
      if (!res?.ok) {
        const data = await res?.json();
        setError(data?.error ?? "Đã xảy ra lỗi");
        return;
      }
      cancel();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Xóa tài khoản "${u.name}"?`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Không thể xóa");
    } else {
      load();
    }
  }

  const filteredUsers = users.filter((u) =>
    matchesSearch(search, [u.name, u.username, ROLE_LABELS[u.role], u.createdAt])
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Quản lý người dùng</h1>
          <p className="text-gray-400 text-sm mt-0.5">{users.length} tài khoản</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, username, vai trò..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1a5276] transition-colors sm:w-64"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          <button onClick={startCreate}
            className="w-full px-4 py-2 rounded-xl font-semibold text-white text-sm sm:w-auto"
            style={{ backgroundColor: "#1a5276" }}>
            + Thêm người dùng
          </button>
        </div>
      </div>

      <div className={creating || editing ? "grid lg:grid-cols-2 gap-5 items-start" : ""}>
        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-14 text-gray-400 text-sm">
              {search ? "Không tìm thấy người dùng phù hợp" : "Chưa có tài khoản nào"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Người dùng</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Tên đăng nhập</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vai trò</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const rc = ROLE_COLORS[u.role];
                    const isMe = me?.id === u.id;
                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                              style={{ backgroundColor: "#1a5276" }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                                {isMe && <span className="text-xs text-gray-400">(bạn)</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell font-mono">
                          {u.username}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ color: rc.color, backgroundColor: rc.bg }}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => startEdit(u)} title="Chỉnh sửa"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm">
                              ✏️
                            </button>
                            {!isMe && (
                              <button onClick={() => deleteUser(u)} title="Xóa"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm">
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form panel */}
        {(creating || editing) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-4">
            <h2 className="font-semibold text-gray-700 mb-4">
              {creating ? "Thêm người dùng mới" : `Chỉnh sửa: ${editing?.name}`}
            </h2>
            <div className="space-y-4">
              {creating && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tên đăng nhập *</label>
                  <input value={form.username} onChange={e => set("username", e.target.value)}
                    placeholder="vd: nhanvien1"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1a5276] text-sm font-mono" />
                  <p className="text-xs text-gray-400 mt-1">Chỉ dùng chữ thường, số, gạch dưới (≥ 3 ký tự)</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên hiển thị *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="vd: Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1a5276] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vai trò *</label>
                <div className="space-y-2">
                  {ROLES.map(r => {
                    const rc = ROLE_COLORS[r];
                    const desc: Record<Role, string> = {
                      admin: "Toàn quyền — quản lý user, cài đặt, nội dung",
                      editor: "Quản lý bài viết, thực đơn, đơn đặt bàn, đánh giá",
                      viewer: "Chỉ xem danh sách đơn đặt bàn (không sửa)",
                    };
                    return (
                      <label key={r} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${form.role === r ? "border-[#1a5276] bg-blue-50/40" : "border-gray-200 hover:bg-gray-50"}`}>
                        <input type="radio" name="role" value={r} checked={form.role === r}
                          onChange={() => set("role", r)} className="accent-[#1a5276]" />
                        <div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ color: rc.color, backgroundColor: rc.bg }}>
                            {ROLE_LABELS[r]}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">{desc[r]}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {creating ? "Mật khẩu *" : "Mật khẩu mới (để trống nếu không đổi)"}
                </label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder={creating ? "Tối thiểu 6 ký tự" : "••••••••"}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1a5276] text-sm" />
              </div>
              {form.password && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Xác nhận mật khẩu *</label>
                  <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1a5276] text-sm" />
                </div>
              )}
              {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: "#1a5276" }}>
                  {saving ? "Đang lưu..." : creating ? "Tạo tài khoản" : "Lưu thay đổi"}
                </button>
                <button onClick={cancel}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role legend */}
      {!creating && !editing && (
        <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Phân quyền theo vai trò</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {ROLES.map(r => {
              const rc = ROLE_COLORS[r];
              const perms: Record<Role, string[]> = {
                admin: ["Tất cả tính năng", "Quản lý người dùng", "Cài đặt trang", "Bài viết & thực đơn", "Đơn đặt bàn", "Đánh giá"],
                editor: ["Bài viết & thực đơn", "Xem & xử lý đơn đặt bàn", "Đồng bộ đánh giá", "Không có quyền cài đặt"],
                viewer: ["Chỉ xem đơn đặt bàn", "Không có quyền chỉnh sửa"],
              };
              return (
                <div key={r} className="rounded-xl p-3 border border-gray-100">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ color: rc.color, backgroundColor: rc.bg }}>
                    {ROLE_LABELS[r]}
                  </span>
                  <ul className="mt-2 space-y-1">
                    {perms[r].map(p => (
                      <li key={p} className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span>{p.startsWith("Không") ? "✗" : "✓"}</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
