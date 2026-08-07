"use client";

import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function PostBodyEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const htmlFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function insertImage(url: string) {
    const textarea = textareaRef.current;
    const caption = window.prompt("Nhập chú thích ảnh", "")?.trim() || "";
    const snippet = `\n\n![${caption}](${url})\n\n`;

    if (!textarea) {
      onChange(`${value}${snippet}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn (tối đa 5MB)");
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

      insertImage(data.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleHtmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.onerror = () => setError("Không đọc được file. Hãy thử lại.");
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="block text-sm font-medium text-gray-700">Nội dung bài viết</label>
        <div className="flex items-center gap-2">
          <input
            ref={htmlFileRef}
            type="file"
            accept=".html,.htm,text/html"
            className="hidden"
            onChange={handleHtmlFile}
          />
          <button
            type="button"
            onClick={() => htmlFileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:border-[#e07b39] hover:text-[#e07b39]"
          >
            📄 Tải file HTML
          </button>
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
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:border-[#e07b39] hover:text-[#e07b39] disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M12 4v8m4-4H8"
              />
            </svg>
            {uploading ? "Đang tải..." : "Chèn ảnh"}
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        rows={24}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Viết nội dung bài viết. Bấm Chèn ảnh để thêm ảnh vào vị trí con trỏ."
        className="w-full min-h-[560px] resize-y rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm focus:border-[#e07b39] focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>Ảnh trong bài sẽ có dạng: ![chú thích](/uploads/ten-file.jpg)</span>
        <span>JPG, PNG, WEBP, GIF, AVIF - tối đa 5MB</span>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <details className="mt-2 text-xs text-gray-400">
        <summary className="cursor-pointer select-none hover:text-gray-600">
          Cú pháp nâng cao (mục lục, FAQ, khung gợi ý, CTA, bảng giá...)
        </summary>
        <ul className="mt-2 space-y-1.5 pl-3">
          <li><code>[toc]</code> — chèn mục lục tự động từ các dòng VIẾT HOA trong bài.</li>
          <li><code>:::tip</code> ... <code>:::</code> — khung &quot;mẹo hay&quot; nổi bật.</li>
          <li><code>:::faq</code> ... <code>:::</code> — mỗi câu hỏi 1 dòng <code>Q: ...</code>, câu trả lời dòng <code>A: ...</code> ngay sau.</li>
          <li><code>:::cta</code> ... <code>:::</code> — dòng đầu là tiêu đề, dòng giữa là mô tả, dòng <code>[Tên nút](link)</code> là nút bấm.</li>
          <li><code>:::grid</code> ... <code>:::</code> — mỗi dòng <code>Nhãn | Giá trị</code> thành 1 ô trong lưới.</li>
          <li>Dán nguyên 1 đoạn mã HTML (bắt đầu bằng <code>&lt;</code>) cũng được — hệ thống sẽ tự lọc bỏ phần nguy hiểm (script, style...) trước khi hiển thị.</li>
        </ul>
      </details>
    </div>
  );
}
