"use client";
import { useState } from "react";

export default function LienHe() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    guests: "", date: "", time: "", message: "",
  });

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Đã có lỗi xảy ra. Vui lòng thử lại.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <section id="lien-he" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Liên hệ
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Đặt Bàn & Hỏi Thêm
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Liên hệ với chúng tôi để đặt bàn trước hoặc hỏi thêm thông tin
        </p>

        <div className="max-w-xl mx-auto">
          {sent ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#1a5276" }}>Cảm ơn bạn đã đặt bàn!</h3>
              <p className="text-gray-500">Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                  <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="0901 234 567"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số khách *</label>
                  <input type="number" required min={1} max={50} value={form.guests}
                    onChange={(e) => set("guests", e.target.value)}
                    placeholder="4"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày *</label>
                  <input type="date" required value={form.date} min={today}
                    onChange={(e) => set("date", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ *</label>
                  <input type="time" required value={form.time}
                    onChange={(e) => set("time", e.target.value)}
                    min="06:00" max="22:00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tin nhắn</label>
                <textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)}
                  placeholder="Bạn muốn hỏi thêm điều gì?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] transition-colors text-sm resize-none" />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-full font-semibold text-white text-base transition-all hover:opacity-90 disabled:opacity-60"
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
