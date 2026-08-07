"use client";
import { useState } from "react";
import type { Faq } from "@/lib/data";
import OpenStatus from "@/components/OpenStatus";

type InfoRowProps = {
  phone: string;
  address: string;
  hours: string;
  mapShare: string;
  faqs: Faq[];
};

/* ── MAP ── */
const MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d18676.737343723173!2d103.9494640441595!3d10.237340784306836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a78b0011d64027%3A0xcc14425326244ec8!2zQsO6biBRdeG6rXkgTmjGsCDDnQ!5e0!3m2!1svi!2s!4v1780558729335!5m2!1svi!2s";


export default function InfoRow({ phone, address, hours, mapShare, faqs = [] }: InfoRowProps) {
  const telPhone = phone.replace(/\s+/g, "");

  /* FAQ state */
  const [open, setOpen] = useState<string | null>(null);
  /* Form state */
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", guests: "", date: "", time: "", message: "" });
  const setField = (k: string, v: string) => setFormData((f) => ({ ...f, [k]: v }));
  const today = new Date().toISOString().split("T")[0];

  return (
    <section id="ban-do" className="py-10 md:py-14 px-4" style={{ background: "#fffbf5" }}>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* ── CỘT 1: FAQ ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#e07b39" }}>Giải đáp</p>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#1a5276" }}>Câu Hỏi Thường Gặp</h2>
          <div className="space-y-2 flex-1">
            {faqs.map((f) => (
              <div key={f.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-orange-50 transition-colors"
                  style={{ color: open === f.id ? "#e07b39" : "#1a5276" }}
                  onClick={() => setOpen(open === f.id ? null : f.id)}
                >
                  <span>{f.q}</span>
                  <span className="shrink-0 text-base" style={{ transform: open === f.id ? "rotate(45deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>+</span>
                </button>
                {open === f.id && (
                  <div className="px-4 pb-3 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-50">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CỘT 2: BẢN ĐỒ ── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#e07b39" }}>Địa chỉ</p>
            <h2 className="text-xl font-bold mb-3" style={{ color: "#1a5276" }}>Tìm Chúng Tôi</h2>
          </div>

          {/* Map iframe thật */}
          <div className="rounded-xl overflow-hidden" style={{ height: 200 }}>
            <iframe
              src={MAP_EMBED}
              width="100%"
              height="200"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bản đồ Bún Quậy Như Ý"
            />
          </div>

          {/* Info cards */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">📍</span>
              <div>
                <p className="font-semibold" style={{ color: "#1a5276" }}>Địa chỉ</p>
                <p className="text-gray-500">{address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">🕐</span>
              <div>
                <p className="font-semibold" style={{ color: "#1a5276" }}>Giờ mở cửa</p>
                <p className="text-gray-500">{hours}</p>
                <div className="mt-1"><OpenStatus /></div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">📞</span>
              <div>
                <p className="font-semibold" style={{ color: "#1a5276" }}>Hotline</p>
                <a href={`tel:${telPhone}`} className="text-gray-500 hover:text-[#e07b39]">{phone}</a>
              </div>
            </div>
          </div>

          <a href={mapShare} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#e07b39" }}>
            📍 Mở trong Google Maps
          </a>
        </div>

        {/* ── CỘT 3: FORM ĐẶT BÀN ── */}
        <div id="lien-he" className="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#e07b39" }}>Liên hệ</p>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#1a5276" }}>Đặt Bàn & Hỏi Thêm</h2>

          {sent ? (
            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="font-bold text-base mb-1" style={{ color: "#1a5276" }}>Cảm ơn bạn!</h3>
              <p className="text-sm text-gray-500">Chúng tôi sẽ phản hồi trong 24 giờ.</p>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setFormError(null);
              try {
                const res = await fetch("/api/reservations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
                });
                const json = await res.json();
                if (!res.ok) {
                  setFormError(json.error ?? "Đã có lỗi xảy ra. Vui lòng thử lại.");
                } else {
                  setSent(true);
                }
              } catch {
                setFormError("Không thể kết nối. Vui lòng thử lại.");
              } finally {
                setLoading(false);
              }
            }} className="space-y-3 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Họ tên *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setField("name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Điện thoại *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setField("phone", e.target.value)}
                    placeholder="0901 234 567"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setField("email", e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Số khách *</label>
                  <input type="number" required min={1} max={50} value={formData.guests}
                    onChange={(e) => setField("guests", e.target.value)}
                    placeholder="4"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ngày *</label>
                  <input type="date" required value={formData.date} min={today}
                    onChange={(e) => setField("date", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giờ *</label>
                  <input type="time" required value={formData.time} min="06:00" max="22:00"
                    onChange={(e) => setField("time", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tin nhắn</label>
                <textarea rows={3} value={formData.message} onChange={(e) => setField("message", e.target.value)}
                  placeholder="Bạn muốn hỏi thêm điều gì?"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39] resize-none" />
              </div>
              {formError && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                  ⚠️ {formError}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="mt-auto w-full py-3 rounded-full font-semibold text-white text-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#e07b39" }}>
                {loading ? "Đang gửi..." : "Gửi yêu cầu đặt bàn 🍜"}
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}
