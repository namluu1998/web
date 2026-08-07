/* ===================================================================
   i18n.js — bilingual support (Vietnamese / English)
   Usage:
     t("key")           → translated string in current language
     setLanguage("en")  → switch language, persist to localStorage
     initLanguage()     → load saved language and apply translations
   Attribute conventions on HTML elements:
     data-i18n="key"    → sets element.textContent
     data-i18n-ph="key" → sets element.placeholder
=================================================================== */
(function () {
  "use strict";

  var LANGS = {
    vi: {
      /* Navigation */
      nav_about: "Giới thiệu",
      nav_menu: "Menu",
      nav_reviews: "Đánh giá",
      nav_posts: "Bài viết",
      nav_map: "Bản đồ",
      nav_contact: "Liên hệ",
      nav_book: "Đặt bàn",

      /* Hero CTAs */
      hero_explore: "Khám phá ngay",
      hero_map: "📍 Xem bản đồ",

      /* Section eyebrows */
      eyebrow_about: "Đặc sản nổi danh",
      eyebrow_menu: "Thực đơn",
      eyebrow_gallery: "Hình ảnh",
      eyebrow_reviews: "Đánh giá",
      eyebrow_posts: "Khám phá",
      eyebrow_faq: "Giải đáp",
      eyebrow_map: "Địa chỉ",
      eyebrow_contact: "Liên hệ",

      /* Section headings / subtitles */
      section_about: "Bún Quậy Như Ý",
      section_about_sub: "Món ăn gắn liền với văn hóa ẩm thực đảo ngọc từ nhiều thế hệ",
      section_about_btn: "Xem thực đơn →",
      about_origin_title: "Nguồn gốc đặc biệt",
      about_origin_desc: "Dù là đặc sản gắn liền với Phú Quốc, bún quậy thực chất có nguồn gốc từ Bình Định — được biến tấu từ món bún tôm do các ngư dân miền Trung mang vào đảo, dần tạo nên hương vị đặc trưng riêng.",
      about_name_title: "Tên gọi độc đáo",
      about_self_title: "Trải nghiệm tự phục vụ",
      about_self_desc: "Thực khách tự tay pha nước chấm theo khẩu vị riêng dưới sự hướng dẫn của nhân viên quán — tạo nên nét thú vị rất riêng không món nào có được.",
      section_menu: "Các Món Đặc Sắc",
      section_menu_sub: "Tất cả nguyên liệu đều tươi sống, được đánh bắt trực tiếp từ biển Phú Quốc mỗi ngày",
      section_gallery: "Góc Ảnh Quán",
      section_gallery_sub: "Không gian ấm cúng, món ăn tươi ngon mỗi ngày",
      gallery_more: "Xem thêm ảnh →",
      gallery_fallback: "📸 Ảnh thực tế sẽ được cập nhật sớm",
      section_reviews: "Khách Hàng Nói Gì?",
      section_posts: "Bài Viết Đặc Sản",
      section_posts_sub: "Cập nhật thông tin mới nhất về ẩm thực Phú Quốc",
      section_faq: "Câu Hỏi Thường Gặp",
      section_map_h: "Tìm Chúng Tôi",
      info_address_label: "Địa chỉ",
      info_hours_label: "Giờ mở cửa",
      info_hotline_label: "Hotline",
      map_open_btn: "📍 Mở trong Google Maps",
      section_contact: "Đặt Bàn & Hỏi Thêm",

      /* Reservation form */
      form_name: "Họ tên *",
      form_phone: "Điện thoại *",
      form_email: "Email",
      form_guests: "Số khách *",
      form_date: "Ngày *",
      form_time: "Giờ *",
      form_message: "Tin nhắn",
      form_name_ph: "Nguyễn Văn A",
      form_phone_ph: "0901 234 567",
      form_message_ph: "Bạn muốn hỏi thêm điều gì?",
      form_submit: "Gửi yêu cầu đặt bàn 🍜",
      success_title: "Cảm ơn bạn!",
      success_desc: "Chúng tôi sẽ phản hồi trong 24 giờ.",
      confirm_code_label: "Mã đặt bàn của bạn",
      confirm_cta_hint: "Để giữ chỗ chắc chắn, vui lòng xác nhận nhanh với quán:",
      confirm_zalo: "💬 Chat Zalo xác nhận",
      confirm_call: "📞 Gọi ngay",
      confirm_summary: "{guests} khách · {date} lúc {time}",

      /* Menu modal */
      modal_price_label: "Giá món",
      modal_other: "Xem món khác",
      modal_order: "Đặt món này →",

      /* Footer */
      footer_social_title: "Theo dõi chúng tôi",
      footer_social_sub: "Cập nhật món mới, ưu đãi hàng tuần",
      footer_nav_h: "Điều hướng",
      footer_contact_h: "Liên hệ",
      footer_hotline: "Hotline đặt bàn",
      footer_contact_now: "Liên hệ ngay",
      footer_rights: ". Bảo lưu mọi quyền.",

      /* Mobile CTA */
      cta_call: "📞 Gọi ngay",
      cta_book: "🍜 Đặt bàn ngay",

      /* Open status */
      open_now: "Đang mở cửa",
      closed_now: "Đã đóng cửa",

      /* Validation errors */
      err_name: "⚠️ Vui lòng nhập họ tên.",
      err_phone: "⚠️ Vui lòng nhập số điện thoại.",
      err_phone_invalid: "⚠️ Số điện thoại không hợp lệ.",
      err_email: "⚠️ Địa chỉ email không hợp lệ.",
      err_guests: "⚠️ Vui lòng nhập số khách.",
      err_guests_range: "⚠️ Số khách phải từ 1 đến 50 người.",
      err_date: "⚠️ Vui lòng chọn ngày đặt bàn.",
      err_date_past: "⚠️ Ngày đặt bàn không được là ngày trong quá khứ.",
      err_time: "⚠️ Vui lòng chọn giờ đặt bàn.",
      err_time_range: "⚠️ Giờ đặt bàn phải trong khung 06:00 – 22:00.",

      /* Language toggle label */
      lang_toggle: "EN",

      /* Blog post detail */
      post_views: "lượt xem",
      post_share: "Chia sẻ bài viết",
      post_copy: "Sao chép link",
      post_copied: "Đã sao chép!",
      post_cta_title: "Đặt bàn ngay hôm nay",
      post_cta_desc: "Giữ chỗ trước để thưởng thức đặc sản Phú Quốc tươi ngon.",
      post_cta_btn: "Đặt bàn ngay →",
      post_sidebar_title: "Bài đọc nhiều",
      post_not_found_title: "Không tìm thấy bài viết",
      post_not_found_desc: "Bài viết bạn tìm không tồn tại hoặc đã bị gỡ.",
      post_back: "← Quay lại danh sách bài viết",

      /* Breadcrumb */
      breadcrumb_home: "Trang chủ",
      breadcrumb_posts: "Bài viết",

      /* 404 page */
      e404_title: "Không tìm thấy trang bạn yêu cầu",
      e404_desc: "Trang này có thể đã bị xóa, đổi tên, hoặc chưa từng tồn tại. Hãy quay lại trang chủ để tiếp tục khám phá.",
      e404_back: "⬅ Về trang chủ",

      /* Post list pagination */
      posts_read_more: "Đọc thêm →",
      posts_prev: "← Trước",
      posts_next: "Sau →",
    },

    en: {
      /* Navigation */
      nav_about: "About",
      nav_menu: "Menu",
      nav_reviews: "Reviews",
      nav_posts: "Blog",
      nav_map: "Location",
      nav_contact: "Contact",
      nav_book: "Book Now",

      /* Hero CTAs */
      hero_explore: "Explore Now",
      hero_map: "📍 View Map",

      /* Section eyebrows */
      eyebrow_about: "Our Specialty",
      eyebrow_menu: "Menu",
      eyebrow_gallery: "Photos",
      eyebrow_reviews: "Reviews",
      eyebrow_posts: "Explore",
      eyebrow_faq: "FAQ",
      eyebrow_map: "Location",
      eyebrow_contact: "Contact",

      /* Section headings / subtitles */
      section_about: "Phu Quoc Bun Quay",
      section_about_sub: "A dish woven into the culinary culture of the Pearl Island for generations",
      section_about_btn: "View Menu →",
      about_origin_title: "Special Origin",
      about_origin_desc: "Although associated with Phu Quoc, bun quay actually originates from Binh Dinh — brought by Central Vietnamese fishermen and transformed into a unique local specialty.",
      about_name_title: "A Unique Name",
      about_self_title: "DIY Experience",
      about_self_desc: "Guests mix their own dipping sauce guided by staff — a fun and unique experience unlike any other dish.",
      section_menu: "Signature Dishes",
      section_menu_sub: "All ingredients are fresh, caught directly from Phu Quoc sea every day",
      section_gallery: "Photo Gallery",
      section_gallery_sub: "Cozy atmosphere, fresh food every day",
      gallery_more: "View more photos →",
      gallery_fallback: "📸 Actual photos coming soon",
      section_reviews: "What Guests Say?",
      section_posts: "Specialty Articles",
      section_posts_sub: "Latest updates on Phu Quoc cuisine",
      section_faq: "Frequently Asked Questions",
      section_map_h: "Find Us",
      info_address_label: "Address",
      info_hours_label: "Opening Hours",
      info_hotline_label: "Hotline",
      map_open_btn: "📍 Open in Google Maps",
      section_contact: "Book a Table & Ask",

      /* Reservation form */
      form_name: "Full Name *",
      form_phone: "Phone *",
      form_email: "Email",
      form_guests: "Guests *",
      form_date: "Date *",
      form_time: "Time *",
      form_message: "Message",
      form_name_ph: "Your full name",
      form_phone_ph: "Your phone number",
      form_message_ph: "Any questions or special requests?",
      form_submit: "Send Reservation Request 🍜",
      success_title: "Thank you!",
      success_desc: "We will respond within 24 hours.",
      confirm_code_label: "Your booking code",
      confirm_cta_hint: "To secure your table, please confirm quickly with us:",
      confirm_zalo: "💬 Confirm via Zalo",
      confirm_call: "📞 Call Now",
      confirm_summary: "{guests} guests · {date} at {time}",

      /* Menu modal */
      modal_price_label: "Price",
      modal_other: "View other dishes",
      modal_order: "Order this →",

      /* Footer */
      footer_social_title: "Follow Us",
      footer_social_sub: "Updates on new dishes and weekly deals",
      footer_nav_h: "Navigation",
      footer_contact_h: "Contact",
      footer_hotline: "Reservation Hotline",
      footer_contact_now: "Contact Now",
      footer_rights: ". All rights reserved.",

      /* Mobile CTA */
      cta_call: "📞 Call Now",
      cta_book: "🍜 Book Now",

      /* Open status */
      open_now: "Open Now",
      closed_now: "Closed",

      /* Validation errors */
      err_name: "⚠️ Please enter your full name.",
      err_phone: "⚠️ Please enter your phone number.",
      err_phone_invalid: "⚠️ Invalid phone number.",
      err_email: "⚠️ Invalid email address.",
      err_guests: "⚠️ Please enter the number of guests.",
      err_guests_range: "⚠️ Number of guests must be between 1 and 50.",
      err_date: "⚠️ Please select a reservation date.",
      err_date_past: "⚠️ Reservation date cannot be in the past.",
      err_time: "⚠️ Please select a reservation time.",
      err_time_range: "⚠️ Reservation time must be between 06:00 and 22:00.",

      /* Language toggle label */
      lang_toggle: "VI",

      /* Blog post detail */
      post_views: "views",
      post_share: "Share this post",
      post_copy: "Copy link",
      post_copied: "Copied!",
      post_cta_title: "Book a Table Today",
      post_cta_desc: "Reserve your spot to enjoy fresh Phu Quoc specialties.",
      post_cta_btn: "Book Now →",
      post_sidebar_title: "Most Read",
      post_not_found_title: "Post Not Found",
      post_not_found_desc: "The post you're looking for doesn't exist or has been removed.",
      post_back: "← Back to post list",

      /* Breadcrumb */
      breadcrumb_home: "Home",
      breadcrumb_posts: "Blog",

      /* 404 page */
      e404_title: "Page Not Found",
      e404_desc: "This page may have been deleted, renamed, or never existed. Return to the homepage to continue exploring.",
      e404_back: "⬅ Back to Home",

      /* Post list pagination */
      posts_read_more: "Read more →",
      posts_prev: "← Prev",
      posts_next: "Next →",
    },
  };

  var _lang = localStorage.getItem("dsp_lang") || "vi";

  function t(key) {
    var dict = LANGS[_lang] || LANGS["vi"];
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    if (_lang !== "vi" && Object.prototype.hasOwnProperty.call(LANGS["vi"], key)) return LANGS["vi"][key];
    return key;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-ph"));
    });
    var toggle = document.getElementById("lang-toggle");
    if (toggle) toggle.textContent = t("lang_toggle");
    document.documentElement.lang = _lang === "en" ? "en" : "vi";
  }

  function setLanguage(lang) {
    _lang = lang;
    localStorage.setItem("dsp_lang", lang);
    applyI18n();
  }

  function initLanguage() {
    _lang = localStorage.getItem("dsp_lang") || "vi";
    applyI18n();
  }

  window.t = t;
  window.setLanguage = setLanguage;
  window.initLanguage = initLanguage;
  window._getLang = function () { return _lang; };
})();
