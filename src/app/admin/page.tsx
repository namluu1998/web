"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Stats = { posts: number; menu: number; reservations: number; newReservations: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "1";

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/posts").then((r) => r.json()),
      fetch("/api/admin/menu").then((r) => r.json()),
      fetch("/api/admin/reservations").then((r) => r.json()),
    ]).then(([posts, menu, reservations]) => {
      setStats({
        posts: posts.length,
        menu: menu.length,
        reservations: reservations.length,
        newReservations: reservations.filter((r: { status: string }) => r.status === "new").length,
      });
    });
  }, []);

  const cards = [
    { label: "Bài viết", value: stats?.posts, icon: "📝", href: "/admin/bai-viet", color: "#3498db" },
    { label: "Món trong menu", value: stats?.menu, icon: "🍜", href: "/admin/thuc-don", color: "#27ae60" },
    { label: "Đơn đặt bàn", value: stats?.reservations, icon: "📋", href: "/admin/dat-ban", color: "#e07b39" },
    { label: "Đơn mới", value: stats?.newReservations, icon: "🔔", href: "/admin/dat-ban", color: "#e74c3c" },
  ];

  const quickActions = [
    { label: "Viết bài mới", icon: "✏️", href: "/admin/bai-viet/new" },
    { label: "Thêm món ăn", icon: "➕", href: "/admin/thuc-don" },
    { label: "Xem đặt bàn", icon: "📋", href: "/admin/dat-ban" },
    { label: "Cài đặt trang", icon: "⚙️", href: "/admin/cai-dat" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {denied && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <span className="text-lg">🚫</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Không có quyền truy cập</p>
            <p className="text-xs text-red-500 mt-0.5">Trang đó yêu cầu vai trò cao hơn. Liên hệ quản trị viên.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow block">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: card.color }}>
                {stats ? card.value : "..."}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#1a5276" }}>
              {stats ? card.value : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#e07b39] hover:bg-orange-50 transition-all group">
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-gray-600 group-hover:text-[#e07b39] text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-3">Thông tin hệ thống</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span>Mật khẩu admin</span>
            <Link href="/admin/cai-dat" className="text-[#e07b39] font-medium">Thay đổi →</Link>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span>Trang web</span>
            <Link href="/" target="_blank" className="text-[#e07b39] font-medium">Xem trực tiếp →</Link>
          </div>
          <div className="flex justify-between py-2">
            <span>Phiên bản</span>
            <span className="text-gray-400">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
