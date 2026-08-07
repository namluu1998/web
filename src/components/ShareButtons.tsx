"use client";
import { useState } from "react";

const BASE = "https://dacsan-phuquoc.vn";

export default function ShareButtons({ title, id }: { title: string; id: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${BASE}/bai-viet/${id}`;
  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Chia sẻ bài viết</p>
      <div className="flex gap-2 flex-wrap">
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "#1877f2" }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Facebook
        </a>
        <a href={`https://zalo.me/share/url?url=${enc}&title=${encTitle}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: "#0068ff" }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 16.43c-.224.463-.67.744-1.158.744-.21 0-.424-.05-.624-.158l-2.574-1.37c-.21.01-.42.016-.634.016-3.464 0-6.28-2.333-6.28-5.204 0-2.87 2.816-5.204 6.28-5.204 3.465 0 6.281 2.334 6.281 5.204 0 1.297-.548 2.487-1.45 3.385l.16 2.587z"/>
          </svg>
          Zalo
        </a>
        <a href={`https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-black transition-opacity hover:opacity-85">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </a>
        <button onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          {copied ? "Đã sao chép!" : "Sao chép link"}
        </button>
      </div>
    </div>
  );
}
