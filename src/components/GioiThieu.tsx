import Image from "next/image";
import type { SiteSettings } from "@/lib/data";

export default function GioiThieu({ settings }: { settings?: Pick<SiteSettings, "introImage"> }) {
  return (
    <section id="gioi-thieu" className="py-10 md:py-14 px-4" style={{ background: "#fffbf5" }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Đặc sản nổi danh
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Bún Quậy Phú Quốc
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
          Món ăn gắn liền với văn hóa ẩm thực đảo ngọc từ nhiều thế hệ
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl h-80 md:h-96 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f4a26110, #e07b3920), #fde8d0" }}>
            {settings?.introImage ? (
              <Image src={settings.introImage} alt="Giới thiệu" fill className="object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-8xl mb-4">🍜</div>
                <p className="text-sm text-gray-400 font-medium">Bún Quậy Phú Quốc</p>
              </div>
            )}
            {/* Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white z-10"
              style={{ backgroundColor: "#e07b39" }}>
              📅 28/07/2025
            </div>
          </div>

          {/* Content */}
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🌊</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: "#1a5276" }}>Nguồn gốc đặc biệt</h3>
                <p className="text-gray-600 leading-relaxed">
                  Dù là đặc sản gắn liền với Phú Quốc, bún quậy thực chất có nguồn gốc từ Bình Định — được biến tấu
                  từ món bún tôm do các ngư dân miền Trung mang vào đảo, dần tạo nên hương vị đặc trưng riêng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">🥣</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: "#1a5276" }}>Tên gọi độc đáo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tên &ldquo;bún quậy&rdquo; bắt nguồn từ công đoạn pha nước chấm gồm bột canh, đường, quất, ớt xay
                  rồi <strong>quậy thật mạnh</strong> đến khi hỗn hợp hòa quyện, chuyển sang màu đỏ cam hấp dẫn.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl mt-1">✋</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: "#1a5276" }}>Trải nghiệm tự phục vụ</h3>
                <p className="text-gray-600 leading-relaxed">
                  Thực khách tự tay pha nước chấm theo khẩu vị riêng dưới sự hướng dẫn của nhân viên quán —
                  tạo nên nét thú vị rất riêng không món nào có được.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a href="#menu"
                className="inline-block px-6 py-3 rounded-full font-semibold text-white"
                style={{ backgroundColor: "#e07b39" }}>
                Xem thực đơn →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


