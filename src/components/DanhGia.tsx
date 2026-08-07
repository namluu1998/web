import fs from "fs";
import path from "path";
import ReviewsCarousel from "./ReviewsCarousel";

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
};

const FALLBACK_REVIEWS: Review[] = [
  {
    name: "Nguyễn Minh Tuấn",
    stars: 5,
    date: "15/06/2025",
    text: "Lần đầu ăn bún quậy ở Phú Quốc, thật sự bị chinh phục! Nước chấm tự pha rất thú vị, tôm tươi ngọt lịm. Nhất định sẽ quay lại.",
  },
  {
    name: "Trần Thị Lan",
    stars: 5,
    date: "02/07/2025",
    text: "Quán sạch sẽ, phục vụ nhiệt tình. Tô bún quậy ghẹ đậm đà, ghẹ tươi rất ngon. Giá cả hợp lý so với chất lượng.",
  },
  {
    name: "Lê Văn Hùng",
    stars: 4,
    date: "20/07/2025",
    text: "Hương vị rất đặc trưng, khác hẳn bún ở các nơi khác. Cách pha nước chấm lạ miệng nhưng cực kỳ hợp vị. Recommend cho ai đến Phú Quốc!",
  },
];

function loadReviewsData(): ReviewsData {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "reviews.json"), "utf8");
    const data = JSON.parse(raw) as ReviewsData;
    if (data.reviews?.length > 0) return data;
  } catch {
    // fall through to fallback
  }
  return { reviews: FALLBACK_REVIEWS, rating: 4.8, totalRatings: 1200, lastFetched: null };
}

export default function DanhGia() {
  const { reviews, rating, totalRatings } = loadReviewsData();
  const displayRating = rating > 0 ? rating.toFixed(1) : "4.8";
  const displayTotal = totalRatings > 0 ? totalRatings.toLocaleString("vi-VN") : "1.200";

  return (
    <section id="danh-gia" className="py-10 md:py-14 px-4" style={{ background: "#fffbf5" }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#e07b39" }}>
          Đánh giá
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3" style={{ color: "#1a5276" }}>
          Khách Hàng Nói Gì?
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Hơn {displayTotal} đánh giá từ thực khách ghé thăm
        </p>

        {/* Overall rating */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl shadow-md px-10 py-6 text-center">
            <div className="text-5xl font-bold mb-1" style={{ color: "#e07b39" }}>{displayRating}</div>
            <div className="text-yellow-400 text-2xl mb-1">★★★★★</div>
            <div className="text-sm text-gray-500">Dựa trên {displayTotal}+ đánh giá</div>
          </div>
        </div>

        <ReviewsCarousel reviews={reviews} />
      </div>
    </section>
  );
}
