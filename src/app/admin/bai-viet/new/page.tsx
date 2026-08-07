"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EmojiOrImagePicker from "@/components/admin/EmojiOrImagePicker";
import PostBodyEditor from "@/components/admin/PostBodyEditor";
import PostCoverUploader from "@/components/admin/PostCoverUploader";

const TAGS = ["Đặc sản", "Hải sản", "Gia vị", "Quà tặng", "Du lịch", "Ẩm thực"];
const EMOJIS = ["📝", "🍜", "🦐", "🫙", "🥜", "🦀", "🦑", "🐟", "🥗", "🍵", "🗺️", "📸"];

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    emoji: "📝",
    title: "",
    excerpt: "",
    content: "",
    tag: "",
    tags: "",
    published: true,
    featured: false,
    views: "0",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.title.trim()) return alert("Vui lòng nhập tiêu đề");
    setSaving(true);
    const n = parseInt(String(form.views).replace(/\D/g, ""), 10) || 0;
    await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, views: n.toLocaleString("vi-VN") }),
    });
    router.push("/admin/bai-viet");
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/bai-viet" className="text-sm text-gray-400 hover:text-gray-600">← Bài viết</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold" style={{ color: "#1a5276" }}>Thêm bài viết</h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          style={{ backgroundColor: "#e07b39" }}
        >
          {saving ? "Đang lưu..." : "Thêm mới"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <PostCoverUploader value={form.emoji} fallbackEmoji="📝" onChange={(value) => set("emoji", value)} />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tiêu đề bài viết *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Nhập tiêu đề bài viết"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#e07b39] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              rows={4}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Nhập mô tả ngắn hiển thị trên trang chủ"
              className="min-h-32 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#e07b39] focus:outline-none"
            />
          </div>

          <PostBodyEditor value={form.content} onChange={(value) => set("content", value)} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="rounded border-gray-300 accent-[#1a5276]"
              />
              Nổi bật
            </label>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-700">Thông tin đăng</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Trạng thái *</label>
                <select
                  value={form.published ? "published" : "hidden"}
                  onChange={(e) => set("published", e.target.value === "published")}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#e07b39] focus:outline-none"
                >
                  <option value="published">Hiển thị</option>
                  <option value="hidden">Ẩn bài viết</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Danh mục bài viết *</label>
                <select
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-[#e07b39] focus:outline-none"
                >
                  <option value="">Chọn danh mục</option>
                  {TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Thẻ</label>
                <input
                  value={form.tag}
                  onChange={(e) => set("tag", e.target.value)}
                  placeholder="Thêm tag"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#e07b39] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <EmojiOrImagePicker value={form.emoji} onChange={(v) => set("emoji", v)} emojis={EMOJIS} label="Ảnh/biểu tượng phụ" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#e07b39" }}
            >
              {saving ? "Đang lưu..." : "Lưu bài viết"}
            </button>
            <Link href="/admin/bai-viet" className="rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50">
              Hủy
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
