/* ===================================================================
   mon.js — trang chi tiết 1 sản phẩm
   Hỗ trợ sản phẩm có nhiều BIẾN THỂ (cùng "group") — chọn loại → đổi giá.

   URL chuẩn:  /mon/<slug>     slug của SẢN PHẨM, không phải của từng
                               biến thể — 3 biến thể dùng chung 1 URL
                               nên không sinh trang trùng nội dung.
   URL cũ:     /mon?id=<id>    vẫn mở đúng sản phẩm để link/bookmark/
                               kết quả Google cũ không gãy.
=================================================================== */

/* Đọc "khoá" sản phẩm từ URL: slug trong đường dẫn, hoặc id/slug trên
   query string (mon.php cũng nhận ?slug= khi .htaccess rewrite). */
function readMonRoute() {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, "");
  const matched = path.match(/\/mon(?:\.html|\.php)?\/(.+)$/);
  let slugFromPath = "";
  if (matched) {
    try { slugFromPath = decodeURIComponent(matched[1]); }
    catch (e) { slugFromPath = matched[1]; }
  }
  return { id: params.get("id") || "", slug: params.get("slug") || slugFromPath };
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const settings = db.settings.get();
  initCommonUI(settings);

  const route = readMonRoute();
  let item = route.slug ? db.menu.getBySlug(route.slug) : null;
  if (!item && route.id) item = db.menu.getById(route.id);
  const detail = document.getElementById("mon-detail");

  if (!item) {
    document.getElementById("page-title").textContent = "Không tìm thấy món | " + (settings.siteName || "Bún Quậy Như Ý");
    document.getElementById("breadcrumb-name").textContent = "Không tìm thấy";
    detail.innerHTML = `
      <div class="text-center py-16">
        <div class="text-5xl mb-3">🍜</div>
        <h1 class="text-2xl font-bold mb-2" style="color:#1a5276;">Không tìm thấy món</h1>
        <p class="text-gray-500">Món bạn tìm không tồn tại hoặc đã ngừng phục vụ.</p>
      </div>`;
    return;
  }

  const site = settings.siteName || "Bún Quậy Như Ý";
  const telPhone = (settings.phone || "").replace(/\s+/g, "");
  const group = (item.group || "").trim();

  // Các biến thể = cùng group (còn phục vụ). Không group → 1 món đơn.
  const variants = db.menu.getVariants(item);
  const isMulti = variants.length > 1;
  const productName = menuProductName(item);

  /* URL chuẩn của sản phẩm. Vào bằng /mon?id=... hay bằng slug cũ thì
     dọn thanh địa chỉ về đây (không tải lại trang); redirect 301 thật
     nằm ở mon.php để bot tìm kiếm cũng thấy đúng URL chuẩn. */
  const canonicalPath = menuUrl(item);
  const pageUrl = SITE_URL + canonicalPath;
  if (window.location.pathname + window.location.search !== canonicalPath) {
    try { history.replaceState(null, "", canonicalPath); } catch (e) {}
  }

  /* Thẻ SEO / mạng xã hội: ưu tiên Tiêu đề + Mô tả admin nhập trong
     phần SEO của sản phẩm, để trống thì suy từ tên sản phẩm và mô tả. */
  const seoTitle = menuSeoTitle(item, site);
  const seoDesc = menuSeoDesc(item);
  const ogImage = isImageValue(item.emoji)
    ? (item.emoji.indexOf("http") === 0 || item.emoji.indexOf("data:") === 0 ? item.emoji : SITE_URL + item.emoji)
    : (settings.ogImage || SITE_URL + "/uploads/1780645751588-lekzpy.png");

  const setMeta = (id, attr, value) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  };
  setMeta("page-description", "content", seoDesc);
  setMeta("page-canonical", "href", pageUrl);
  setMeta("og-title", "content", seoTitle);
  setMeta("og-description", "content", seoDesc);
  setMeta("og-url", "content", pageUrl);
  setMeta("og-image", "content", ogImage);
  setMeta("twitter-title", "content", seoTitle);
  setMeta("twitter-description", "content", seoDesc);
  setMeta("twitter-image", "content", ogImage);

  // Nhãn biến thể = bỏ tiền tố tên nhóm khỏi tên món.
  const variantLabel = (v) => {
    if (!group) return v.name;
    let lbl = v.name;
    if (lbl.indexOf(group) === 0) lbl = lbl.slice(group.length).replace(/^[\s\-–—:|,]+/, "").trim();
    return lbl || v.name;
  };
  const visualHtml = (v) => isImageValue(v.emoji)
    ? `<img src="${escapeHtml(v.emoji)}" alt="${escapeHtml(v.name)} - đặc sản Phú Quốc" class="w-full h-full object-contain" />`
    : `<div class="flex items-center justify-center w-full h-full text-8xl" style="background:linear-gradient(135deg,#fde8d0,#fff7ed);">${v.emoji || "🍜"}</div>`;

  document.getElementById("breadcrumb-name").textContent = productName;
  document.getElementById("page-title").textContent = seoTitle;

  let cur = item; // biến thể đang chọn

  function renderDetail() {
    const variantBtns = isMulti ? `
      <div class="mt-4">
        <p class="text-xs font-semibold text-gray-500 mb-2">Chọn loại:</p>
        <div class="flex flex-wrap gap-2">
          ${variants.map((v) => {
            const sel = String(v.id) === String(cur.id);
            return `<button type="button" data-vid="${escapeHtml(v.id)}" class="variant-btn px-3 py-2 rounded-xl border text-left transition-colors" style="${sel ? "border-color:#e07b39;background:#fff7ed;" : "border-color:#e5e7eb;"}">
              <span class="font-semibold block text-sm" style="color:#1a5276;">${escapeHtml(variantLabel(v))}</span>
              <span class="text-xs font-bold" style="color:#e07b39;">${escapeHtml(v.price || "")}</span>
            </button>`;
          }).join("")}
        </div>
      </div>` : "";

    detail.innerHTML = `
      <div class="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
        <div class="rounded-2xl overflow-hidden shadow-sm bg-orange-50 aspect-square">${visualHtml(cur)}</div>
        <div>
          <h1 class="text-2xl md:text-3xl font-bold leading-tight" style="color:#1a5276;">${escapeHtml(productName)}</h1>
          ${cur.tag ? `<span class="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold text-white" style="background-color:#e07b39;">${escapeHtml(cur.tag)}</span>` : ""}
          <p class="mt-3 text-2xl font-bold" style="color:#e07b39;">${escapeHtml(cur.price || "")}</p>
          <p class="mt-4 text-[15px] leading-8 text-gray-600 whitespace-pre-line">${escapeHtml(cur.desc || "")}</p>
          ${variantBtns}
          <div class="mt-6 flex flex-col sm:flex-row gap-3">
            <a id="mon-order" href="/#lien-he" class="px-6 py-3 rounded-full text-sm font-semibold text-white text-center" style="background-color:#e07b39;">🍜 Đặt món này</a>
            <a href="tel:${escapeHtml(telPhone)}" class="px-6 py-3 rounded-full text-sm font-semibold text-white text-center" style="background-color:#25d366;">📞 Gọi đặt ngay</a>
          </div>
          <div class="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 space-y-1.5">
            <p>📍 <strong>${escapeHtml(site)}</strong> — ${escapeHtml(settings.address || "213 Đ. Trần Phú, Khu 7, Phú Quốc")}</p>
            <p>🕐 ${escapeHtml(settings.hours || "06:00 – 22:00 hàng ngày")}</p>
          </div>
        </div>
      </div>`;

    detail.querySelectorAll(".variant-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const v = variants.find((x) => String(x.id) === String(b.getAttribute("data-vid")));
        if (v) { cur = v; renderDetail(); }
      });
    });
    const orderBtn = document.getElementById("mon-order");
    if (orderBtn) orderBtn.addEventListener("click", () => {
      const label = isMulti ? productName + " - " + variantLabel(cur) : cur.name;
      try { sessionStorage.setItem("dsp_prefill_order", label); } catch (e) {}
    });
  }
  renderDetail();

  // "Món khác" = các SẢN PHẨM khác, 1 đại diện mỗi sản phẩm.
  const thisKey = menuGroupKey(item);
  const others = db.menu.getProducts().filter((m) => menuGroupKey(m) !== thisKey);
  if (others.length) {
    const wrap = document.getElementById("mon-related-wrap");
    const grid = document.getElementById("mon-related");
    grid.innerHTML = others.slice(0, 8).map((m) => {
      const v = isImageValue(m.emoji)
        ? `<img src="${escapeHtml(m.emoji)}" alt="${escapeHtml(m.name)}" class="w-full h-28 object-contain bg-orange-50" />`
        : `<div class="w-full h-28 flex items-center justify-center text-4xl" style="background:linear-gradient(135deg,#fde8d0,#fff7ed);">${m.emoji || "🍜"}</div>`;
      const nm = (m.group || "").trim() || m.name;
      return `<a href="${escapeHtml(menuUrl(m))}" class="group block rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
        ${v}
        <div class="p-3">
          <p class="text-sm font-semibold leading-snug group-hover:text-[#e07b39] transition-colors" style="color:#1a5276;">${escapeHtml(nm)}</p>
          <p class="text-xs font-bold mt-1" style="color:#e07b39;">${escapeHtml(m.price || "")}</p>
        </div>
      </a>`;
    }).join("");
    wrap.style.display = "";
  }

  // JSON-LD Product/MenuItem (nếu server chưa render sẵn)
  const schemaEl = document.getElementById("mon-schema");
  if (schemaEl && !schemaEl.textContent.trim()) {
    const offer = (v) => {
      const p = String(v.price || "").replace(/\D/g, "");
      const o = { "@type": "Offer", priceCurrency: "VND", availability: "https://schema.org/InStock" };
      if (p) o.price = p;
      if (isMulti) o.name = variantLabel(v);
      return o;
    };
    const schema = {
      "@context": "https://schema.org",
      "@type": isMulti ? "Product" : "MenuItem",
      name: productName,
      description: seoDesc,
      url: pageUrl,
    };
    if (isImageValue(item.emoji)) schema.image = ogImage;
    schema.offers = isMulti ? variants.map(offer) : offer(item);
    schemaEl.textContent = JSON.stringify(schema);
  }
});
