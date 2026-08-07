"use client";
import { useEffect, useState } from "react";

function isOpen(): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMin = h * 60 + m;
  return totalMin >= 6 * 60 && totalMin < 22 * 60; // 06:00–22:00
}

export default function OpenStatus() {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const updateOpen = () => setOpen(isOpen());
    const timeout = window.setTimeout(updateOpen, 0);
    const id = setInterval(() => setOpen(isOpen()), 60_000);
    return () => {
      window.clearTimeout(timeout);
      clearInterval(id);
    };
  }, []);

  if (open === null) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: open ? "#dcfce7" : "#fee2e2",
        color: open ? "#166534" : "#991b1b",
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: open ? "#22c55e" : "#ef4444", animation: open ? "pulse 2s infinite" : "none" }}
      />
      {open ? "Đang mở cửa" : "Đã đóng cửa"}
    </span>
  );
}

