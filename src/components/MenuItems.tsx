"use client";

import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/data";
import { isImageValue } from "@/lib/imageHelper";

function ItemVisual({ item, mode = "card" }: { item: MenuItem; mode?: "card" | "modal" }) {
  const image = isImageValue(item.emoji);
  const height = mode === "modal" ? "h-full min-h-[220px]" : "h-36";
  const emojiSize = mode === "modal" ? "text-7xl" : "text-5xl";

  if (image) {
    return (
      <div className={`${height} overflow-hidden bg-orange-50`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.emoji}
          alt={item.name}
          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`${height} flex items-center justify-center ${emojiSize}`}
      style={{ background: "linear-gradient(135deg, #fde8d0, #fff7ed)" }}
    >
      {item.emoji}
    </div>
  );
}

function Tag({ value }: { value: string }) {
  if (!value) return null;

  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: "#e07b39" }}>
      {value}
    </span>
  );
}

export default function MenuItems({ items }: { items: MenuItem[] }) {
  const [selected, setSelected] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="group flex min-h-[310px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e07b39]/40"
          >
            <ItemVisual item={item} />

            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold leading-snug" style={{ color: "#1a5276" }}>
                  {item.name}
                </h3>
                <Tag value={item.tag} />
              </div>
              <p className="line-clamp-2 flex-1 text-sm leading-6 text-gray-500">{item.desc}</p>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-lg font-bold" style={{ color: "#e07b39" }}>
                  {item.price}
                </span>
                <span className="text-xs font-semibold text-gray-400 transition-colors group-hover:text-[#e07b39]">
                  Xem chi tiết
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.58)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-gray-500 shadow-sm transition-colors hover:bg-white hover:text-gray-800"
              aria-label="Đóng"
            >
              ×
            </button>

            <div className="grid md:grid-cols-[minmax(240px,0.9fr)_1fr]">
              <ItemVisual item={selected} mode="modal" />

              <div className="flex flex-col p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="menu-item-title" className="text-2xl font-bold leading-tight" style={{ color: "#1a5276" }}>
                        {selected.name}
                      </h2>
                      <Tag value={selected.tag} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-gray-600">{selected.desc}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-orange-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Giá món</p>
                  <p className="mt-1 text-3xl font-bold" style={{ color: "#e07b39" }}>
                    {selected.price}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Xem món khác
                  </button>
                  <a
                    href="#lien-he"
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#e07b39" }}
                  >
                    Đặt món này →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
