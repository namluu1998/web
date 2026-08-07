import { db } from "@/lib/data";
import BaiVietClient from "@/components/BaiVietClient";

export default function BaiViet() {
  const articles = db.posts.getPublished();

  return (
    <section id="bai-viet" className="py-10 md:py-14 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Khám phá
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Bài Viết Đặc Sản
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Cập nhật thông tin mới nhất về ẩm thực Phú Quốc
        </p>

        <BaiVietClient articles={articles} />
      </div>
    </section>
  );
}
