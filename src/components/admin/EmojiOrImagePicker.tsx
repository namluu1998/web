"use client";
import { useRef, useState } from "react";
import { isImageValue } from "@/lib/imageHelper";

interface Props {
  value: string;
  onChange: (val: string) => void;
  emojis: string[];
  label?: string;
}

export default function EmojiOrImagePicker({ value, onChange, emojis, label = "Biểu tượng" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn (tối đa 5MB)");
      return;
    }

    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (data.url) {
      onChange(data.url);
    } else {
      setError(data.error || "Tải ảnh thất bại");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const isImage = isImageValue(value);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Emoji grid */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={`text-xl w-10 h-10 rounded-xl transition-all ${
              value === e
                ? "bg-orange-100 ring-2 ring-[#e07b39]"
                : "hover:bg-gray-100"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={handleFile}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#e07b39] hover:text-[#e07b39] transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploading ? "Đang tải..." : "Tải ảnh lên"}
        </button>

        {/* Preview */}
        <div className="flex items-center gap-2">
          {isImage ? (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#e07b39] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <span className="text-3xl">{value}</span>
          )}
          {isImage && (
            <button
              type="button"
              onClick={() => onChange(emojis[0])}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Xóa ảnh, quay lại dùng emoji"
            >
              ✕ Xóa ảnh
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, GIF · Tối đa 5MB</p>
    </div>
  );
}
