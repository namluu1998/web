"use client";
import { useEffect, useState } from "react";
import { matchesSearch } from "@/lib/search";

type Review = {
  name: string;
  stars: number;
  date: string;
  text: string;
  profilePhoto?: string | null;
};

type ReviewsData = {
  reviews: Review[];
  rating: number;
  totalRatings: number;
  lastFetched: string | null;
  googleApiKeyConfigured?: boolean;
};

export default function DanhGiaAdmin() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/reviews").then((r) => r.json()).then(setData);
  }, []);

  async function syncFromGoogle() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/reviews", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Lỗi không xác định");
      } else {
        setData(json);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  }

  const filteredReviews = data?.reviews.filter((r) =>
    matchesSearch(search, [r.name, r.text, r.date, r.stars])
  ) ?? [];

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1a5276" }}>Đánh giá Google Maps</h1>
        <p className="text-gray-500 text-sm mt-1">Đồng bộ đánh giá tốt (4–5 sao) từ Google Maps về trang chủ</p>
      </div>

      {/* Sync card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-700 mb-1">Đồng bộ từ Google Maps</h2>
            {data?.lastFetched ? (
              <p className="text-xs text-gray-400">
                Lần cuối cập nhật: {new Date(data.lastFetched).toLocaleString("vi-VN")}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Chưa đồng bộ lần nào</p>
            )}
          </div>
          <button
            onClick={syncFromGoogle}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ backgroundColor: loading ? "#aaa" : success ? "#16a34a" : "#e07b39" }}
          >
            {loading ? (
              <><span className="animate-spin inline-block">⟳</span> Đang lấy...</>
            ) : success ? (
              <>✅ Đã cập nhật!</>
            ) : (
              <>🔄 Đồng bộ ngay</>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            ❌ {error}
            {error.includes("GOOGLE_PLACES_API_KEY") && (
              <div className="mt-2 text-xs text-red-500">
                Thêm <code className="bg-red-100 px-1 rounded font-mono">GOOGLE_PLACES_API_KEY=your_key</code> vào file <code className="bg-red-100 px-1 rounded font-mono">.env.local</code> rồi restart server.
              </div>
            )}
          </div>
        )}

        {data?.googleApiKeyConfigured === false && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            ⚠️ Cần cấu hình <code className="bg-amber-100 px-1 rounded font-mono">GOOGLE_PLACES_API_KEY</code> trong <code className="bg-amber-100 px-1 rounded font-mono">.env.local</code>
          </div>
        )}
      </div>

      {/* Stats */}
      {data && data.rating > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold" style={{ color: "#e07b39" }}>{data.rating.toFixed(1)}</div>
            <div className="text-xs text-gray-500 mt-1">Điểm trung bình</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold" style={{ color: "#1a5276" }}>{data.totalRatings.toLocaleString("vi-VN")}</div>
            <div className="text-xs text-gray-500 mt-1">Tổng đánh giá</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold" style={{ color: "#27ae60" }}>{data.reviews.length}</div>
            <div className="text-xs text-gray-500 mt-1">Đánh giá hiển thị</div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {data?.reviews && data.reviews.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h2 className="font-semibold text-gray-700">Đánh giá đã lưu ({data.reviews.length})</h2>
            <div className="relative w-full sm:ml-auto sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, nội dung..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1a5276] transition-colors"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              )}
            </div>
          </div>
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400 text-sm">
              Không tìm thấy đánh giá phù hợp
            </div>
          ) : filteredReviews.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4">
              {r.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.profilePhoto} alt={r.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-lg">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{r.name}</span>
                  <span className="text-yellow-400 text-xs">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
          Chưa có đánh giá nào. Nhấn &ldquo;Đồng bộ ngay&rdquo; để lấy từ Google Maps.
        </div>
      )}
    </div>
  );
}
