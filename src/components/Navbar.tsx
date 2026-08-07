"use client";
import { useState } from "react";
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

export default function Navbar({ settings }: { settings?: Pick<SiteSettings, "siteName" | "logoImage"> }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          {settings?.logoImage ? (
            <Image src={settings.logoImage} alt="Logo" width={36} height={36} className="object-contain rounded" />
          ) : (
            <span className="text-2xl">🦐</span>
          )}
          <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>
            {settings?.siteName || "Đặc Sản Phú Quốc"}
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-700 hover:text-[#e07b39] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#lien-he"
            className="ml-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Đặt bàn
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium text-gray-700 hover:text-[#e07b39]"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}


