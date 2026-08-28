/* ===================================================================
   main.js — homepage interactivity (index.html)
   Reads from db.* (storage.js) which is seeded from localStorage.
=================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const settings = db.settings.get();

  initCommonUI(settings);
  renderHomeSettings(settings);
  renderMenu();
  renderGallery(settings);
  renderReviews();
  renderPosts();
  renderFaqs();
  renderFaqSchema();
  renderRichSchema();
  setupReservationForm();

  /* Re-jump to the URL's hash target once the page layout has actually
     settled. The Tailwind CDN script applies utility styles to
     JS-injected content (menu, gallery, posts, FAQ) asynchronously via a
     MutationObserver, so the target's position can keep shifting for a
     bit even after all render*() calls above have run — scrolling too
     early lands short once that late styling pushes the target down. */
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      let lastTop = null;
      let stableFrames = 0;
      let attempts = 0;
      const waitForStableLayout = () => {
        const top = target.getBoundingClientRect().top + window.scrollY;
        stableFrames = lastTop !== null && Math.abs(top - lastTop) < 1 ? stableFrames + 1 : 0;
        lastTop = top;
        attempts++;
        if (stableFrames >= 3 || attempts >= 90) {
          target.scrollIntoView({ block: "start" });
          return;
        }
        requestAnimationFrame(waitForStableLayout);
      };
      requestAnimationFrame(waitForStableLayout);
    }
  }
});

/* ---------------------------------------------------------------
   Settings-driven text (homepage-specific: hero + info row)
--------------------------------------------------------------- */
function renderHomeSettings(s) {
  const telPhone = (s.phone || "").replace(/\s+/g, "");

  // Hero
  document.getElementById("hero-tagline").textContent = s.tagline;
  document.getElementById("hero-desc").textContent = s.heroDesc;
  renderHeroTitle(s.heroTitle, s.heroHighlight);

  const statsEl = document.getElementById("hero-stats");
  statsEl.innerHTML = "";
  (s.stats || []).forEach((stat) => {
    const div = document.createElement("div");
    div.className = "text-center";
    div.innerHTML = `<div class="text-xl font-bold" style="color:#f9c74f;">${escapeHtml(stat.num)}</div><div class="text-xs opacity-70 mt-0.5">${escapeHtml(stat.label)}</div>`;
    statsEl.appendChild(div);
  });

  // Intro image
  if (s.introImage) {
    document.getElementById("intro-fallback").style.display = "none";
    const img = document.getElementById("intro-image");
    img.src = s.introImage;
    img.style.display = "block";
  }

  // Info row
  document.getElementById("info-address").textContent = s.address;
  document.getElementById("info-hours").textContent = s.hours;
  const infoPhone = document.getElementById("info-phone");
  infoPhone.textContent = s.phone;
  infoPhone.href = `tel:${telPhone}`;
  document.getElementById("map-share-link").href = s.mapEmbed;
}

function renderHeroTitle(title, highlight) {
  const el = document.getElementById("hero-title");
  if (!highlight) {
    el.textContent = title;
    return;
  }
  const idx = title.indexOf(highlight);
  if (idx === -1) {
    el.textContent = title;
    return;
  }
  el.innerHTML =
    escapeHtml(title.slice(0, idx)) +
    `<span style="color:#f9c74f;">${escapeHtml(highlight)}</span>` +
    escapeHtml(title.slice(idx + highlight.length));
}

/* ---------------------------------------------------------------
   Menu
--------------------------------------------------------------- */
function renderMenu() {
  const items = db.menu.getAvailable();
  const grid = document.getElementById("menu-grid");
  grid.innerHTML = "";

  // Gom món theo "group": cùng nhóm = 1 sản phẩm nhiều biến thể.
  // group rỗng = mỗi món là 1 sản phẩm riêng.
  const groups = [];
  const idx = {};
  items.forEach((item) => {
    const key = (item.group || "").trim();
    if (key) {
      if (idx[key] === undefined) { idx[key] = groups.length; groups.push({ name: key, items: [] }); }
      groups[idx[key]].items.push(item);
    } else {
      groups.push({ name: item.name, items: [item] });
    }
  });

  groups.forEach((g) => {
    const first = g.items[0];
    const isMulti = g.items.length > 1;
    const prices = g.items.map((it) => parseInt(String(it.price || "").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
    const minPrice = prices.length ? Math.min(...prices) : null;
    const priceLabel = isMulti && minPrice != null
      ? "từ " + minPrice.toLocaleString("vi-VN") + "đ"
      : (first.price || "");
    const displayName = isMulti ? g.name : first.name;
    const tagItem = g.items.find((it) => it.tag);

    const a = document.createElement("a");
    a.href = "mon?id=" + encodeURIComponent(first.id);
    a.className = "group flex min-h-[310px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#e07b39]/40 no-underline";
    a.innerHTML = `
      ${menuVisualHtml(first, "card")}
      <div class="flex flex-1 flex-col gap-2 p-5">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-base font-bold leading-snug" style="color:#1a5276;">${escapeHtml(displayName)}</h3>
          ${tagItem ? tagHtml(tagItem.tag) : ""}
        </div>
        <p class="line-clamp-2 flex-1 text-sm leading-6 text-gray-500">${escapeHtml(first.desc)}</p>
        <div class="flex items-center justify-between gap-3 pt-1">
          <span class="text-lg font-bold" style="color:#e07b39;">${escapeHtml(priceLabel)}</span>
          <span class="text-xs font-semibold text-gray-400 transition-colors group-hover:text-[#e07b39]">${isMulti ? g.items.length + " loại →" : "Xem chi tiết →"}</span>
        </div>
      </div>
    `;
    grid.appendChild(a);
  });

  // Modal close handlers
  const modal = document.getElementById("menu-modal");
  document.getElementById("menu-modal-close").addEventListener("click", closeMenuModal);
  document.getElementById("menu-modal-other").addEventListener("click", closeMenuModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeMenuModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenuModal();
  });

  // "Đặt món này" -> close modal, prefill message, scroll to contact form
  document.getElementById("menu-modal-order").addEventListener("click", (e) => {
    e.preventDefault();
    const messageEl = document.querySelector('#reservation-form textarea[name="message"]');
    if (messageEl && currentModalItem) {
      messageEl.value = `Tôi muốn đặt món: ${currentModalItem.name}`;
    }
    closeMenuModal();
    document.getElementById("lien-he").scrollIntoView({ behavior: "smooth", block: "start" });
    if (messageEl) messageEl.focus();
  });
}

function menuVisualHtml(item, mode) {
  const image = isImageValue(item.emoji);
  const heightClass = mode === "modal" ? "h-full min-h-[220px]" : "h-36";
  const emojiSize = mode === "modal" ? "text-7xl" : "text-5xl";

  if (image) {
    return `<div class="${heightClass} overflow-hidden bg-orange-50"><img src="${escapeHtml(item.emoji)}" alt="${escapeHtml(item.name)}" class="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105" /></div>`;
  }
  return `<div class="${heightClass} flex items-center justify-center ${emojiSize}" style="background: linear-gradient(135deg, #fde8d0, #fff7ed);">${item.emoji}</div>`;
}

function tagHtml(value) {
  if (!value) return "";
  return `<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white" style="background-color:#e07b39;">${escapeHtml(value)}</span>`;
}

let currentModalItem = null;

function openMenuModal(item) {
  currentModalItem = item;
  const modal = document.getElementById("menu-modal");
  document.getElementById("menu-modal-visual").outerHTML = menuVisualHtml(item, "modal").replace("<div", '<div id="menu-modal-visual"');
  document.getElementById("menu-modal-title").textContent = item.name;
  const tagEl = document.getElementById("menu-modal-tag");
  if (item.tag) {
    tagEl.textContent = item.tag;
    tagEl.style.display = "inline-block";
  } else {
    tagEl.style.display = "none";
  }
  document.getElementById("menu-modal-desc").textContent = item.desc;
  document.getElementById("menu-modal-price").textContent = item.price;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeMenuModal() {
  const modal = document.getElementById("menu-modal");
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ---------------------------------------------------------------
   Gallery (homepage preview — shows up to 3 photos)
--------------------------------------------------------------- */
const GALLERY_PREVIEW_SIZE = 3;

function renderGallery(settings) {
  const { items, isFallback } = getGalleryItems(settings);
  const grid = document.getElementById("gallery-grid");
  const note = document.getElementById("gallery-fallback-note");
  const moreWrap = document.getElementById("gallery-more-wrap");

  note.style.display = isFallback ? "block" : "none";

  const visible = items.slice(0, GALLERY_PREVIEW_SIZE);
  grid.innerHTML = visible.map((item, index) => galleryCardHtml(item, isFallback, index)).join("");
  attachGalleryLightbox(grid, items, isFallback);

  moreWrap.classList.toggle("hidden", items.length <= GALLERY_PREVIEW_SIZE);
}

/* ---------------------------------------------------------------
   Reviews carousel
--------------------------------------------------------------- */
let reviewsState = { current: 0, perPage: 3, reviews: [], timer: null, paused: false };

function renderReviews() {
  const data = db.reviews.get();
  const reviews = data.reviews || [];
  const rating = data.rating > 0 ? data.rating.toFixed(1) : "4.8";
  const total = data.totalRatings > 0 ? data.totalRatings.toLocaleString("vi-VN") : "1.200";

  document.getElementById("reviews-rating").textContent = rating;
  document.getElementById("reviews-total").textContent = total;
  document.getElementById("reviews-total-2").textContent = total;

  reviewsState.reviews = reviews;
  reviewsState.perPage = getPerPage();
  reviewsState.current = 0;

  renderReviewsTrack();

  document.getElementById("reviews-prev").addEventListener("click", () => reviewsGo(reviewsState.current - 1));
  document.getElementById("reviews-next").addEventListener("click", () => reviewsGo(reviewsState.current + 1));

  const carousel = document.getElementById("reviews-carousel");
  carousel.addEventListener("mouseenter", () => { reviewsState.paused = true; });
  carousel.addEventListener("mouseleave", () => { reviewsState.paused = false; });

  window.addEventListener("resize", () => {
    const newPerPage = getPerPage();
    if (newPerPage !== reviewsState.perPage) {
      reviewsState.perPage = newPerPage;
      reviewsState.current = 0;
      renderReviewsTrack();
    }
  });

  startReviewsAutoplay();
}

function getPerPage() {
  const w = window.innerWidth;
  return w < 768 ? 1 : w < 1024 ? 2 : 3;
}

function reviewsMaxIndex() {
  return Math.max(0, reviewsState.reviews.length - reviewsState.perPage);
}

function reviewsGo(idx) {
  const max = reviewsMaxIndex();
  if (idx < 0) idx = max;
  if (idx > max) idx = 0;
  reviewsState.current = idx;
  renderReviewsTrack();
}

function renderReviewsTrack() {
  const track = document.getElementById("reviews-track");
  const { reviews, current, perPage } = reviewsState;
  const visible = reviews.slice(current, current + perPage);

  track.innerHTML = "";
  track.style.display = "grid";
  track.style.gridTemplateColumns = `repeat(${perPage}, minmax(0, 1fr))`;
  track.style.gap = "1.5rem";

  visible.forEach((r) => {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">👤</div>
        <div>
          <div class="font-semibold text-gray-800">${escapeHtml(r.name)}</div>
          <div class="text-xs text-gray-400">${escapeHtml(r.date)}</div>
        </div>
      </div>
      <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p class="text-sm text-gray-600 leading-relaxed italic">"${escapeHtml(r.text)}"</p>
    `;
    track.appendChild(card);
  });

  // Dots
  const dotsEl = document.getElementById("reviews-dots");
  const max = reviewsMaxIndex();
  const controls = document.getElementById("reviews-controls");
  if (reviews.length <= perPage) {
    controls.style.display = "none";
    return;
  }
  controls.style.display = "flex";
  dotsEl.innerHTML = "";
  for (let i = 0; i <= max; i++) {
    const dot = document.createElement("button");
    if (i === current) dot.classList.add("active");
    dot.addEventListener("click", () => reviewsGo(i));
    dotsEl.appendChild(dot);
  }
}

function startReviewsAutoplay() {
  if (reviewsState.timer) clearInterval(reviewsState.timer);
  reviewsState.timer = setInterval(() => {
    if (reviewsState.paused) return;
    if (reviewsState.reviews.length <= reviewsState.perPage) return;
    reviewsGo(reviewsState.current + 1);
  }, 4000);
}

/* ---------------------------------------------------------------
   Blog posts
--------------------------------------------------------------- */
const POSTS_PAGE_SIZE = 4;
let postsState = { page: 1, articles: [] };

function renderPosts() {
  postsState.articles = db.posts.getPublished();
  if (postsState.articles.length === 0) return;
  renderPostsGrid();
}

function renderPostsGrid() {
  const { page, articles } = postsState;
  const totalPages = Math.ceil(articles.length / POSTS_PAGE_SIZE);
  const start = (page - 1) * POSTS_PAGE_SIZE;
  const visible = articles.slice(start, start + POSTS_PAGE_SIZE);

  const grid = document.getElementById("posts-grid");
  grid.innerHTML = "";

  visible.forEach((a) => {
    const link = document.createElement("a");
    link.href = `bai-viet?id=${encodeURIComponent(a.id)}`;
    link.className = "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group block";
    link.innerHTML = `
      <article>
        <div class="h-40 flex items-center justify-center overflow-hidden" style="background: linear-gradient(135deg, #fde8d0, #fef3e2);">
          ${isImageValue(a.emoji) ? `<img src="${escapeHtml(a.emoji)}" alt="${escapeHtml(a.title)}" class="w-full h-full object-cover" />` : `<span class="text-7xl">${a.emoji}</span>`}
        </div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-2">
            ${a.tag ? `<span class="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style="background-color:#e07b39;">${escapeHtml(a.tag)}</span>` : ""}
            <span class="text-xs text-gray-400">📅 ${escapeHtml(a.date)}</span>
            <span class="text-xs text-gray-400 ml-auto flex items-center gap-0.5">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ${escapeHtml(a.views)}
            </span>
          </div>
          <h3 class="font-bold text-base mb-2 group-hover:text-[#e07b39] transition-colors leading-snug" style="color:#1a5276;">${escapeHtml(a.title)}</h3>
          <p class="text-sm text-gray-500 leading-relaxed line-clamp-3">${escapeHtml(a.excerpt)}</p>
          <div class="mt-3 text-sm font-semibold" style="color:#e07b39;">${window.t ? window.t("posts_read_more") : "Đọc thêm →"}</div>
        </div>
      </article>
    `;
    grid.appendChild(link);
  });

  // Pagination
  const pag = document.getElementById("posts-pagination");
  pag.innerHTML = "";
  if (totalPages <= 1) return;

  const wrap = document.createElement("div");
  wrap.className = "flex items-center gap-2";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.textContent = window.t ? window.t("posts_prev") : "← Trước";
  prevBtn.className = "h-10 px-4 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:border-[#e07b39] hover:text-[#e07b39] disabled:opacity-40 transition-colors";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => { postsState.page = Math.max(1, page - 1); renderPostsGrid(); });
  wrap.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(i);
    btn.className = "h-10 w-10 rounded-full border text-sm font-bold transition-colors";
    if (i === page) {
      btn.style.backgroundColor = "#1a5276";
      btn.style.borderColor = "#1a5276";
      btn.style.color = "#fff";
    } else {
      btn.style.backgroundColor = "#fff";
      btn.style.borderColor = "#e5e7eb";
      btn.style.color = "#64748b";
    }
    btn.addEventListener("click", () => { postsState.page = i; renderPostsGrid(); });
    wrap.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.textContent = window.t ? window.t("posts_next") : "Sau →";
  nextBtn.className = "h-10 px-4 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:border-[#e07b39] hover:text-[#e07b39] disabled:opacity-40 transition-colors";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => { postsState.page = Math.min(totalPages, page + 1); renderPostsGrid(); });
  wrap.appendChild(nextBtn);

  pag.appendChild(wrap);
}

/* ---------------------------------------------------------------
   FAQ accordion
--------------------------------------------------------------- */
function renderFaqs() {
  const faqs = db.faqs.getAll();
  const list = document.getElementById("faq-list");
  list.innerHTML = "";

  faqs.forEach((f) => {
    const item = document.createElement("div");
    item.className = "border border-gray-100 rounded-xl overflow-hidden faq-item";
    item.innerHTML = `
      <button class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-orange-50 transition-colors faq-question" style="color:#1a5276;">
        <span>${escapeHtml(f.q)}</span>
        <span class="shrink-0 text-base faq-icon">+</span>
      </button>
      <div class="px-4 text-sm text-gray-600 leading-relaxed faq-answer">${escapeHtml(f.a)}</div>
    `;
    const btn = item.querySelector(".faq-question");
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      list.querySelectorAll(".faq-item").forEach((el) => {
        el.classList.remove("open");
        el.querySelector(".faq-question").style.color = "#1a5276";
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.style.color = "#e07b39";
      }
    });
    list.appendChild(item);
  });
}

function renderFaqSchema() {
  const faqs = db.faqs.getAll();
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const el = document.getElementById("faq-schema");
  if (el) el.textContent = JSON.stringify(schema);
}

/* Làm giàu Restaurant schema với thực đơn (hasMenu) + đánh giá thật
   (review) lấy từ DB, giữ đồng bộ với dữ liệu admin. Google/AI đọc được
   → có thể hiện rich result về món/giá/sao. */
function renderRichSchema() {
  const el = document.getElementById("restaurant-schema");
  if (!el) return;
  let schema;
  try { schema = JSON.parse(el.textContent); } catch (e) { return; }

  // hasMenu — chỉ món còn phục vụ
  const items = db.menu.getAvailable().map((m) => {
    const priceNum = String(m.price || "").replace(/\D/g, "");
    const item = { "@type": "MenuItem", name: m.name };
    if (m.desc) item.description = m.desc;
    if (priceNum) item.offers = { "@type": "Offer", price: priceNum, priceCurrency: "VND" };
    return item;
  });
  if (items.length) {
    schema.hasMenu = {
      "@type": "Menu",
      name: "Thực đơn Bún Quậy Như Ý",
      hasMenuSection: { "@type": "MenuSection", name: "Món đặc sắc", hasMenuItem: items },
    };
  }

  // review — đánh giá thật do admin nhập
  const rv = db.reviews.get() || {};
  const reviews = (rv.reviews || []).slice(0, 20).map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.name || "Khách hàng" },
    reviewRating: { "@type": "Rating", ratingValue: String(r.stars || 5), bestRating: "5" },
    reviewBody: r.text || "",
  }));
  if (reviews.length) schema.review = reviews;

  el.textContent = JSON.stringify(schema);
}

/* ---------------------------------------------------------------
   Reservation form
--------------------------------------------------------------- */
function setupReservationForm() {
  const form = document.getElementById("reservation-form");
  const today = new Date().toISOString().split("T")[0];
  const dateInput = form.querySelector('input[name="date"]');
  if (dateInput) dateInput.min = today;

  // Nếu tới từ trang chi tiết món (bấm "Đặt món này") → điền sẵn tên món.
  try {
    const pre = sessionStorage.getItem("dsp_prefill_order");
    if (pre) {
      const msg = form.querySelector('textarea[name="message"]');
      if (msg && !msg.value) msg.value = "Tôi muốn đặt món: " + pre;
      sessionStorage.removeItem("dsp_prefill_order");
    }
  } catch (e) {}

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitBtn && submitBtn.disabled) return; // đang gửi — chặn double-click
    const errorEl = document.getElementById("reservation-error");
    errorEl.classList.add("hidden");

    const data = Object.fromEntries(new FormData(form).entries());

    const err = (key) => {
      errorEl.textContent = window.t ? window.t(key) : key;
      errorEl.classList.remove("hidden");
    };
    // Hiện thẳng thông báo lỗi từ server (chuỗi tiếng Việt, không phải i18n key)
    const errRaw = (msg) => {
      errorEl.textContent = msg;
      errorEl.classList.remove("hidden");
    };

    if (!data.name || !data.name.trim()) { err("err_name"); return; }
    if (!data.phone || !data.phone.trim()) { err("err_phone"); return; }
    if (!/^(\+84|0)\d{9,10}$/.test(data.phone.replace(/[\s().-]/g, ""))) { err("err_phone_invalid"); return; }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) { err("err_email"); return; }
    if (!data.guests) { err("err_guests"); return; }

    const guestsNum = parseInt(data.guests, 10);
    if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 50) { err("err_guests_range"); return; }

    if (!data.date) { err("err_date"); return; }
    if (!data.time) { err("err_time"); return; }
    if (data.time < "06:00" || data.time > "22:00") { err("err_time_range"); return; }

    const today = new Date().toISOString().split("T")[0];
    if (data.date < today) { err("err_date_past"); return; }

    if (submitBtn) submitBtn.disabled = true;
    db.reservations.createAsync(data).then((res) => {
      if (res.ok) {
        notifyReservationViaZalo(data);
        fillBookingConfirm(res.item, data);
        form.classList.add("hidden");
        document.getElementById("reservation-success").classList.remove("hidden");
        document.getElementById("reservation-success").classList.add("flex");
      } else {
        errRaw(res.error);
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

/* Fill the post-booking confirmation card: a booking code the customer
   can quote, a summary of what they booked, and Zalo/call buttons so
   they can confirm with the shop right away. */
function fillBookingConfirm(item, data) {
  const s = db.settings.get();
  const phoneDigits = (s.phone || "").replace(/\D/g, "");

  const rawId = String((item && item.id) || Date.now());
  const code = "BQ-" + rawId.slice(-5).toUpperCase();
  const codeEl = document.getElementById("booking-code");
  if (codeEl) codeEl.textContent = code;

  const sumEl = document.getElementById("booking-summary");
  if (sumEl) {
    const dmy = (data.date || "").split("-").reverse().join("/");
    const tmpl = window.t ? window.t("confirm_summary") : "{guests} khách · {date} lúc {time}";
    sumEl.textContent = tmpl
      .replace("{guests}", data.guests || "")
      .replace("{date}", dmy)
      .replace("{time}", data.time || "");
  }

  const zalo = document.getElementById("confirm-zalo");
  if (zalo && phoneDigits) zalo.href = "https://zalo.me/" + phoneDigits;
  const call = document.getElementById("confirm-call");
  if (call && phoneDigits) call.href = "tel:" + phoneDigits;
}

/* ---------------------------------------------------------------
   Notify admin's Zalo about a new reservation (avoids the booking
   getting buried in the admin reservation list). Sends silently in
   the background via the webhook configured in admin Cài đặt —
   the customer sees nothing.
--------------------------------------------------------------- */
function notifyReservationViaZalo(data) {
  const settings = db.settings.get();
  const webhookUrl = (settings.zaloWebhookUrl || "").trim();
  if (!webhookUrl) return;

  const lines = [
    "📋 ĐẶT BÀN MỚI",
    `👤 Tên: ${data.name}`,
    `📞 SĐT: ${data.phone}`,
    `👥 Số khách: ${data.guests}`,
    `📅 Ngày: ${data.date}`,
    `🕐 Giờ: ${data.time}`,
  ];
  if (data.message) lines.push(`📝 Ghi chú: ${data.message}`);
  const message = lines.join("\n");

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, summary: message }),
  }).catch(() => {});
}
