"use client";
import { useState } from "react";
import type { Faq } from "@/lib/data";

export default function FAQClient({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!faqs.length) return null;

  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Giải đáp
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Câu Hỏi Thường Gặp
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Những thắc mắc phổ biến nhất từ khách hàng
        </p>

        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-base transition-colors hover:bg-orange-50"
                style={{ color: open === f.id ? "#e07b39" : "#1a5276" }}
                onClick={() => setOpen(open === f.id ? null : f.id)}
              >
                <span>{f.q}</span>
                <span className="shrink-0 text-xl transition-transform duration-200"
                  style={{ transform: open === f.id ? "rotate(45deg)" : "rotate(0deg)" }}>
                  +
                </span>
              </button>
              {open === f.id && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
