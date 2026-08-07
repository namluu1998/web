"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/data";
import { isImageValue } from "@/lib/imageHelper";
import { matchesSearch } from "@/lib/search";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 10;

export default function BaiVietAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  async function load() {
    const data = await fetch("/api/admin/posts").then((r) => r.json());
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function deletePost(id: string) {
    if (!confirm("Xóa bài viết này?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(post: Post) {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    load();
  }

  const filtered = posts.filter((p) =>
    matchesSearch(search, [p.title, p.tag, p.tags, p.excerpt, p.date])
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Bài viết</h1>
          <p className="text-gray-400 text-sm mt-0.5">{posts.length} bài viết</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm tiêu đề hoặc tag..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1a5276] transition-colors sm:w-56"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          <Link href="/admin/bai-viet/new"
            className="px-4 py-2 rounded-xl font-semibold text-white text-sm whitespace-nowrap"
            style={{ backgroundColor: "#e07b39" }}>
            + Viết bài mới
          </Link>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl text-gray-400 text-sm">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-400 text-sm">{search ? "Không tìm thấy kết quả phù hợp" : "Chưa có bài viết nào"}</p>
              {!search && (
                <Link href="/admin/bai-viet/new" className="mt-3 inline-block text-sm font-medium" style={{ color: "#e07b39" }}>
                  Viết bài đầu tiên →
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 w-14"></th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tiêu đề</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Lượt xem</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Ngày</th>
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Trạng thái</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((post) => (
                      <tr key={post.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          {isImageValue(post.emoji)
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={post.emoji} alt="" className="w-9 h-9 rounded-lg object-cover" />
                            : <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-50 text-xl">{post.emoji}</div>
                          }
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800 text-sm">{post.title}</span>
                            {post.tag && (
                              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                                style={{ backgroundColor: "#e07b39" }}>{post.tag}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                          👁 {post.views}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 hidden sm:table-cell whitespace-nowrap">{post.date}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            post.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {post.published ? "Hiện" : "Ẩn"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => togglePublish(post)}
                              title={post.published ? "Ẩn bài" : "Hiện bài"}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm ${
                                post.published
                                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}>
                              {post.published ? "⏸" : "▶"}
                            </button>
                            <Link href={`/admin/bai-viet/${post.id}`}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm">
                              ✏️
                            </Link>
                            <button onClick={() => deletePost(post.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
