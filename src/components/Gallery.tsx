import { db } from "@/lib/data";
import { isImageValue } from "@/lib/imageHelper";

const fallbackPhotos = [
  { emoji: "🍜", label: "Bún quậy tôm tươi", color: "#fde8d0" },
  { emoji: "🦀", label: "Bún quậy ghẹ biển", color: "#fce4ec" },
  { emoji: "🦑", label: "Bún quậy mực", color: "#e8f5e9" },
  { emoji: "🍤", label: "Bún quậy hải sản", color: "#fff9c4" },
  { emoji: "🌿", label: "Rau sống tươi", color: "#f1f8e9" },
  { emoji: "🫙", label: "Nước mắm Phú Quốc", color: "#fff3e0" },
];

type GalleryItem =
  | { type: "image"; image: string; label: string }
  | { type: "fallback"; emoji: string; label: string; color: string };

export default function Gallery() {
  const settings = db.settings.get();
  const realImages = (settings.galleryImages ?? []).filter(isImageValue);
  const items: GalleryItem[] = realImages.length > 0
    ? realImages.map((image, index) => ({
        type: "image",
        image,
        label: `Ảnh quán ${index + 1}`,
      }))
    : fallbackPhotos.map((p) => ({ type: "fallback", ...p }));

  return (
    <section id="gallery" className="py-10 md:py-14 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Hình ảnh
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: "#1a5276" }}>
          Góc Ảnh Quán
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Không gian ấm cúng, món ăn tươi ngon mỗi ngày
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-xl overflow-hidden group transition-all duration-200 hover:scale-105 hover:shadow-lg aspect-square"
              style={item.type === "fallback" ? { background: item.color } : undefined}
            >
              {item.type === "image" ? (
                <div className="relative h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.label} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-2 text-center text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {item.label}
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl md:text-5xl">{item.emoji}</span>
                  <span className="text-xs font-medium text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-center px-1">
                    {item.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {realImages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            📸 Ảnh thực tế sẽ được cập nhật sớm
          </p>
        )}
      </div>
    </section>
  );
}
