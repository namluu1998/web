/* ===================================================================
   mon.js — trang chi tiết 1 sản phẩm (mon.html / mon.php?id=...)
   Hỗ trợ sản phẩm có nhiều BIẾN THỂ (cùng "group") — chọn loại → đổi giá.
=================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const settings = db.settings.get();
  initCommonUI(settings);

  const id = new URLSearchParams(window.location.search).get("id");
  const item = id ? db.menu.getById(id) : null;
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
  let variants = group
    ? db.menu.getAvailable().filter((m) => (m.group || "").trim() === group)
    : [item];
  if (!variants.length) variants = [item];
  const isMulti = variants.length > 1;
  const productName = group || item.name;

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
  document.getElementById("page-title").textContent = productName + " Phú Quốc | " + site;

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
            <a id="mon-order" href="index.html#lien-he" class="px-6 py-3 rounded-full text-sm font-semibold text-white text-center" style="background-color:#e07b39;">🍜 Đặt món này</a>
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

  // "Món khác" = các SẢN PHẨM khác (khác group), 1 đại diện mỗi sản phẩm.
  const seen = {};
  seen[group || ("__" + item.id)] = true;
  const others = [];
  db.menu.getAvailable().forEach((m) => {
    const k = (m.group || "").trim() || ("__" + m.id);
    if (seen[k]) return;
    seen[k] = true;
    others.push(m);
  });
  if (others.length) {
    const wrap = document.getElementById("mon-related-wrap");
    const grid = document.getElementById("mon-related");
    grid.innerHTML = others.slice(0, 8).map((m) => {
      const v = isImageValue(m.emoji)
        ? `<img src="${escapeHtml(m.emoji)}" alt="${escapeHtml(m.name)}" class="w-full h-28 object-contain bg-orange-50" />`
        : `<div class="w-full h-28 flex items-center justify-center text-4xl" style="background:linear-gradient(135deg,#fde8d0,#fff7ed);">${m.emoji || "🍜"}</div>`;
      const nm = (m.group || "").trim() || m.name;
      return `<a href="mon?id=${encodeURIComponent(m.id)}" class="group block rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
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
      description: item.desc || "",
      url: "https://bunquayphuquoc.com/mon?id=" + encodeURIComponent(id),
    };
    if (isImageValue(item.emoji)) schema.image = item.emoji.indexOf("http") === 0 ? item.emoji : "https://bunquayphuquoc.com" + item.emoji;
    schema.offers = isMulti ? variants.map(offer) : offer(item);
    schemaEl.textContent = JSON.stringify(schema);
  }
});
