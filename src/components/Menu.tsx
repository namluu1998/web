import { db } from "@/lib/data";
import MenuItems from "@/components/MenuItems";

export default function Menu() {
  const items = db.menu.getAvailable();

  return (
    <section id="menu" className="py-10 md:py-14 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Thực đơn
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Các Món Đặc Sắc
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Tất cả nguyên liệu đều tươi sống, được đánh bắt trực tiếp từ biển Phú Quốc mỗi ngày
        </p>

        <MenuItems items={items} />
      </div>
    </section>
  );
}
