import Image from "next/image";
import type { SiteSettings } from "@/lib/data";

const navLinks = [
  { label: "Giới thiệu", href: "#gioi-thieu" },
  { label: "Menu", href: "#menu" },
  { label: "Đánh giá", href: "#danh-gia" },
  { label: "Bài viết", href: "#bai-viet" },
  { label: "Bản đồ", href: "#ban-do" },
  { label: "Liên hệ", href: "#lien-he" },
];

const socialIcons = [
  {
    key: "facebook" as const,
    name: "Facebook",
    color: "#1877F2",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "instagram" as const,
    name: "Instagram",
    color: "#E1306C",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: "tiktok" as const,
    name: "TikTok",
    color: "#010101",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.53V6.78a4.85 4.85 0 01-1.01-.09z" />
      </svg>
    ),
  },
  {
    key: "youtube" as const,
    name: "YouTube",
    color: "#FF0000",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

export default function Footer({ settings }: { settings: SiteSettings }) {
  const telPhone = settings.phone.replace(/\s+/g, "");

  return (
    <footer className="bg-[#1a5276] text-white">
      <div className="border-b border-white/15 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold">Theo dõi chúng tôi</p>
            <p className="mt-1 text-sm text-white/65">Cập nhật món mới, ưu đãi hàng tuần</p>
          </div>
          <div className="flex items-center gap-3">
            {socialIcons.map((s) => (
              <a
                key={s.name}
                href={settings[s.key]}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
                className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: s.color }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-10 md:pr-24 xl:pr-4">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.75fr_1.2fr] xl:grid-cols-[1.1fr_0.7fr_1.1fr_0.95fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              {settings.logoImage ? (
                <Image src={settings.logoImage} alt="Logo" width={44} height={44} className="rounded-full object-contain" />
              ) : (
                <span className="text-3xl">🦐</span>
              )}
              <span className="text-xl font-bold">{settings.siteName}</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              {settings.footerTagline || "Mang đến hương vị đặc sản đảo ngọc Phú Quốc, tươi ngon, chính thống, đậm đà bản sắc."}
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/80">Điều hướng</h4>
            <ul className="space-y-2 text-sm text-white/65">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/80">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">📍</span>
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">✉️</span>
                <a href={`mailto:${settings.email}`} className="break-all transition-colors hover:text-white">{settings.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">🕐</span>
                <span>{settings.hours}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 lg:col-span-3 xl:col-span-1">
            <p className="text-sm font-semibold text-white/70">Hotline đặt bàn</p>
            <a href={`tel:${telPhone}`} className="mt-3 flex items-center gap-3 text-white transition-opacity hover:opacity-85">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl">📞</span>
              <span className="whitespace-nowrap text-2xl font-bold tracking-wide">{settings.phone}</span>
            </a>
            <a
              href="#lien-he"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-bold text-[#1a5276] transition-opacity hover:opacity-90"
            >
              Liên hệ ngay
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/45">
        © 2025 {settings.siteName}. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
