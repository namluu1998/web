import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "404 — Không tìm thấy trang | Đặc Sản Phú Quốc" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "linear-gradient(135deg, #fff8f3, #fff)" }}>
      <div className="text-7xl mb-6">🦐</div>
      <h1 className="text-6xl font-black mb-3" style={{ color: "#e07b39" }}>404</h1>
      <h2 className="text-2xl font-bold mb-2" style={{ color: "#1a5276" }}>
        Trang không tìm thấy
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
        Hãy quay về trang chủ để khám phá đặc sản Phú Quốc nhé!
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/"
          className="px-8 py-3 rounded-full font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#e07b39" }}>
          ← Về trang chủ
        </Link>
        <Link href="/#lien-he"
          className="px-8 py-3 rounded-full font-semibold border transition-all hover:bg-gray-50"
          style={{ color: "#1a5276", borderColor: "#1a5276" }}>
          Đặt bàn ngay
        </Link>
      </div>
    </main>
  );
}
