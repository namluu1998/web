"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/roles";
import type { Role } from "@/lib/roles";

type Me = { id: string; username: string; name: string; role: Role };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/bai-viet", label: "Bài viết", icon: "📝" },
  { href: "/admin/thuc-don", label: "Thực đơn", icon: "🍜" },
  { href: "/admin/dat-ban", label: "Đặt bàn", icon: "📋" },
  { href: "/admin/danh-gia", label: "Đánh giá", icon: "⭐" },
  { href: "/admin/cai-dat", label: "Cài đặt", icon: "⚙️", adminOnly: true },
  { href: "/admin/users", label: "Người dùng", icon: "👥", adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMe(data); });
  }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const visibleNav = NAV.filter(item => !item.adminOnly || me?.role === "admin");

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f4f8" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "#1a5276" }}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦐</span>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Đặc Sản</p>
              <p className="text-white/60 text-xs">Phú Quốc Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {visibleNav.map(item => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex min-h-11 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}>
                <span className="w-5 shrink-0 text-center text-base leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Current user */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {me && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {me.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{me.name}</p>
                {(() => {
                  const rc = ROLE_COLORS[me.role];
                  return (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ color: rc.color, backgroundColor: rc.bg }}>
                      {ROLE_LABELS[me.role]}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <span>🚪</span> Đăng xuất
          </button>
          <Link href="/" target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all">
            <span>🌐</span> Xem trang web
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
