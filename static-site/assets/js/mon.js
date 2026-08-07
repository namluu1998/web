/* ===================================================================
   mon.js — trang chi tiết 1 món ăn (mon.html / mon.php?id=...)
   Render từ db.menu, chờ dữ liệu tải xong (giống post.js).
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
  const isImg = isImageValue(item.emoji);
  const visual = isImg
    ? `<img src="${escapeHtml(item.emoji)}" alt="${escapeHtml(item.name)} - đặc sản Phú Quốc" class="w-full h-full object-contain" />`
    : `<div class="flex items-center justify-center w-full h-full text-8xl" style="background:linear-gradient(135deg,#fde8d0,#fff7ed);">${item.emoji || "🍜"}</div>`;

  document.getElementById("breadcrumb-name").textContent = item.name;

  detail.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
      <div class="rounded-2xl overflow-hidden shadow-sm bg-orange-50 aspect-square">${visual}</div>
      <div>
        <div class="flex items-start justify-between gap-2">
          <h1 class="text-2xl md:text-3xl font-bold leading-tight" style="color:#1a5276;">${escapeHtml(item.name)}</h1>
        </div>
        ${item.tag ? `<span class="inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold text-white" style="background-color:#e07b39;">${escapeHtml(item.tag)}</span>` : ""}
        <p class="mt-3 text-2xl font-bold" style="color:#e07b39;">${escapeHtml(item.price || "")}</p>
        <p class="mt-4 text-[15px] leading-8 text-gray-600 whitespace-pre-line">${escapeHtml(item.desc || "")}</p>

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

  // "Đặt món này" -> chuyển về form đặt bàn kèm sẵn tên món
  const orderBtn = document.getElementById("mon-order");
  if (orderBtn) {
    orderBtn.href = "index.html#lien-he";
    orderBtn.addEventListener("click", () => {
      try { sessionStorage.setItem("dsp_prefill_order", item.name); } catch (e) {}
    });
  }

  // Món khác (internal link sang landing page của món khác)
  const others = db.menu.getAvailable().filter((m) => String(m.id) !== String(id)).slice(0, 8);
  if (others.length) {
    const wrap = document.getElementById("mon-related-wrap");
    const grid = document.getElementById("mon-related");
    grid.innerHTML = others.map((m) => {
      const v = isImageValue(m.emoji)
        ? `<img src="${escapeHtml(m.emoji)}" alt="${escapeHtml(m.name)}" class="w-full h-28 object-contain bg-orange-50" />`
        : `<div class="w-full h-28 flex items-center justify-center text-4xl" style="background:linear-gradient(135deg,#fde8d0,#fff7ed);">${m.emoji || "🍜"}</div>`;
      return `<a href="mon?id=${encodeURIComponent(m.id)}" class="group block rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
        ${v}
        <div class="p-3">
          <p class="text-sm font-semibold leading-snug group-hover:text-[#e07b39] transition-colors" style="color:#1a5276;">${escapeHtml(m.name)}</p>
          <p class="text-xs font-bold mt-1" style="color:#e07b39;">${escapeHtml(m.price || "")}</p>
        </div>
      </a>`;
    }).join("");
    wrap.style.display = "";
  }

  // JSON-LD schema cho món (nếu chưa được server render sẵn)
  const schemaEl = document.getElementById("mon-schema");
  if (schemaEl && !schemaEl.textContent.trim()) {
    const priceNum = String(item.price || "").replace(/\D/g, "");
    const schema = {
      "@context": "https://schema.org",
      "@type": "MenuItem",
      name: item.name,
      description: item.desc || "",
      url: "https://bunquayphuquoc.com/mon?id=" + encodeURIComponent(id),
    };
    if (isImg) schema.image = item.emoji.indexOf("http") === 0 ? item.emoji : "https://bunquayphuquoc.com" + item.emoji;
    if (priceNum) schema.offers = { "@type": "Offer", price: priceNum, priceCurrency: "VND", availability: "https://schema.org/InStock" };
    schemaEl.textContent = JSON.stringify(schema);
  }
});
