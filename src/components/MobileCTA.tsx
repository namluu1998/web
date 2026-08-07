"use client";
import { useState, useEffect } from "react";

export default function MobileCTA({ phone }: { phone: string }) {
  const [visible, setVisible] = useState(false);
  const telPhone = phone.replace(/\s+/g, "");

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 py-3 shadow-2xl border-t border-gray-100"
      style={{ background: "white" }}>
      <div className="flex gap-3 max-w-sm mx-auto">
        <a
          href={`tel:${telPhone}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 font-semibold text-sm transition-all"
          style={{ borderColor: "#e07b39", color: "#e07b39" }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
          </svg>
          Gọi ngay
        </a>
        <a
          href="#lien-he"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm text-white transition-all"
          style={{ backgroundColor: "#e07b39" }}
        >
          🍜 Đặt bàn ngay
        </a>
      </div>
    </div>
  );
}
