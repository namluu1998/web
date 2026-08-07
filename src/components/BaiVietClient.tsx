"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/data";
import { isImageValue } from "@/lib/imageHelper";

const PAGE_SIZE = 4;

export default function BaiVietClient({ articles }: { articles: Post[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(articles.length / PAGE_SIZE);
  const visibleArticles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return articles.slice(start, start + PAGE_SIZE);
  }, [articles, page]);

  if (articles.length === 0) return null;

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-6">
        {visibleArticles.map((a) => (
          <Link key={a.id} href={`/bai-viet/${a.id}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group block">
            <article>
              <div className="h-40 flex items-center justify-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, #fde8d0, #fef3e2)" }}>
                {isImageValue(a.emoji) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.emoji} alt={a.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-7xl">{a.emoji}</span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                    style={{ backgroundColor: "#e07b39" }}>{a.tag}</span>
                  <span className="text-xs text-gray-400">📅 {a.date}</span>
                  <span className="text-xs text-gray-400 ml-auto flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {a.views}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-2 group-hover:text-[#e07b39] transition-colors leading-snug"
                  style={{ color: "#1a5276" }}>
                  {a.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{a.excerpt}</p>
                <div className="mt-3 text-sm font-semibold" style={{ color: "#e07b39" }}>
                  Đọc thêm →
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="h-10 px-4 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:border-[#e07b39] hover:text-[#e07b39] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                className="h-10 w-10 rounded-full border text-sm font-bold transition-colors"
                style={pageNumber === page
                  ? { backgroundColor: "#1a5276", borderColor: "#1a5276", color: "#fff" }
                  : { backgroundColor: "#fff", borderColor: "#e5e7eb", color: "#64748b" }}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="h-10 px-4 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:border-[#e07b39] hover:text-[#e07b39] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
