/* ===================================================================
   common.js — shared UI wiring used by every page
   (navbar, footer, promo banner, floating buttons, mobile CTA,
   scroll progress, open status, escapeHtml)
=================================================================== */

/* ── Google Analytics (GA4) mặc định ───────────────────────────────
   Mã GA4 dự phòng khi Cài đặt → Code Scripts chưa có snippet Google
   Analytics nào. Để nguyên placeholder thì GA sẽ KHÔNG chạy (an toàn).
   Bỏ qua trang /admin/ để không đo hoạt động quản trị.
   Hàm này được initCommonUI() gọi sau khi đã đọc được settings, nên
   không chạy trùng với snippet admin tự dán. */
var GA_ID = "G-YV1EPT03E5"; // <-- DÁN MÃ GA4 CỦA BẠN VÀO ĐÂY

function initGoogleAnalytics() {
  if (!GA_ID || GA_ID === "G-XXXXXXXXXX" || GA_ID.indexOf("G-") !== 0) return;
  if (isAdminArea()) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
}

/* ── Code Scripts (Cài đặt → 🧩 Code Scripts) ──────────────────────
   Các đoạn Javascript/CSS admin dán trong trang quản trị được chèn
   vào <head> của mọi trang công khai. Khu /admin/ luôn được bỏ qua để
   pixel/livechat không chạy trên trang quản trị. */
const CODE_SCRIPT_FIELDS = [
  { key: "scriptGoogleAnalytics",  label: "google-analytics" },
  { key: "scriptGoogleRemarketing", label: "google-remarketing" },
  { key: "scriptFacebookPixel",    label: "facebook-pixel" },
  { key: "scriptLivechat",         label: "livechat" },
];

let _codeScriptsInjected = false;

function isAdminArea() {
  const path = location.pathname;
  return path.indexOf("/admin/") !== -1 || path === "/admin" || /\/admin$/.test(path);
}

function injectCodeScripts(settings) {
  if (_codeScriptsInjected || isAdminArea()) return;
  _codeScriptsInjected = true;

  CODE_SCRIPT_FIELDS.forEach(function (field) {
    const markup = String((settings && settings[field.key]) || "").trim();
    if (markup) appendMarkupToHead(markup, field.label);
  });
}

/* Gán markup qua innerHTML sẽ KHÔNG chạy <script>; phải tạo lại từng
   thẻ script rồi mới append thì trình duyệt mới thực thi. */
function appendMarkupToHead(markup, label) {
  const holder = document.createElement("div");
  holder.innerHTML = markup;

  Array.prototype.slice.call(holder.childNodes).forEach(function (node) {
    if (node.nodeType !== 1) return; // bỏ text/comment thừa giữa các thẻ
    let el = node;
    if (node.tagName === "SCRIPT") {
      el = document.createElement("script");
      for (let i = 0; i < node.attributes.length; i++) {
        el.setAttribute(node.attributes[i].name, node.attributes[i].value);
      }
      el.text = node.textContent;
    }
    el.setAttribute("data-code-script", label);
    document.head.appendChild(el);
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------------------------------------------------------------
   Gallery ("Góc Ảnh Quán") — shared between homepage and the full
   gallery page (thu-vien-anh.html)
--------------------------------------------------------------- */
const FALLBACK_PHOTOS = [
  { emoji: "🍜", label: "Bún quậy tôm tươi", color: "#fde8d0" },
  { emoji: "🦀", label: "Bún quậy ghẹ biển", color: "#fce4ec" },
  { emoji: "🦑", label: "Bún quậy mực", color: "#e8f5e9" },
  { emoji: "🍤", label: "Bún quậy hải sản", color: "#fff9c4" },
  { emoji: "🌿", label: "Rau sống tươi", color: "#f1f8e9" },
  { emoji: "🫙", label: "Nước mắm Phú Quốc", color: "#fff3e0" },
];

const GALLERY_ITEM_CLASS = "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.5625rem)] lg:w-[calc(16.6667%-0.625rem)]";

function getGalleryItems(settings) {
  const realImages = (settings.galleryImages || [])
    .map((item) => (typeof item === "string" ? { src: item, label: "" } : item))
    .filter((item) => isImageValue(item.src) || isVideoValue(item.src));

  const isFallback = realImages.length === 0;
  return { items: isFallback ? FALLBACK_PHOTOS : realImages, isFallback };
}

function galleryCardHtml(item, isFallback, index) {
  if (isFallback) {
    return `
      <div class="rounded-xl overflow-hidden group transition-all duration-200 hover:scale-105 hover:shadow-lg aspect-square ${GALLERY_ITEM_CLASS}" style="background:${item.color};">
        <div class="h-full w-full flex flex-col items-center justify-center gap-2">
          <span class="text-4xl md:text-5xl">${item.emoji}</span>
          <span class="text-xs font-medium text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-center px-1">${escapeHtml(item.label)}</span>
        </div>
      </div>`;
  }
  const label = item.label || `Ảnh quán ${index + 1}`;
  const isVideo = isVideoValue(item.src);
  const visual = isVideo
    ? `<video src="${escapeHtml(item.src)}" class="h-full w-full object-cover" muted preload="metadata" playsinline></video>
       <div class="absolute inset-0 flex items-center justify-center">
         <span class="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white text-base">▶</span>
       </div>`
    : `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(label)}" class="h-full w-full object-cover" />`;

  return `
    <div class="rounded-xl overflow-hidden group transition-all duration-200 hover:scale-105 hover:shadow-lg aspect-square cursor-pointer ${GALLERY_ITEM_CLASS}" data-gallery-index="${index}" role="button" tabindex="0" aria-label="Xem ${isVideo ? "video" : "ảnh"} lớn: ${escapeHtml(label)}">
      <div class="relative h-full w-full">
        ${visual}
        <div class="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-2 text-center text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">${escapeHtml(label)}</div>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------
   Gallery lightbox — full-size photo viewer shared by the homepage
   preview and the full gallery page (thu-vien-anh.html)
--------------------------------------------------------------- */
let lightboxItems = [];
let lightboxIndex = 0;

function attachGalleryLightbox(grid, items, isFallback) {
  if (isFallback) return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-gallery-index]");
    if (!card) return;
    openGalleryLightbox(items, Number(card.dataset.galleryIndex));
  });

  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest("[data-gallery-index]");
    if (!card) return;
    e.preventDefault();
    openGalleryLightbox(items, Number(card.dataset.galleryIndex));
  });
}

function ensureGalleryLightboxEl() {
  let el = document.getElementById("gallery-lightbox");
  if (el) return el;

  el = document.createElement("div");
  el.id = "gallery-lightbox";
  el.className = "fixed inset-0 z-[999] flex items-center justify-center p-4 hidden";
  el.style.backgroundColor = "rgba(15,23,42,0.85)";
  el.innerHTML = `
    <button type="button" id="lightbox-close" class="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-gray-700 shadow-sm hover:bg-white" aria-label="Đóng">×</button>
    <button type="button" id="lightbox-prev" class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-2xl leading-none text-gray-700 shadow-sm hover:bg-white" aria-label="Ảnh trước">‹</button>
    <button type="button" id="lightbox-next" class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-2xl leading-none text-gray-700 shadow-sm hover:bg-white" aria-label="Ảnh sau">›</button>
    <figure class="max-h-full max-w-full flex flex-col items-center">
      <img id="lightbox-img" src="" alt="" class="min-w-[70vw] max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
      <video id="lightbox-video" class="min-w-[70vw] max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl hidden" controls playsinline></video>
      <figcaption id="lightbox-caption" class="mt-3 text-center text-sm font-medium text-white/90"></figcaption>
    </figure>
  `;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    if (e.target === el) closeGalleryLightbox();
  });
  el.querySelector("#lightbox-close").addEventListener("click", closeGalleryLightbox);
  el.querySelector("#lightbox-prev").addEventListener("click", () => stepGalleryLightbox(-1));
  el.querySelector("#lightbox-next").addEventListener("click", () => stepGalleryLightbox(1));

  document.addEventListener("keydown", (e) => {
    if (el.classList.contains("hidden")) return;
    if (e.key === "Escape") closeGalleryLightbox();
    if (e.key === "ArrowLeft") stepGalleryLightbox(-1);
    if (e.key === "ArrowRight") stepGalleryLightbox(1);
  });

  return el;
}

function openGalleryLightbox(items, index) {
  lightboxItems = items;
  lightboxIndex = index;
  ensureGalleryLightboxEl().classList.remove("hidden");
  renderGalleryLightboxFrame();
  document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
  const el = document.getElementById("gallery-lightbox");
  if (!el) return;
  el.classList.add("hidden");
  document.body.style.overflow = "";
  const videoEl = document.getElementById("lightbox-video");
  if (videoEl) videoEl.pause();
}

function stepGalleryLightbox(delta) {
  if (!lightboxItems.length) return;
  lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  renderGalleryLightboxFrame();
}

function renderGalleryLightboxFrame() {
  const item = lightboxItems[lightboxIndex];
  if (!item) return;
  const label = item.label || "";
  const imgEl = document.getElementById("lightbox-img");
  const videoEl = document.getElementById("lightbox-video");

  if (isVideoValue(item.src)) {
    videoEl.src = item.src;
    videoEl.classList.remove("hidden");
    imgEl.classList.add("hidden");
    imgEl.removeAttribute("src");
  } else {
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
    videoEl.classList.add("hidden");
    imgEl.src = item.src;
    imgEl.alt = label;
    imgEl.classList.remove("hidden");
  }

  const caption = document.getElementById("lightbox-caption");
  caption.textContent = label;
  caption.style.display = label ? "block" : "none";

  const multi = lightboxItems.length > 1;
  document.getElementById("lightbox-prev").style.display = multi ? "flex" : "none";
  document.getElementById("lightbox-next").style.display = multi ? "flex" : "none";
}

function initCommonUI(settings) {
  const s = settings || db.settings.get();
  const telPhone = (s.phone || "").replace(/\s+/g, "");

  /* Code Scripts của admin chạy trước phần còn lại để pixel/analytics
     ghi nhận lượt xem sớm nhất có thể. Nếu admin đã dán snippet GA
     riêng thì bỏ qua mã GA mặc định để không đếm trùng lượt xem. */
  injectCodeScripts(s);
  if (!String(s.scriptGoogleAnalytics || "").trim()) initGoogleAnalytics();

  /* Navbar */
  const navName = document.getElementById("nav-site-name");
  if (navName) navName.textContent = s.siteName;
  const navLogoImg = document.getElementById("nav-logo-img");
  const navLogoEmoji = document.getElementById("nav-logo-emoji");
  if (navLogoImg) {
    if (s.logoImage) {
      navLogoImg.src = s.logoImage;
    } else {
      navLogoImg.style.display = "none";
      if (navLogoEmoji) navLogoEmoji.style.display = "inline";
    }
  }

  const toggle = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    const setMenuOpen = (open) => {
      menu.classList.toggle("open", open);
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.classList.toggle("mobile-menu-open", open);
    };
    toggle.addEventListener("click", () => setMenuOpen(!menu.classList.contains("open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenuOpen(false)));
    const closeBtn = document.getElementById("mobile-menu-close");
    if (closeBtn) closeBtn.addEventListener("click", () => setMenuOpen(false));
    const backdrop = menu.querySelector(".mobile-menu-backdrop");
    if (backdrop) backdrop.addEventListener("click", () => setMenuOpen(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });
  }

  /* Language toggle button — injected before the hamburger so it appears on all pages */
  if (toggle && !document.getElementById("lang-toggle")) {
    const langBtn = document.createElement("button");
    langBtn.id = "lang-toggle";
    langBtn.type = "button";
    langBtn.className = "px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors";
    langBtn.style.cssText = "letter-spacing:0.05em;margin-right:0.25rem;";
    langBtn.textContent = (localStorage.getItem("dsp_lang") || "vi") === "vi" ? "EN" : "VI";
    langBtn.addEventListener("click", function () {
      const curr = window._getLang ? window._getLang() : (localStorage.getItem("dsp_lang") || "vi");
      if (window.setLanguage) window.setLanguage(curr === "vi" ? "en" : "vi");
    });
    toggle.parentNode.insertBefore(langBtn, toggle);
  }
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
  }

  /* Scroll progress */
  const bar = document.getElementById("scroll-progress");
  if (bar) {
    window.addEventListener("scroll", () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      bar.style.width = `${total > 0 ? (scrolled / total) * 100 : 0}%`;
    }, { passive: true });
  }

  /* Promo banner */
  const banner = document.getElementById("promo-banner");
  if (banner) {
    const textEl = document.getElementById("promo-banner-text");
    const text = s.promoBanner || "";
    if (!text) {
      banner.style.display = "none";
    } else {
      if (s.phone && text.includes(s.phone)) {
        const parts = text.split(s.phone);
        textEl.innerHTML = `${escapeHtml(parts[0])}<a href="tel:${telPhone}" class="underline font-bold">${escapeHtml(s.phone)}</a>${escapeHtml(parts.slice(1).join(s.phone))}`;
      } else {
        textEl.textContent = text;
      }
      const closeBtn = document.getElementById("promo-banner-close");
      if (closeBtn) closeBtn.addEventListener("click", () => { banner.style.display = "none"; });
    }
  }

  /* Footer */
  const footerLogoImg = document.getElementById("footer-logo-img");
  const footerLogoEmoji = document.getElementById("footer-logo-emoji");
  if (footerLogoImg) {
    if (s.logoImage) {
      footerLogoImg.src = s.logoImage;
    } else {
      footerLogoImg.style.display = "none";
      if (footerLogoEmoji) footerLogoEmoji.style.display = "inline";
    }
  }
  setText("footer-site-name", s.siteName);
  setText("footer-copy-name", s.siteName);
  setText("footer-tagline", s.footerTagline || "Mang đến hương vị đặc sản đảo ngọc Phú Quốc, tươi ngon, chính thống, đậm đà bản sắc.");
  setText("footer-address", s.address);
  const footerEmail = document.getElementById("footer-email");
  if (footerEmail) {
    footerEmail.textContent = s.email;
    footerEmail.href = `mailto:${s.email}`;
  }
  setText("footer-hours", s.hours);
  setText("footer-phone-text", s.phone);
  const footerPhoneLink = document.getElementById("footer-phone-link");
  if (footerPhoneLink) footerPhoneLink.href = `tel:${telPhone}`;
  const footerContactNow = document.getElementById("footer-contact-now");
  if (footerContactNow) footerContactNow.href = `tel:${telPhone}`;

  setHref("social-facebook", s.facebook);
  setHref("social-instagram", s.instagram);
  setHref("social-tiktok", s.tiktok);
  setHref("social-youtube", s.youtube);

  /* Floating buttons */
  const fbPhone = document.getElementById("fb-phone");
  const fbZalo = document.getElementById("fb-zalo");
  if (fbPhone) fbPhone.href = `tel:${telPhone}`;
  if (fbZalo) fbZalo.href = `https://zalo.me/${telPhone}`;
  const topBtn = document.getElementById("fb-top");
  if (topBtn) {
    topBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", () => {
      topBtn.style.display = window.scrollY > 400 ? "flex" : "none";
    }, { passive: true });
  }

  /* Mobile CTA */
  const mobileCtaCall = document.getElementById("mobile-cta-call");
  const mobileCta = document.getElementById("mobile-cta");
  if (mobileCtaCall && mobileCta) {
    mobileCtaCall.href = `tel:${telPhone}`;
    setTimeout(() => { mobileCta.style.display = "flex"; }, 2000);
  }

  /* Open status */
  const openStatusEl = document.getElementById("open-status");
  if (openStatusEl) {
    const update = () => {
      const now = new Date();
      const totalMin = now.getHours() * 60 + now.getMinutes();
      const open = totalMin >= 6 * 60 && totalMin < 22 * 60;
      const key = open ? "open_now" : "closed_now";
      const txt = window.t ? window.t(key) : (open ? "Đang mở cửa" : "Đã đóng cửa");
      openStatusEl.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style="background-color:${open ? "#dcfce7" : "#fee2e2"}; color:${open ? "#166534" : "#991b1b"};">
          <span class="status-dot ${open ? "open" : "closed"}"></span>
          <span data-i18n="${key}">${txt}</span>
        </span>`;
    };
    update();
    setInterval(update, 60000);
  }

  /* Apply i18n translations after all DOM wiring */
  if (window.initLanguage) window.initLanguage();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHref(id, value) {
  if (!value) return;
  const el = document.getElementById(id);
  if (el) el.href = value;
}
