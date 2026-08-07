"use client";

import { useRef, useState } from "react";
import { isImageValue } from "@/lib/imageHelper";

type Props = {
  value: string;
  fallbackEmoji: string;
  onChange: (value: string) => void;
};

export default function PostCoverUploader({ value, fallbackEmoji, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isImage = isImageValue(value);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn, tối đa 5MB");
      return;
    }

    setError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setError(data.error || "Tải ảnh thất bại");
        return;
      }
      onChange(data.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-gray-700">Hình ảnh bài viết</label>
        {isImage && (
          <button
            type="button"
            onClick={() => onChange(fallbackEmoji)}
            className="text-xs font-medium text-red-500 hover:text-red-600"
          >
            Xóa ảnh
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="relative flex h-72 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-[#e07b39] hover:bg-orange-50/40"
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Ảnh bài viết" className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="mb-4 text-6xl">{value || fallbackEmoji}</div>
            <p className="text-sm font-semibold text-[#1a5276]">
              {uploading ? "Đang tải ảnh lên..." : "Nhấn để tải hình lên"}
            </p>
            <p className="mt-2 text-xs text-gray-400">Kéo thả ảnh hoặc chọn file JPG, PNG, WEBP, GIF, AVIF</p>
            <p className="mt-1 text-xs text-gray-300">Khuyến nghị ảnh ngang 1920x1080, tối đa 5MB</p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
