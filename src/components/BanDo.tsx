"use client";
import { useEffect, useRef, useState } from "react";
import OpenStatus from "@/components/OpenStatus";

const MAP_SHARE_LINK = "https://maps.app.goo.gl/nLeTLiePPoe5PAvC8";
const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d18676.737343723173!2d103.9494640441595!3d10.237340784306836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a78b0011d64027%3A0xcc14425326244ec8!2zQsO6biBRdeG6rXkgTmjGsCDDnQ!5e0!3m2!1svi!2s!4v1780558729335!5m2!1svi!2s";

export default function BanDo() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setMapLoaded(true); },
      { rootMargin: "200px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="ban-do" className="py-10 md:py-14 px-4" style={{ background: "#fffbf5" }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Địa chỉ
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Tìm Chúng Tôi
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Dễ dàng tìm đến quán với Google Maps
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="text-2xl mb-2">📍</div>
              <h3 className="font-bold mb-1" style={{ color: "#1a5276" }}>Địa chỉ</h3>
              <p className="text-sm text-gray-600">Đ. Trần Phú, Xóm Chài D. Đông,<br />Khu Phố 9, Phú Quốc, An Giang</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="text-2xl mb-2">🕐</div>
              <h3 className="font-bold mb-1" style={{ color: "#1a5276" }}>Giờ mở cửa</h3>
              <p className="text-sm text-gray-600 mb-2">Thứ 2 – Chủ nhật · 06:00 – 22:00</p>
              <OpenStatus />
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="text-2xl mb-2">📞</div>
              <h3 className="font-bold mb-1" style={{ color: "#1a5276" }}>Liên hệ</h3>
              <p className="text-sm text-gray-600">0297 123 4567<br />dacsan.phuquoc@gmail.com</p>
            </div>
            <a
              href={MAP_SHARE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#e07b39" }}
            >
              <span>📍</span> Mở trong Google Maps
            </a>
          </div>

          <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-lg bg-gray-100" style={{ minHeight: "420px" }}>
            {mapLoaded ? (
              <iframe
                src={MAP_EMBED_SRC}
                width="100%"
                height="420"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bản đồ Bún Quậy Như Ý, Phú Quốc"
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[420px] text-gray-400 text-sm">
                🗺️ Đang tải bản đồ...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


