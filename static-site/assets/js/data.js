/* ===================================================================
   Seed data for static site (mirrors data/*.json from the Next.js project)
   Used by storage.js to initialize localStorage on first load.
=================================================================== */

const SETTINGS_SEED = {
  "siteName": "Bún Quậy Như Ý",
  "tagline": "🏝️ Đảo Ngọc Phú Quốc",
  "heroTitle": "Hương Vị Bún Quậy Trứ Danh Phú Quốc",
  "heroHighlight": "Bún Quậy",
  "heroDesc": "Đặc sản nổi tiếng bậc nhất đảo ngọc — tươi ngon, đậm đà, trải nghiệm tự pha nước chấm độc đáo.",
  "phone": "0377 817 852",
  "email": "dacsan.phuquoc@gmail.com",
  "address": "213 Đ. Trần Phú, Khu 7, Phú Quốc, An Giang, Việt Nam",
  "hours": "06:00 – 22:00 hàng ngày",
  "mapEmbed": "https://maps.app.goo.gl/nLeTLiePPoe5PAvC8",
  "facebook": "https://facebook.com",
  "instagram": "https://instagram.com",
  "tiktok": "https://tiktok.com",
  "youtube": "https://youtube.com",
  "promoBanner": "🎉 Khai trương ưu đãi — Giảm 15% cho bàn từ 4 người · Gọi ngay 0377 817 852",
  "stats": [
    { "num": "15+", "label": "Quán ngon" },
    { "num": "4.8★", "label": "Đánh giá" },
    { "num": "145K+", "label": "Lượt xem" }
  ],
  "logoImage": "/uploads/1780645751588-lekzpy.png",
  "introImage": "",
  "footerTagline": "Mang đến hương vị đặc sản đảo ngọc Phú Quốc — tươi ngon, chính thống, đậm đà bản sắc.",
  "zaloWebhookUrl": "",
  "galleryImages": [
    { "src": "/uploads/phu-quoc-bien.jpg", "label": "Biển Phú Quốc xanh ngắt" },
    { "src": "/uploads/hai-san-phu-quoc.jpg", "label": "Hải sản tươi Phú Quốc" },
    { "src": "/uploads/tom-hum-nuong.jpg", "label": "Tôm hùm nướng đặc sản" },
    { "src": "/uploads/ghe-xanh.jpg", "label": "Ghẹ xanh hấp bia" },
    { "src": "/uploads/muc-mot-nang.jpg", "label": "Mực một nắng khô biển" },
    { "src": "/uploads/nha-hang-hai-san.jpg", "label": "Không gian nhà hàng hải sản" },
    { "src": "/uploads/bai-bien-hoang-hon.jpg", "label": "Hoàng hôn bãi biển" },
    { "src": "/uploads/nuoc-mam.jpg", "label": "Nước mắm Phú Quốc truyền thống" }
  ]
};

const MENU_SEED = [
  {
    "id": "1",
    "emoji": "🍜",
    "name": "Bún Quậy – Tô Thường",
    "desc": "Bún quậy hải sản truyền thống: chả tôm, chả cá, mực, cá trích. Sợi bún mềm dai, nước dùng ngọt thanh, tự quậy thưởng thức tại bàn.",
    "price": "35.000đ",
    "tag": "Bán chạy",
    "available": true
  },
  {
    "id": "2",
    "emoji": "🥣",
    "name": "Bún Quậy – Tô Đặc Biệt",
    "desc": "Tô bún quậy đặc biệt: chả tôm, chả cá, mực và cá trích tươi — topping đầy đặn hơn tô thường.",
    "price": "55.000đ",
    "tag": "Đặc biệt",
    "available": true
  },
  {
    "id": "3",
    "emoji": "🦑",
    "name": "Bún Quậy – Tô Thượng Hạng",
    "desc": "Tô cao cấp nhất — mực tươi, chả hải sản đủ loại, phần ăn lớn. Dành cho ai muốn trải nghiệm trọn vẹn hương vị Bún Quậy Như Ý.",
    "price": "70.000đ",
    "tag": "Premium",
    "available": true
  },
  {
    "id": "4",
    "emoji": "🍲",
    "name": "Bún Ram",
    "desc": "Bún sợi mịn ăn kèm ram chiên giòn và nước chấm chua ngọt. Món ăn dân dã đậm chất Phú Quốc.",
    "price": "30.000đ",
    "tag": "Đặc sản",
    "available": true
  },
  {
    "id": "5",
    "emoji": "🥤",
    "name": "Nước Mía",
    "desc": "Nước mía tươi ép nguyên chất, thanh mát giải nhiệt, uống kèm bún quậy rất hợp vị.",
    "price": "10.000đ",
    "tag": "",
    "available": true
  }
];

const FAQS_SEED = [
  {
    "id": "1",
    "q": "Bún quậy Phú Quốc có gì đặc biệt so với bún thường?",
    "a": "Điểm khác biệt nằm ở cách pha nước chấm — thực khách tự tay quậy hỗn hợp bột canh, đường, quất, ớt xay cho đến khi chuyển màu đỏ cam. Nguyên liệu tươi sống đánh bắt trực tiếp từ biển Phú Quốc mỗi ngày cũng tạo nên hương vị riêng không nơi nào có được."
  },
  {
    "id": "2",
    "q": "Quán có cần đặt bàn trước không?",
    "a": "Vào cuối tuần và ngày lễ, chúng tôi khuyến nghị đặt bàn trước để tránh chờ đợi. Bạn có thể đặt qua form trên website hoặc gọi trực tiếp số 0377 817 852."
  },
  {
    "id": "3",
    "q": "Giá một tô bún quậy là bao nhiêu?",
    "a": "Giá dao động từ 45.000đ (tô tôm) đến 75.000đ (tô hải sản tổng hợp). Chúng tôi không thu phí dịch vụ và không có phụ phí ẩn."
  },
  {
    "id": "4",
    "q": "Quán có chỗ đậu xe ô tô không?",
    "a": "Có bãi đậu xe ô tô và xe máy ngay trước quán, hoàn toàn miễn phí cho khách hàng trong giờ ăn."
  },
  {
    "id": "5",
    "q": "Có thể đặt mang về (takeaway) không?",
    "a": "Có, quán nhận đặt mang về. Bạn có thể gọi điện trước 15 phút để đồ ăn sẵn sàng khi bạn đến lấy."
  },
  {
    "id": "6",
    "q": "Quán có phù hợp cho trẻ em không?",
    "a": "Quán phù hợp cho cả gia đình có trẻ em. Riêng người ăn chay, hiện chúng tôi chưa có menu chay — tất cả nguyên liệu đều là hải sản tươi."
  },
  {
    "id": "7",
    "q": "Quán nhận thanh toán bằng thẻ không?",
    "a": "Quán nhận thanh toán tiền mặt và chuyển khoản ngân hàng. Hiện chưa hỗ trợ thanh toán thẻ trực tiếp tại quán."
  },
  {
    "id": "8",
    "q": "Nguyên liệu có tươi sống không?",
    "a": "Tất cả hải sản đều được nhập mỗi sáng sớm từ các tàu đánh bắt địa phương, đảm bảo tươi sống 100% trong ngày."
  }
];

const REVIEWS_SEED = {
  "reviews": [
    {
      "name": "Nguyễn Minh Tuấn",
      "stars": 5,
      "date": "15/06/2025",
      "text": "Lần đầu ăn bún quậy ở Phú Quốc, thật sự bị chinh phục! Nước chấm tự pha rất thú vị, tôm tươi ngọt lịm. Nhất định sẽ quay lại."
    },
    {
      "name": "Trần Thị Lan",
      "stars": 5,
      "date": "02/07/2025",
      "text": "Quán sạch sẽ, phục vụ nhiệt tình. Tô bún quậy ghẹ đậm đà, ghẹ tươi rất ngon. Giá cả hợp lý so với chất lượng."
    },
    {
      "name": "Lê Văn Hùng",
      "stars": 4,
      "date": "20/07/2025",
      "text": "Hương vị rất đặc trưng, khác hẳn bún ở các nơi khác. Cách pha nước chấm lạ miệng nhưng cực kỳ hợp vị. Recommend cho ai đến Phú Quốc!"
    }
  ],
  "rating": 4.8,
  "totalRatings": 1200,
  "lastFetched": null
};

const USERS_SEED = [
  {
    "id": "1",
    "username": "admin",
    "name": "Administrator",
    "password": "admin123",
    "role": "admin",
    "createdAt": "2026-06-06T05:57:46.793Z"
  }
];

/* Posts loaded from data/posts.json - see data-posts.js */
/* Reservations loaded from data/reservations.json - see data-reservations.js */
