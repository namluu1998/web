"use client";
import { useEffect, useState } from "react";
import type { Reservation } from "@/lib/data";
import { matchesSearch } from "@/lib/search";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Mới", color: "#dc2626", bg: "#fef2f2" },
  read: { label: "Đã xem", color: "#d97706", bg: "#fffbeb" },
  done: { label: "Hoàn thành", color: "#16a34a", bg: "#f0fdf4" },
  confirmed: { label: "Xác nhận", color: "#2563eb", bg: "#eff6ff" },
};

const DEFAULT_STATUS = { label: "Không rõ", color: "#6b7280", bg: "#f3f4f6" };

function DetailModal({ r, onClose, onUpdate }: {
  r: Reservation;
  onClose: () => void;
  onUpdate: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const st = STATUS_LABELS[r.status] ?? DEFAULT_STATUS;
  const date = new Date(r.createdAt).toLocaleString("vi-VN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  async function handleUpdate(status: string) {
    setUpdating(true);
    await onUpdate(r.id, status);
    setUpdating(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold" style={{ color: "#1a5276" }}>Chi tiết đơn đặt bàn</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>
          <div className="divide-y divide-gray-50">
            <Row icon="👤" label="Họ tên" value={r.name || "—"} />
            <Row icon="📞" label="Điện thoại" value={
              r.phone ? <a href={`tel:${r.phone}`} className="text-blue-600 hover:underline">{r.phone}</a>
                : <span className="text-gray-400">—</span>
            } />
            <Row icon="✉️" label="Email" value={
              r.email ? <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline break-all">{r.email}</a>
                : <span className="text-gray-400">Không có</span>
            } />
            <Row icon="👥" label="Số khách" value={r.guests || <span className="text-gray-400">Không có</span>} />
            <Row icon="📅" label="Ngày đặt" value={r.date || <span className="text-gray-400">Chưa chọn</span>} />
            <Row icon="🕐" label="Giờ đặt" value={r.time || <span className="text-gray-400">Chưa chọn</span>} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5">💬 Ghi chú / Tin nhắn</p>
            <div className="bg-gray-50 rounded-xl p-3 min-h-[48px]">
              {r.message
                ? <p className="text-sm text-gray-700 leading-relaxed">{r.message}</p>
                : <p className="text-sm text-gray-400 italic">Không có ghi chú</p>}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end flex-wrap">
          {r.status === "new" && (
            <button onClick={() => handleUpdate("read")} disabled={updating}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50">
              {updating ? "..." : "👁️ Đánh dấu đã xem"}
            </button>
          )}
          {r.status !== "done" && (
            <button onClick={() => handleUpdate("done")} disabled={updating}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#16a34a" }}>
              {updating ? "Đang lưu..." : "✅ Hoàn thành"}
            </button>
          )}
          {(r.status === "done" || r.status === "read") && (
            <button onClick={() => handleUpdate("new")} disabled={updating}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
              {updating ? "..." : "↩️ Đặt lại Mới"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm py-2.5">
      <span className="w-5 text-center shrink-0">{icon}</span>
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium flex-1">{value}</span>
    </div>
  );
}

function exportCsv(rows: Reservation[]) {
  const headers = ["Họ tên", "Điện thoại", "Email", "Số khách", "Ngày", "Giờ", "Trạng thái", "Ghi chú", "Ngày đặt"];
  const escape = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => [
      r.name, r.phone, r.email, r.guests, r.date ?? "", r.time ?? "",
      STATUS_LABELS[r.status]?.label ?? r.status,
      r.message,
      new Date(r.createdAt).toLocaleString("vi-VN"),
    ].map(escape).join(",")),
  ];
  const bom = "﻿";
  const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dat-ban-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DatBanAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "done">("all");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  async function load() {
    const data = await fetch("/api/admin/reservations").then((r) => r.json());
    setReservations(data);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  const filtered = reservations
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => matchesSearch(search, [r.name, r.phone, r.email, r.guests, r.message, r.status]));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = {
    all: reservations.length,
    new: reservations.filter((r) => r.status === "new").length,
    read: reservations.filter((r) => r.status === "read").length,
    done: reservations.filter((r) => r.status === "done").length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Đơn đặt bàn</h1>
          <p className="text-gray-400 text-sm mt-0.5">{counts.new} đơn mới cần xử lý</p>
        </div>
        <button onClick={() => exportCsv(filtered)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
          ⬇️ Xuất CSV
        </button>
        <div className="relative w-full sm:ml-auto sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm tên hoặc số điện thoại..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1a5276] transition-colors sm:w-64"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "new", "read", "done"] as const).map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              filter === s ? "text-white border-transparent shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
            style={filter === s ? { backgroundColor: "#1a5276" } : {}}>
            {s === "all" ? "Tất cả" : STATUS_LABELS[s].label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-md ${filter === s ? "bg-white/20" : "bg-gray-100"}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400 text-sm">{search ? "Không tìm thấy kết quả phù hợp" : "Chưa có đơn đặt bàn nào"}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Họ tên</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Điện thoại</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Số khách</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Trạng thái</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Ngày đặt</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => {
                    const st = STATUS_LABELS[r.status] ?? DEFAULT_STATUS;
                    return (
                      <tr key={r.id}
                        className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                        onClick={() => setSelected(r)}>
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-gray-800 text-sm">{r.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">{r.phone}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">
                          {r.email || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                          {r.guests || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{ color: st.color, backgroundColor: st.bg }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1.5 justify-end">
                            {r.status === "new" && (
                              <button onClick={() => updateStatus(r.id, "read")} title="Đánh dấu đã xem"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-sm">
                                👁
                              </button>
                            )}
                            {r.status !== "done" && (
                              <button onClick={() => updateStatus(r.id, "done")} title="Hoàn thành"
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-sm">
                                ✅
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
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {selected && (
        <DetailModal r={selected} onClose={() => setSelected(null)} onUpdate={updateStatus} />
      )}
    </div>
  );
}
