import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--background)" }}>
      <div className="text-7xl mb-6">🔍</div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "#1a5276" }}>
        Bài viết không tìm thấy
      </h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Bài viết này có thể đã bị xóa hoặc chưa được đăng. Xem tất cả bài viết bên dưới.
      </p>
      <Link href="/#bai-viet"
        className="px-7 py-3 rounded-full font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#e07b39" }}>
        ← Xem tất cả bài viết
      </Link>
    </div>
  );
}
