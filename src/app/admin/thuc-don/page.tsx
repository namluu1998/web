"use client";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/data";
import { isImageValue } from "@/lib/imageHelper";
import { matchesSearch } from "@/lib/search";
import EmojiOrImagePicker from "@/components/admin/EmojiOrImagePicker";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 10;
const TAGS = ["Bán chạy", "Mới", "Yêu thích", "Đặc biệt", ""];
const EMOJIS = ["🍜", "🦀", "🦑", "🍤", "🥤", "🧃", "🐟", "🦐", "🥗", "🍵", "🍱", "🫙"];
const empty: Omit<MenuItem, "id"> = { emoji: "🍜", name: "", desc: "", price: "", tag: "", available: true };

export default function ThucDonAdmin() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<MenuItem, "id">>(empty);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  async function load() {
    const data = await fetch("/api/admin/menu").then((r) => r.json());
    setItems(data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function startCreate() { setForm(empty); setEditing(null); setCreating(true); }
  function startEdit(item: MenuItem) { setForm(item); setEditing(item); setCreating(false); }
  function cancel() { setEditing(null); setCreating(false); }

  async function saveItem() {
    if (!form.name.trim()) return alert("Vui lòng nhập tên món");
    setSaving(true);
    if (creating) {
      await fetch("/api/admin/menu", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else if (editing) {
      await fetch(`/api/admin/menu/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false); cancel(); load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Xóa món ăn này?")) return;
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleAvailable(item: MenuItem) {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    load();
  }

  const filtered = items.filter((it) =>
    matchesSearch(search, [it.name, it.desc, it.tag, it.price])
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Thực đơn</h1>
          <p className="text-gray-400 text-sm mt-0.5">{items.length} món ăn</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm tên món, mô tả, tag..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1a5276] transition-colors sm:w-56"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          <button onClick={startCreate}
            className="px-4 py-2 rounded-xl font-semibold text-white text-sm whitespace-nowrap"
            style={{ backgroundColor: "#e07b39" }}>
            + Thêm món
          </button>
        </div>
      </div>

      <div className={creating || editing ? "grid lg:grid-cols-2 gap-5" : ""}>
        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-14">
              <p className="text-3xl mb-2">🍜</p>
              <p className="text-gray-400 text-sm">{search ? "Không tìm thấy món nào phù hợp" : "Chưa có món ăn nào"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 w-14"></th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Tên món</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Giá</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Tình trạng</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((item) => (
                      <tr key={item.id}
                        className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${!item.available ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3">
                          {isImageValue(item.emoji)
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={item.emoji} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                            : <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50 text-2xl">{item.emoji}</div>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                            {item.tag && (
                              <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: "#e07b39" }}>{item.tag}</span>
                            )}
                          </div>
                          {item.desc && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{item.desc}</p>}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm font-semibold" style={{ color: "#e07b39" }}>{item.price}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleAvailable(item)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              item.available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}>
                            {item.available ? "Còn" : "Hết"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => startEdit(item)} title="Chỉnh sửa"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm">
                              ✏️
                            </button>
                            <button onClick={() => deleteItem(item.id)} title="Xóa"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </div>
            </>
          )}
        </div>

        {/* Form panel */}
        {(creating || editing) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm h-fit sticky top-4">
            <h2 className="font-semibold text-gray-700 mb-4">{creating ? "Thêm món mới" : "Chỉnh sửa món"}</h2>
            <div className="space-y-4">
              <EmojiOrImagePicker value={form.emoji} onChange={(v) => set("emoji", v)} emojis={EMOJIS} label="Biểu tượng" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên món *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                <textarea rows={2} value={form.desc} onChange={(e) => set("desc", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giá</label>
                  <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="VD: 45.000đ"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tag</label>
                  <select value={form.tag} onChange={(e) => set("tag", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm bg-white">
                    {TAGS.map((t) => <option key={t} value={t}>{t || "— Không có —"}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={saveItem} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm hover:opacity-90"
                  style={{ backgroundColor: "#e07b39" }}>
                  {saving ? "Đang lưu..." : "💾 Lưu"}
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
    </div>
  );
}
