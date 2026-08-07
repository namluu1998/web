"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { SiteSettings, Faq } from "@/lib/data";

type Tab = "general" | "hero" | "images" | "faq" | "footer" | "social" | "password";

export default function CaiDatAdmin() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [tab, setTab] = useState<Tab>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqSaved, setFaqSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setSettings);
    fetch("/api/admin/faqs").then((r) => r.json()).then(setFaqs);
  }, []);

  const set = (k: string, v: string) => setSettings((s) => s ? { ...s, [k]: v } : s);
  const setStat = (i: number, k: "num" | "label", v: string) => setSettings((s) => {
    if (!s) return s;
    const stats = [...s.stats];
    stats[i] = { ...stats[i], [k]: v };
    return { ...s, stats };
  });
  const setGalleryImage = (i: number, url: string) => setSettings((s) => {
    if (!s) return s;
    const galleryImages = [...(s.galleryImages ?? [])];
    galleryImages[i] = url;
    return { ...s, galleryImages };
  });
  const addGalleryImage = () => setSettings((s) => s ? { ...s, galleryImages: [...(s.galleryImages ?? []), ""] } : s);
  const deleteGalleryImage = (i: number) => setSettings((s) => {
    if (!s) return s;
    return { ...s, galleryImages: (s.galleryImages ?? []).filter((_, index) => index !== i) };
  });
  const moveGalleryImage = (i: number, dir: -1 | 1) => setSettings((s) => {
    if (!s) return s;
    const galleryImages = [...(s.galleryImages ?? [])];
    const nextIndex = i + dir;
    if (nextIndex < 0 || nextIndex >= galleryImages.length) return s;
    [galleryImages[i], galleryImages[nextIndex]] = [galleryImages[nextIndex], galleryImages[i]];
    return { ...s, galleryImages };
  });

  async function save() {
    if (!settings) return;
    const normalizedSettings = {
      ...settings,
      galleryImages: (settings.galleryImages ?? []).map((url) => url.trim()).filter(Boolean),
    };
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedSettings),
    });
    setSettings(normalizedSettings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <div className="p-6 text-gray-400">Đang tải...</div>;

  async function saveFaqs() {
    setFaqSaving(true);
    await fetch("/api/admin/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faqs),
    });
    setFaqSaving(false);
    setFaqSaved(true);
    setTimeout(() => setFaqSaved(false), 2000);
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { id: Date.now().toString(), q: "", a: "" }]);
  }

  function updateFaq(id: string, k: "q" | "a", v: string) {
    setFaqs((prev) => prev.map((f) => f.id === id ? { ...f, [k]: v } : f));
  }

  function deleteFaq(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  function moveFaq(id: string, dir: -1 | 1) {
    setFaqs((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "general", label: "Thông tin chung", icon: "🏪" },
    { key: "hero", label: "Banner trang chủ", icon: "🎨" },
    { key: "images", label: "Hình ảnh", icon: "🖼️" },
    { key: "faq", label: "Câu hỏi FAQ", icon: "❓" },
    { key: "footer", label: "Footer", icon: "📄" },
    { key: "social", label: "Mạng xã hội", icon: "📱" },
    { key: "password", label: "Mật khẩu admin", icon: "🔐" },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Cài đặt trang</h1>
        <p className="text-gray-500 text-sm mt-1">Thay đổi thông tin hiển thị trên toàn bộ website</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? "text-white shadow-sm" : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
            style={tab === t.key ? { backgroundColor: "#1a5276" } : {}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* General */}
        {tab === "general" && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <Field label="Tên cửa hàng" value={settings.siteName} onChange={(v) => set("siteName", v)} />
                <Field label="Số điện thoại hotline" value={settings.phone} onChange={(v) => set("phone", v)} />
                <Field label="Email liên hệ" value={settings.email} onChange={(v) => set("email", v)} />
                <Field label="Địa chỉ" value={settings.address} onChange={(v) => set("address", v)} />
                <Field label="Giờ mở cửa" value={settings.hours} onChange={(v) => set("hours", v)} />
                <Field label="Thông báo banner (PromoBanner)" value={settings.promoBanner} onChange={(v) => set("promoBanner", v)} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4">Thống kê hiển thị (Hero)</h2>
              <div className="space-y-3">
                {settings.stats.map((s, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3">
                    <Field label={`Số liệu ${i + 1}`} value={s.num} onChange={(v) => setStat(i, "num", v)} />
                    <Field label={`Nhãn ${i + 1}`} value={s.label} onChange={(v) => setStat(i, "label", v)} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Hero */}
        {tab === "hero" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">Nội dung banner trang chủ</h2>
            <div className="space-y-4">
              <Field label="Dòng nhãn nhỏ (tagline)" value={settings.tagline} onChange={(v) => set("tagline", v)} />
              <Field label="Tiêu đề chính" value={settings.heroTitle} onChange={(v) => set("heroTitle", v)}
                help="Dòng tiêu đề lớn hiển thị trên banner" />
              <Field label="Từ khóa nổi bật (màu vàng)" value={settings.heroHighlight} onChange={(v) => set("heroHighlight", v)}
                help="Đoạn chữ được highlight màu vàng trong tiêu đề" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả phụ</label>
                <textarea rows={3} value={settings.heroDesc} onChange={(e) => set("heroDesc", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Images */}
        {tab === "images" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-1">Logo cửa hàng</h2>
              <p className="text-xs text-gray-400 mb-4">Hiển thị trên thanh điều hướng (navbar). Nếu trống sẽ dùng icon mặc định 🦐.</p>
              <ImageUploader
                value={settings.logoImage || ""}
                onChange={(url) => set("logoImage", url)}
                placeholder="Logo — tỉ lệ vuông, nền trong suốt sẽ đẹp hơn"
                previewSize="sm"
              />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-1">Ảnh giới thiệu</h2>
              <p className="text-xs text-gray-400 mb-4">Hiển thị trong phần &quot;Giới thiệu&quot; trên trang chủ. Nếu trống sẽ dùng icon mặc định 🍜.</p>
              <ImageUploader
                value={settings.introImage || ""}
                onChange={(url) => set("introImage", url)}
                placeholder="Ảnh món ăn / không gian quán"
                previewSize="lg"
              />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-1">Góc Ảnh Quán</h2>
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs text-gray-400">Có thể thêm nhiều ảnh và cập nhật hằng ngày. Ảnh trống sẽ không hiển thị ngoài trang chủ.</p>
                <button type="button" onClick={addGalleryImage}
                  className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: "#e07b39" }}>
                  + Thêm ảnh
                </button>
              </div>
              {(settings.galleryImages ?? []).length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center mb-4">
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-sm text-gray-400 mb-3">Chưa có ảnh nào cho Góc Ảnh Quán.</p>
                  <button type="button" onClick={addGalleryImage}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: "#e07b39" }}>
                    Thêm ảnh đầu tiên
                  </button>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(settings.galleryImages ?? []).map((image, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Ảnh {i + 1}</p>
                    <div className="flex gap-1 mb-2">
                      <button type="button" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0}
                        className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs">▲</button>
                      <button type="button" onClick={() => moveGalleryImage(i, 1)} disabled={i === (settings.galleryImages ?? []).length - 1}
                        className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs">▼</button>
                      <button type="button" onClick={() => deleteGalleryImage(i)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs">✕</button>
                    </div>
                    <ImageUploader
                      value={image || ""}
                      onChange={(url) => setGalleryImage(i, url)}
                      placeholder={`Ảnh góc quán ${i + 1}`}
                      previewSize="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        {tab === "faq" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-700">Câu hỏi thường gặp</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Hiển thị trong phần &quot;Giải đáp&quot; trên trang chủ</p>
                </div>
                <button onClick={addFaq}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: "#e07b39" }}>
                  + Thêm câu hỏi
                </button>
              </div>

              {faqs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">❓</p>
                  <p className="text-sm">Chưa có câu hỏi nào. Nhấn &quot;Thêm câu hỏi&quot; để bắt đầu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faqs.map((f, i) => (
                    <div key={f.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">#{i + 1}</span>
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => moveFaq(f.id, -1)} disabled={i === 0}
                            className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs">▲</button>
                          <button onClick={() => moveFaq(f.id, 1)} disabled={i === faqs.length - 1}
                            className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs">▼</button>
                          <button onClick={() => deleteFaq(f.id)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs">✕</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Câu hỏi</label>
                        <input type="text" value={f.q} onChange={(e) => updateFaq(f.id, "q", e.target.value)}
                          placeholder="Nhập câu hỏi..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Câu trả lời</label>
                        <textarea rows={3} value={f.a} onChange={(e) => updateFaq(f.id, "a", e.target.value)}
                          placeholder="Nhập câu trả lời..."
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#e07b39] resize-none" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={saveFaqs} disabled={faqSaving}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: faqSaving ? "#aaa" : faqSaved ? "#16a34a" : "#e07b39" }}>
              {faqSaving ? "Đang lưu..." : faqSaved ? "✅ Đã lưu!" : "💾 Lưu FAQ"}
            </button>
          </div>
        )}

        {/* Footer */}
        {tab === "footer" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-1">Nội dung Footer</h2>
            <p className="text-xs text-gray-400 mb-4">Phần cuối trang website</p>
            <div className="space-y-4">
              <Field
                label="Slogan / mô tả ngắn"
                value={settings.footerTagline || ""}
                onChange={(v) => set("footerTagline", v)}
                help="Dòng mô tả hiển thị dưới tên cửa hàng ở footer"
              />
            </div>
          </div>
        )}

        {/* Social */}
        {tab === "social" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">Liên kết mạng xã hội</h2>
            <div className="space-y-4">
              <Field label="🔵 Facebook" value={settings.facebook} onChange={(v) => set("facebook", v)} type="url" />
              <Field label="🟣 Instagram" value={settings.instagram} onChange={(v) => set("instagram", v)} type="url" />
              <Field label="⚫ TikTok" value={settings.tiktok} onChange={(v) => set("tiktok", v)} type="url" />
              <Field label="🔴 YouTube" value={settings.youtube} onChange={(v) => set("youtube", v)} type="url" />
            </div>
          </div>
        )}

        {/* Password */}
        {tab === "password" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-4">Đổi mật khẩu admin</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm" />
              </div>
              <p className="text-xs text-gray-400 bg-yellow-50 p-3 rounded-xl">
                ⚠️ Mật khẩu được cấu hình qua biến môi trường <code className="font-mono bg-yellow-100 px-1 rounded">ADMIN_PASSWORD</code> trong file <code className="font-mono bg-yellow-100 px-1 rounded">.env.local</code>. Cần restart server sau khi thay đổi.
              </p>
              <button disabled={!newPassword || newPassword !== confirmPassword}
                onClick={() => alert("Hãy cập nhật ADMIN_PASSWORD trong file .env.local và restart server")}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-40"
                style={{ backgroundColor: "#1a5276" }}>
                Xem hướng dẫn đổi mật khẩu
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        {tab !== "password" && tab !== "faq" && (
          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: saving ? "#aaa" : saved ? "#16a34a" : "#e07b39" }}>
            {saving ? "Đang lưu..." : saved ? "✅ Đã lưu!" : "💾 Lưu thay đổi"}
          </button>
        )}
      </div>
    </div>
  );
}

function ImageUploader({
  value,
  onChange,
  placeholder,
  previewSize,
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder: string;
  previewSize: "sm" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      onChange(data.url);
    } else {
      setError(data.error || "Upload thất bại");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const previewH = previewSize === "lg" ? "h-56" : "h-28";

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value ? (
        <div className={`relative ${previewH} rounded-xl overflow-hidden bg-gray-100 border border-gray-200`}>
          <Image src={value} alt="Preview" fill className="object-contain p-2" />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 shadow text-sm font-bold">
            ×
          </button>
        </div>
      ) : (
        <div
          className={`${previewH} rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#e07b39] hover:bg-orange-50 transition-colors`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}>
          <span className="text-3xl">🖼️</span>
          <p className="text-sm text-gray-400 text-center px-4">{placeholder}</p>
          <p className="text-xs text-gray-300">Kéo thả hoặc nhấn để chọn ảnh</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50">
          {uploading ? "Đang tải lên..." : value ? "🔄 Thay ảnh" : "📁 Chọn ảnh"}
        </button>
        {value && (
          <button
            onClick={() => onChange("")}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
            Xóa
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Field({ label, value, onChange, help, type = "text" }: {
  label: string; value: string;
  onChange: (v: string) => void;
  help?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {help && <p className="text-xs text-gray-400 mb-1">{help}</p>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e07b39] text-sm" />
    </div>
  );
}
