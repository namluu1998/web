/* ===================================================================
   storage.js — MySQL backend (api.php) với localStorage fallback
   - Trên cPanel (có PHP): dùng MySQL qua api.php
   - Trên localhost / dev: tự động fallback về localStorage
=================================================================== */

// ── API config ────────────────────────────────────────────────────
const _API_URL = "/api.php";
let _useAPI = false;

// ── In-memory store ───────────────────────────────────────────────
let _mem = {
  posts: [], menu: [], reservations: [],
  reviews: null, faqs: [], settings: {}, users: [],
};

// ── Sync GET (chạy trước DOMContentLoaded) ────────────────────────
function _apiGetSync(qs) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", _API_URL + "?" + qs, false);
  xhr.send(null);
  if (xhr.status === 200) return JSON.parse(xhr.responseText);
  return null;
}

// ── Async POST (fire-and-forget, không block UI) ──────────────────
function _apiPost(entity, action, id, body) {
  _clearDbCache(); // vừa ghi -> bản chụp trong phiên đã cũ
  let url = _API_URL + "?entity=" + entity + "&action=" + action;
  if (id != null) url += "&id=" + encodeURIComponent(String(id));
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  }).then((res) => {
    if (res.status === 401) {
      sessionStorage.removeItem(DB_KEYS.session);
      alert("Phiên đăng nhập đã hết hạn. Thay đổi vừa rồi CHƯA được lưu — vui lòng đăng nhập lại.");
      window.location.href = "login.html";
    }
  }).catch(() => {});
}

// Like _apiPost but returns a promise that rejects with the server's error
// message on non-2xx. Used by the public booking form so it can wait for the
// server's verdict (anti-spam, duplicate slot) before telling the user.
function _apiPostAwait(entity, action, id, body) {
  _clearDbCache(); // vừa ghi -> bản chụp trong phiên đã cũ
  let url = _API_URL + "?entity=" + entity + "&action=" + action;
  if (id != null) url += "&id=" + encodeURIComponent(String(id));
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  }).then(function (res) {
    if (res.ok) return res.json().catch(function () { return {}; });
    return res.json().then(
      function (j) { throw new Error((j && j.error) || "Có lỗi xảy ra, vui lòng thử lại."); },
      function () { throw new Error("Có lỗi xảy ra, vui lòng thử lại."); }
    );
  });
}

// ── localStorage helpers ──────────────────────────────────────────
const DB_KEYS = {
  posts: "dsp_posts", menu: "dsp_menu", reservations: "dsp_reservations",
  reviews: "dsp_reviews", faqs: "dsp_faqs", settings: "dsp_settings",
  users: "dsp_users", session: "dsp_session",
};

function readJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ── uid ───────────────────────────────────────────────────────────
let _uidCounter = 0;
function uid() { return String(Date.now()) + String(++_uidCounter) + Math.random().toString(36).slice(2, 7); }

// ── initDB ────────────────────────────────────────────────────────
function initDB() {
  try {
    const data = _apiGetSync("action=init");
    if (data && data.seeded === false) { _seedViaAPI(); return; }
    if (data && data.settings && Object.keys(data.settings).length > 0) {
      _mem = data; _useAPI = true; return;
    }
  } catch (e) { /* api.php không tồn tại — dev mode */ }
  _useAPI = false;
  _initLocalStorage();
}

function _seedViaAPI() {
  const seed = {
    settings:     (typeof SETTINGS_SEED     !== "undefined" ? SETTINGS_SEED     : {}),
    menu:         (typeof MENU_SEED         !== "undefined" ? MENU_SEED         : []),
    posts:        (typeof POSTS_SEED        !== "undefined" ? POSTS_SEED        : []),
    reservations: (typeof RESERVATIONS_SEED !== "undefined" ? RESERVATIONS_SEED : []),
    reviews:      (typeof REVIEWS_SEED      !== "undefined" ? REVIEWS_SEED      : { reviews: [], rating: 4.8, totalRatings: 0 }),
    faqs:         (typeof FAQS_SEED         !== "undefined" ? FAQS_SEED         : []),
    users:        (typeof USERS_SEED        !== "undefined" ? USERS_SEED        : []),
  };
  const xhr = new XMLHttpRequest();
  xhr.open("POST", _API_URL + "?action=seed", false);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(seed));
  if (xhr.status === 200) { _mem = seed; _useAPI = true; }
  else { _useAPI = false; _initLocalStorage(); }
}

function _initLocalStorage() {
  if (localStorage.getItem(DB_KEYS.posts)        === null) writeJSON(DB_KEYS.posts,        POSTS_SEED);
  if (localStorage.getItem(DB_KEYS.menu)         === null) writeJSON(DB_KEYS.menu,         MENU_SEED);
  if (localStorage.getItem(DB_KEYS.reservations) === null) writeJSON(DB_KEYS.reservations, RESERVATIONS_SEED);
  if (localStorage.getItem(DB_KEYS.reviews)      === null) writeJSON(DB_KEYS.reviews,      REVIEWS_SEED);
  if (localStorage.getItem(DB_KEYS.faqs)         === null) writeJSON(DB_KEYS.faqs,         FAQS_SEED);
  if (localStorage.getItem(DB_KEYS.settings)     === null) writeJSON(DB_KEYS.settings,     SETTINGS_SEED);
  if (localStorage.getItem(DB_KEYS.users)        === null) writeJSON(DB_KEYS.users,        USERS_SEED);

  _mem.posts        = readJSON(DB_KEYS.posts,        []);
  _mem.menu         = readJSON(DB_KEYS.menu,         []);
  _mem.reservations = readJSON(DB_KEYS.reservations, []);
  _mem.reviews      = readJSON(DB_KEYS.reviews,      REVIEWS_SEED);
  _mem.faqs         = readJSON(DB_KEYS.faqs,         []);
  _mem.settings     = readJSON(DB_KEYS.settings,     SETTINGS_SEED);
  _mem.users        = readJSON(DB_KEYS.users,        []);
}

// ── Search helpers ────────────────────────────────────────────────
function normalizeSearchValue(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}
function matchesSearch(query, ...values) {
  const q = normalizeSearchValue(query);
  if (!q) return true;
  return values.some((v) => normalizeSearchValue(v).includes(q));
}

// ── isImageValue ──────────────────────────────────────────────────
function isImageValue(val) {
  if (!val || typeof val !== "string") return false;
  return val.startsWith("/uploads/") || val.startsWith("http://") ||
         val.startsWith("https://")  || val.startsWith("data:image/");
}

// ── isVideoValue ──────────────────────────────────────────────────
function isVideoValue(val) {
  if (!val || typeof val !== "string") return false;
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(val) || val.startsWith("data:video/");
}

// ── Sản phẩm, slug & SEO ──────────────────────────────────────────
// Các dòng menu cùng "group" là BIẾN THỂ của một sản phẩm. URL, slug và
// thẻ SEO gắn với SẢN PHẨM, không phải từng biến thể — nếu mỗi biến thể
// có URL riêng thì 3 trang sẽ trùng nội dung, đúng thứ Google phạt.
const SITE_URL = "https://bunquayphuquoc.com";

/* Bỏ dấu tiếng Việt và chuyển về kebab-case an toàn cho URL.
   "Bún Quậy Phú Quốc" -> "bun-quay-phu-quoc" */
function slugify(str) {
  const out = String(str === null || str === undefined ? "" : str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (out.length <= 80) return out;
  // Cắt ở ranh giới từ, đừng để URL kết thúc bằng nửa chữ ("...cho-du-kh").
  const cut = out.slice(0, 80);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 40 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, "");
}

/* Khoá gom nhóm: tên group, hoặc chính id nếu là món độc lập. */
function menuGroupKey(item) {
  const g = String((item && item.group) || "").trim();
  return g || ("__id__" + String((item && item.id) || ""));
}

/* Tên sản phẩm hiển thị: tên nhóm nếu có biến thể, không thì tên món. */
function menuProductName(item) {
  return String((item && item.group) || "").trim() || String((item && item.name) || "").trim();
}

/* Slug công khai của SẢN PHẨM: ưu tiên "Đường dẫn" admin đặt trong phần
   SEO, không có thì sinh từ tên sản phẩm, cuối cùng mới rơi về id. Món
   cũ chưa có trường slug vẫn ra URL đẹp mà không cần migration. */
function menuSlug(item) {
  if (!item) return "";
  return slugify(item.slug) || slugify(menuProductName(item)) || String(item.id || "");
}

/* Đường dẫn công khai — dùng chung cho trang chủ, trang chi tiết,
   sitemap và schema để mọi nơi trỏ về đúng một URL cho mỗi sản phẩm. */
function menuUrl(item) {
  const slug = menuSlug(item);
  if (slug) return "/mon/" + encodeURIComponent(slug);
  return "/mon?id=" + encodeURIComponent(String((item && item.id) || ""));
}

/* Tiêu đề trên Google / khi share. Để trống ô SEO thì tự dựng từ tên
   sản phẩm; chỉ chèn thêm "Phú Quốc" khi tên chưa có sẵn, tránh lặp
   thành "Bún Quậy Phú Quốc Phú Quốc | ...". */
function menuSeoTitle(item, siteName) {
  const custom = String((item && item.seoTitle) || "").trim();
  if (custom) return custom;
  const name = menuProductName(item);
  if (!name) return siteName || "";
  const withPlace = /phú quốc/i.test(name) ? name : name + " Phú Quốc";
  return siteName ? withPlace + " | " + siteName : withPlace;
}

/* Cắt gọn một đoạn văn về đúng độ dài thẻ meta, dừng ở ranh giới từ. */
function trimForMeta(text, max) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (raw.length <= max) return raw;
  const cut = raw.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-]+$/, "") + "…";
}

function menuSeoDesc(item, limit) {
  const custom = String((item && item.seoDesc) || "").trim();
  return custom || trimForMeta(item && item.desc, limit || 160);
}

// ── Bài viết: slug & SEO ──────────────────────────────────────────
// Bài viết không có biến thể nên mỗi bài là một URL, đơn giản hơn món.

/* Slug công khai của bài viết: ưu tiên "Đường dẫn" admin đặt trong phần
   SEO, không có thì sinh từ tiêu đề, cuối cùng mới rơi về id. Bài cũ
   chưa có trường slug vẫn ra URL đẹp mà không cần migration. */
function postSlug(post) {
  if (!post) return "";
  return slugify(post.slug) || slugify(post.title) || String(post.id || "");
}

function postUrl(post) {
  const slug = postSlug(post);
  if (slug) return "/bai-viet/" + encodeURIComponent(slug);
  return "/bai-viet?id=" + encodeURIComponent(String((post && post.id) || ""));
}

function postSeoTitle(post, siteName) {
  const custom = String((post && post.seoTitle) || "").trim();
  if (custom) return custom;
  const title = String((post && post.title) || "").trim();
  if (!title) return siteName || "";
  return siteName ? title + " | " + siteName : title;
}

function postSeoDesc(post, limit) {
  const custom = String((post && post.seoDesc) || "").trim();
  return custom || trimForMeta(post && post.excerpt, limit || 160);
}

// ── db.* CRUD ─────────────────────────────────────────────────────
const db = {
  posts: {
    getAll()       { return [..._mem.posts]; },
    getPublished() {
      return _mem.posts.filter((p) => p.published)
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    },
    getById(id) { return _mem.posts.find((p) => String(p.id) === String(id)) || null; },

    /* Tra bài theo đường dẫn /bai-viet/<slug>. So sánh bằng postSlug()
       nên khớp cả bài chưa có trường slug (slug suy từ tiêu đề). Không
       thấy thì thử tới slug cũ, để link đã share / đã được Google index
       không chết khi admin đổi Đường dẫn. */
    getBySlug(slug) {
      const want = slugify(slug);
      if (!want) return null;
      const hit = (list) => list.find((p) => postSlug(p) === want)
                         || list.find((p) => (p.slugAliases || []).indexOf(want) !== -1)
                         || null;
      return hit(_mem.posts.filter((p) => p.published)) || hit(_mem.posts);
    },

    /* Slug phải là duy nhất giữa các bài; trùng thì thêm -2, -3, ... */
    uniqueSlug(desired, excludeId) {
      const base = slugify(desired) || "bai-viet";
      let slug = base;
      let n = 2;
      while (_mem.posts.some((p) => String(p.id) !== String(excludeId) && postSlug(p) === slug)) {
        slug = base + "-" + n;
        n += 1;
      }
      return slug;
    },

    create(data) {
      const post = {
        // Giữ lại mọi trường form gửi lên (htmlFileUrl, ...) rồi mới
        // chuẩn hoá các trường bắt buộc — trước đây liệt kê cứng nên
        // bài mới có trang HTML độc lập bị mất luôn đường dẫn file.
        ...data,
        id: uid(), emoji: data.emoji || "📝", title: data.title || "",
        date: data.date || new Date().toLocaleDateString("vi-VN"),
        views: "0", excerpt: data.excerpt || "", content: data.content || "",
        tag: data.tag || "", tags: data.tags || [],
        published: data.published !== undefined ? data.published : true,
        featured: data.featured || false,
        seoTitle: String(data.seoTitle || "").trim(),
        seoDesc: String(data.seoDesc || "").trim(),
        slug: "",
      };
      post.slug = this.uniqueSlug(String(data.slug || "").trim() || post.title, post.id);
      _mem.posts.unshift(post);
      if (_useAPI) _apiPost("posts", "create", null, post);
      else writeJSON(DB_KEYS.posts, _mem.posts);
      return post;
    },

    update(id, data) {
      const idx = _mem.posts.findIndex((p) => String(p.id) === String(id));
      if (idx === -1) return null;
      const before = _mem.posts[idx];
      const next = { ...before, ...data };
      const has = (k) => Object.prototype.hasOwnProperty.call(data, k);

      /* Chỉ tính lại slug khi form thực sự gửi slug/tiêu đề, để các thao
         tác nhanh (ẩn/hiện, đánh dấu nổi bật, tăng lượt xem) không đổi URL. */
      if (has("slug") || has("title")) {
        const previous = postSlug(before);
        next.slug = has("slug")
          ? this.uniqueSlug(String(data.slug || "").trim() || next.title, id)
          : this.uniqueSlug(next.slug || next.title, id);
        if (previous && previous !== next.slug) {
          // Giữ tối đa 5 slug cũ để /bai-viet/<slug-cũ> vẫn mở được.
          next.slugAliases = [previous]
            .concat((next.slugAliases || []).filter((a) => a !== previous && a !== next.slug))
            .slice(0, 5);
        }
      }

      _mem.posts[idx] = next;
      if (_useAPI) _apiPost("posts", "update", id, next);
      else writeJSON(DB_KEYS.posts, _mem.posts);
      return next;
    },
    remove(id) {
      _mem.posts = _mem.posts.filter((p) => String(p.id) !== String(id));
      if (_useAPI) _apiPost("posts", "delete", id, {});
      else writeJSON(DB_KEYS.posts, _mem.posts);
    },
    incrementViews(id) {
      const idx = _mem.posts.findIndex((p) => String(p.id) === String(id));
      if (idx === -1) return;
      const cur = parseInt(String(_mem.posts[idx].views || "0").replace(/[.\s]/g, ""), 10) || 0;
      _mem.posts[idx].views = String(cur + 1);
      if (_useAPI) _apiPost("posts", "increment_views", id, {});
      else writeJSON(DB_KEYS.posts, _mem.posts);
    },
  },

  menu: {
    getAll()       { return [..._mem.menu]; },
    getAvailable() { return _mem.menu.filter((m) => m.available); },
    getById(id)    { return _mem.menu.find((m) => String(m.id) === String(id)) || null; },

    /* Mỗi SẢN PHẨM một đại diện (biến thể đầu tiên theo thứ tự thực đơn).
       Dùng cho trang chủ, "Món khác" và sitemap. */
    getProducts(includeUnavailable) {
      const src = includeUnavailable ? _mem.menu : _mem.menu.filter((m) => m.available);
      const seen = {};
      const out = [];
      src.forEach((m) => {
        const key = menuGroupKey(m);
        if (seen[key]) return;
        seen[key] = true;
        out.push(m);
      });
      return out;
    },

    /* Các biến thể cùng sản phẩm, giữ nguyên thứ tự thực đơn. */
    getVariants(item, includeUnavailable) {
      if (!item) return [];
      const key = menuGroupKey(item);
      const src = includeUnavailable ? _mem.menu : _mem.menu.filter((m) => m.available);
      const found = src.filter((m) => menuGroupKey(m) === key);
      return found.length ? found : [item];
    },

    /* Tra sản phẩm theo /mon/<slug>. Ưu tiên biến thể còn phục vụ để
       trang chi tiết mở ra đúng loại khách mua được; không thấy thì thử
       tới slug cũ, để link đã share / đã index không chết. */
    getBySlug(slug) {
      const want = slugify(slug);
      if (!want) return null;
      const hit = (list) => list.find((m) => menuSlug(m) === want)
                         || list.find((m) => (m.slugAliases || []).indexOf(want) !== -1)
                         || null;
      return hit(_mem.menu.filter((m) => m.available)) || hit(_mem.menu);
    },

    /* Tập id thuộc cùng một sản phẩm, gom theo một hoặc nhiều nhóm. */
    ownIds(groupKeys, extraId) {
      const keys = (groupKeys || []).filter(Boolean);
      const own = new Set();
      _mem.menu.forEach((m) => {
        if (keys.indexOf(menuGroupKey(m)) !== -1) own.add(String(m.id));
      });
      if (extraId !== null && extraId !== undefined) own.add(String(extraId));
      return own;
    },

    /* Slug phải là duy nhất giữa các SẢN PHẨM. Các biến thể cùng nhóm
       dùng chung slug nên không tính là trùng.
       `own` = mọi dòng thuộc chính sản phẩm này, tính cả nhóm CŨ lẫn
       nhóm MỚI: lúc đổi tên nhóm, các biến thể chưa kịp cập nhật vẫn
       mang nhóm cũ, không loại ra thì sản phẩm tự va chạm với chính nó
       và bị thêm hậu tố -2 vô cớ. */
    uniqueSlug(desired, own) {
      const base = slugify(desired) || "mon";
      const mine = own instanceof Set ? own : new Set();
      let slug = base;
      let n = 2;
      while (_mem.menu.some((m) => !mine.has(String(m.id)) && menuSlug(m) === slug)) {
        slug = base + "-" + n;
        n += 1;
      }
      return slug;
    },

    create(data) {
      const item = {
        id: uid(), emoji: data.emoji || "🍜", name: data.name || "",
        desc: data.desc || "", price: data.price || "", tag: data.tag || "",
        group: data.group || "",
        available: data.available !== undefined ? data.available : true,
        slug: "",
        seoTitle: String(data.seoTitle || "").trim(),
        seoDesc: String(data.seoDesc || "").trim(),
      };
      const groupKey = menuGroupKey(item);
      /* Thêm biến thể vào nhóm đã có -> dùng chung URL và thẻ SEO của
         sản phẩm đó, không sinh slug mới. */
      const sibling = String(item.group || "").trim()
        ? _mem.menu.find((m) => menuGroupKey(m) === groupKey)
        : null;
      if (sibling) {
        item.slug = sibling.slug || "";
        item.seoTitle = sibling.seoTitle || "";
        item.seoDesc = sibling.seoDesc || "";
        if (sibling.slugAliases) item.slugAliases = sibling.slugAliases.slice();
      } else {
        item.slug = this.uniqueSlug(String(data.slug || "").trim() || menuProductName(item), this.ownIds([groupKey], item.id));
      }
      _mem.menu.push(item);
      if (_useAPI) _apiPost("menu", "create", null, item);
      else writeJSON(DB_KEYS.menu, _mem.menu);
      return item;
    },

    update(id, data) {
      const idx = _mem.menu.findIndex((m) => String(m.id) === String(id));
      if (idx === -1) return null;
      const before = _mem.menu[idx];
      const next = { ...before, ...data };
      const has = (k) => Object.prototype.hasOwnProperty.call(data, k);
      const groupKey = menuGroupKey(next);

      /* Chỉ tính lại slug khi form thực sự gửi slug/tên/nhóm, để thao tác
         nhanh (bật/tắt "Còn hàng", sắp xếp) không làm đổi URL. */
      if (has("slug") || has("name") || has("group")) {
        const previous = menuSlug(before);
        const own = this.ownIds([menuGroupKey(before), groupKey], id);
        next.slug = has("slug")
          ? this.uniqueSlug(String(data.slug || "").trim() || menuProductName(next), own)
          : this.uniqueSlug(next.slug || menuProductName(next), own);
        if (previous && previous !== next.slug) {
          // Giữ tối đa 5 slug cũ để /mon/<slug-cũ> vẫn mở được.
          next.slugAliases = [previous]
            .concat((next.slugAliases || []).filter((a) => a !== previous && a !== next.slug))
            .slice(0, 5);
        }
      }

      _mem.menu[idx] = next;
      if (_useAPI) _apiPost("menu", "update", id, next);

      /* URL và thẻ SEO thuộc về sản phẩm, nên chép sang mọi biến thể
         cùng nhóm — sửa ở biến thể nào cũng ra kết quả như nhau. */
      if (String(next.group || "").trim() && (has("slug") || has("seoTitle") || has("seoDesc") || has("name") || has("group"))) {
        _mem.menu.forEach((m, i) => {
          if (i === idx || menuGroupKey(m) !== groupKey) return;
          const synced = {
            ...m,
            slug: next.slug || "",
            seoTitle: next.seoTitle || "",
            seoDesc: next.seoDesc || "",
            slugAliases: (next.slugAliases || []).slice(),
          };
          _mem.menu[i] = synced;
          if (_useAPI) _apiPost("menu", "update", synced.id, synced);
        });
      }

      if (!_useAPI) writeJSON(DB_KEYS.menu, _mem.menu);
      return _mem.menu[idx];
    },
    remove(id) {
      _mem.menu = _mem.menu.filter((m) => String(m.id) !== String(id));
      if (_useAPI) _apiPost("menu", "delete", id, {});
      else writeJSON(DB_KEYS.menu, _mem.menu);
    },
    // Sắp xếp lại theo thứ tự id truyền vào; món nào thiếu được giữ ở cuối.
    reorder(orderedIds) {
      const byId = {};
      _mem.menu.forEach((m) => { byId[String(m.id)] = m; });
      const seen = {};
      const next = [];
      (orderedIds || []).forEach((id) => {
        const key = String(id);
        if (byId[key] && !seen[key]) { next.push(byId[key]); seen[key] = true; }
      });
      _mem.menu.forEach((m) => { if (!seen[String(m.id)]) next.push(m); });
      _mem.menu = next;
      if (_useAPI) _apiPost("menu", "reorder", null, { ids: next.map((m) => m.id) });
      else writeJSON(DB_KEYS.menu, _mem.menu);
      return [..._mem.menu];
    },
  },

  reservations: {
    getAll() { return [..._mem.reservations]; },
    create(data) {
      const item = {
        name: data.name || "", phone: data.phone || "", email: data.email || "",
        guests: data.guests || "", message: data.message || "",
        date: data.date || "", time: data.time || "",
        id: uid(), createdAt: new Date().toISOString(), status: "new",
      };
      _mem.reservations.unshift(item);
      if (_useAPI) _apiPost("reservations", "create", null, item);
      else writeJSON(DB_KEYS.reservations, _mem.reservations);
      return item;
    },
    /* Awaited create for the public booking form: resolves {ok:true}
       only after the server accepts the booking; on rejection (e.g. the
       server-side anti-spam / duplicate check) resolves {ok:false,error}
       so the form can show the real reason instead of a fake "success". */
    createAsync(data) {
      const item = {
        name: data.name || "", phone: data.phone || "", email: data.email || "",
        guests: data.guests || "", message: data.message || "",
        date: data.date || "", time: data.time || "",
        id: uid(), createdAt: new Date().toISOString(), status: "new",
      };
      if (!_useAPI) {
        _mem.reservations.unshift(item);
        writeJSON(DB_KEYS.reservations, _mem.reservations);
        return Promise.resolve({ ok: true, item });
      }
      return _apiPostAwait("reservations", "create", null, item)
        .then(() => { _mem.reservations.unshift(item); return { ok: true, item }; })
        .catch((e) => ({ ok: false, error: (e && e.message) || "Có lỗi xảy ra, vui lòng thử lại." }));
    },
    updateStatus(id, status) {
      const idx = _mem.reservations.findIndex((r) => String(r.id) === String(id));
      if (idx === -1) return null;
      _mem.reservations[idx].status = status;
      if (_useAPI) _apiPost("reservations", "update_status", id, { status });
      else writeJSON(DB_KEYS.reservations, _mem.reservations);
      return _mem.reservations[idx];
    },
    remove(id) {
      _mem.reservations = _mem.reservations.filter((r) => String(r.id) !== String(id));
      if (_useAPI) _apiPost("reservations", "delete", id, {});
      else writeJSON(DB_KEYS.reservations, _mem.reservations);
    },
  },

  reviews: {
    get()     { return _mem.reviews || (typeof REVIEWS_SEED !== "undefined" ? REVIEWS_SEED : {}); },
    set(data) {
      _mem.reviews = data;
      if (_useAPI) _apiPost("reviews", "update", null, data);
      else writeJSON(DB_KEYS.reviews, data);
    },
  },

  faqs: {
    getAll() { return [..._mem.faqs]; },
    create(data) {
      const item = { id: uid(), q: data.q || "", a: data.a || "" };
      _mem.faqs.push(item);
      if (_useAPI) _apiPost("faqs", "create", null, item);
      else writeJSON(DB_KEYS.faqs, _mem.faqs);
      return item;
    },
    update(id, data) {
      const idx = _mem.faqs.findIndex((f) => String(f.id) === String(id));
      if (idx === -1) return null;
      _mem.faqs[idx] = { ..._mem.faqs[idx], ...data };
      if (_useAPI) _apiPost("faqs", "update", id, _mem.faqs[idx]);
      else writeJSON(DB_KEYS.faqs, _mem.faqs);
      return _mem.faqs[idx];
    },
    remove(id) {
      _mem.faqs = _mem.faqs.filter((f) => String(f.id) !== String(id));
      if (_useAPI) _apiPost("faqs", "delete", id, {});
      else writeJSON(DB_KEYS.faqs, _mem.faqs);
    },
  },

  settings: {
    get() { return { ..._mem.settings }; },
    update(data) {
      const merged = { ..._mem.settings, ...data };
      _mem.settings = merged;
      if (_useAPI) _apiPost("settings", "update", null, merged);
      else writeJSON(DB_KEYS.settings, merged);
      return merged;
    },
  },

  users: {
    getAll()           { return [..._mem.users]; },
    getById(id)        { return _mem.users.find((u) => String(u.id) === String(id)) || null; },
    getByUsername(un)  { return _mem.users.find((u) => u.username === un) || null; },
    create(data) {
      const item = {
        id: uid(), username: data.username || "", name: data.name || "",
        password: data.password || "", role: data.role || "viewer",
        createdAt: new Date().toISOString(),
      };
      _mem.users.push(item);
      if (_useAPI) _apiPost("users", "create", null, item);
      else writeJSON(DB_KEYS.users, _mem.users);
      return item;
    },
    update(id, data) {
      const idx = _mem.users.findIndex((u) => String(u.id) === String(id));
      if (idx === -1) return null;
      _mem.users[idx] = { ..._mem.users[idx], ...data };
      if (_useAPI) _apiPost("users", "update", id, _mem.users[idx]);
      else writeJSON(DB_KEYS.users, _mem.users);
      return _mem.users[idx];
    },
    remove(id) {
      _mem.users = _mem.users.filter((u) => String(u.id) !== String(id));
      if (_useAPI) _apiPost("users", "delete", id, {});
      else writeJSON(DB_KEYS.users, _mem.users);
    },
  },
};

// ── Roles & Permissions ────────────────────────────────────────────
const ROLES = ["admin", "editor", "viewer"];
const ROLE_LABELS = { admin: "Quản trị viên", editor: "Biên tập viên", viewer: "Người xem" };
const ROLE_COLORS = {
  admin:  { color: "#1a5276", bg: "#d6eaf8" },
  editor: { color: "#b7770d", bg: "#fef9e7" },
  viewer: { color: "#16a34a", bg: "#f0fdf4" },
};
const PERMISSIONS = {
  admin:  ["posts", "menu", "reservations", "reviews", "faqs", "settings", "users"],
  editor: ["posts", "menu", "reservations", "reviews", "faqs"],
  viewer: ["posts", "menu", "reservations", "reviews", "faqs"],
};
function hasPermission(role, area) { return (PERMISSIONS[role] || []).includes(area); }
function canEdit(role) { return role === "admin" || role === "editor"; }

// ── Password hashing (SHA-256 via Web Crypto API) ──────────────────
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isPasswordHashed(pw) { return typeof pw === "string" && /^[0-9a-f]{64}$/.test(pw); }

// ── auth.* ────────────────────────────────────────────────────────
const auth = {
  async login(username, password) {
    if (_useAPI) {
      try {
        const res = await fetch(_API_URL + "?action=login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const u = await res.json().catch(() => null);
        // Trả về {error} để form hiện đúng lý do (VD bị khoá vì sai nhiều lần).
        if (!res.ok || !u || u.error) {
          return { error: (u && u.error) || "Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu." };
        }
        const session = { id: u.id, username: u.username, name: u.name, role: u.role };
        sessionStorage.setItem(DB_KEYS.session, JSON.stringify(session));
        return session;
      } catch { return { error: "Không kết nối được máy chủ. Vui lòng thử lại." }; }
    }
    // localStorage fallback
    const user = db.users.getByUsername(username);
    if (!user) return null;
    const hashed = await hashPassword(password);
    if (isPasswordHashed(user.password)) {
      if (user.password !== hashed) return null;
    } else {
      if (user.password !== password) return null;
      db.users.update(user.id, { password: hashed });
    }
    const session = { id: user.id, username: user.username, name: user.name, role: user.role };
    sessionStorage.setItem(DB_KEYS.session, JSON.stringify(session));
    return session;
  },
  logout() {
    sessionStorage.removeItem(DB_KEYS.session);
    if (_useAPI) fetch(_API_URL + "?action=logout", { method: "POST" }).catch(() => {});
  },
  getCurrentUser() {
    try { const raw = sessionStorage.getItem(DB_KEYS.session); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  },
  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) { window.location.href = "login.html"; return null; }
    return user;
  },
};

// ── CSV export ─────────────────────────────────────────────────────
function exportCsv(filename, rows, headers) {
  const BOM = "﻿";
  const lines = [headers.map((h) => h.label).join(",")];
  rows.forEach((row) => {
    const cells = headers.map((h) => `"${String(row[h.key] ?? "").replace(/"/g, '""')}"`);
    lines.push(cells.join(","));
  });
  const blob = new Blob([BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Async bootstrap (opt-in, public pages only) ────────────────────
// Public pages set window.__ASYNC_INIT__ = true in an inline <script>
// before this file loads, so the initial data fetch doesn't block
// rendering (better Core Web Vitals / SEO crawlability). Admin pages
// don't set the flag and keep the original synchronous behavior below
// completely unchanged.
async function _apiGetAsync(qs) {
  const res = await fetch(_API_URL + "?" + qs);
  if (res.status === 200) return res.json();
  return null;
}

/* ── Nạp seed theo yêu cầu ─────────────────────────────────────────
   data.js + data-posts.js + data-reservations.js (~96KB) chỉ dùng để
   khởi tạo DB rỗng lần đầu, nhưng trước đây trang công khai nào cũng
   phải tải và parse chúng. Giờ chỉ nạp khi thật sự cần seed (DB trống
   hoặc chạy dev không có api.php). Trang admin vẫn nhúng sẵn bằng thẻ
   <script> vì chúng dùng đường khởi tạo đồng bộ, không await được. */
let _seedScriptsPromise = null;

function _loadSeedScripts() {
  if (typeof SETTINGS_SEED !== "undefined") return Promise.resolve();
  if (_seedScriptsPromise) return _seedScriptsPromise;

  const files = ["data.js", "data-posts.js", "data-reservations.js"];
  _seedScriptsPromise = files.reduce(
    (chain, file) => chain.then(() => new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = "/assets/js/" + file;
      el.onload = resolve;
      el.onerror = resolve; // thiếu file seed thì vẫn chạy tiếp với mặc định
      document.head.appendChild(el);
    })),
    Promise.resolve()
  );
  return _seedScriptsPromise;
}

/* ── Cache dữ liệu trong phiên ─────────────────────────────────────
   api.php?action=init trả về toàn bộ DB (~64KB) và bị đánh dấu
   no-store, nên trước đây mỗi lần chuyển trang / chuyển món đều phải
   tải lại từ đầu, và vùng nội dung để trắng cho tới khi tải xong.
   Giữ lại bản chụp trong sessionStorage (theo tab) để lần chuyển trang
   sau render ngay lập tức, rồi làm mới ngầm cho lần sau nữa. */
const DB_CACHE_KEY = "dsp_db_cache";
const DB_CACHE_TTL = 60000; // 60 giây

function _readDbCache() {
  try {
    const raw = sessionStorage.getItem(DB_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || !entry.at || !entry.data) return null;
    if (Date.now() - entry.at > DB_CACHE_TTL) return null;
    if (!entry.data.settings || Object.keys(entry.data.settings).length === 0) return null;
    return entry.data;
  } catch (e) { return null; }
}

function _writeDbCache(data) {
  try { sessionStorage.setItem(DB_CACHE_KEY, JSON.stringify({ at: Date.now(), data })); }
  catch (e) { /* hết quota hoặc chế độ riêng tư — bỏ qua, chỉ mất tốc độ */ }
}

/* Mọi thao tác ghi đều xoá cache để admin sửa xong là thấy ngay,
   không phải chờ hết TTL. */
function _clearDbCache() {
  try { sessionStorage.removeItem(DB_CACHE_KEY); } catch (e) {}
}

async function _seedViaAPIAsync() {
  await _loadSeedScripts();
  const seed = {
    settings:     (typeof SETTINGS_SEED     !== "undefined" ? SETTINGS_SEED     : {}),
    menu:         (typeof MENU_SEED         !== "undefined" ? MENU_SEED         : []),
    posts:        (typeof POSTS_SEED        !== "undefined" ? POSTS_SEED        : []),
    reservations: (typeof RESERVATIONS_SEED !== "undefined" ? RESERVATIONS_SEED : []),
    reviews:      (typeof REVIEWS_SEED      !== "undefined" ? REVIEWS_SEED      : { reviews: [], rating: 4.8, totalRatings: 0 }),
    faqs:         (typeof FAQS_SEED         !== "undefined" ? FAQS_SEED         : []),
    users:        (typeof USERS_SEED        !== "undefined" ? USERS_SEED        : []),
  };
  const res = await fetch(_API_URL + "?action=seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(seed),
  });
  if (res.status === 200) { _mem = seed; _useAPI = true; _writeDbCache(seed); }
  else { _useAPI = false; _initLocalStorage(); }
}

/* Tải lại dữ liệu ngầm sau khi đã render từ cache. Không chặn gì cả:
   DOM đang hiện giữ nguyên, bản mới phục vụ lần chuyển trang kế. */
async function _revalidateDB() {
  try {
    const data = await _apiGetAsync("action=init");
    if (data && data.settings && Object.keys(data.settings).length > 0) {
      _mem = data;
      _writeDbCache(data);
    }
  } catch (e) { /* mạng chập chờn — vẫn dùng bản cache */ }
}

async function initDBAsync() {
  // Chuyển trang trong cùng tab: có cache thì render ngay, khỏi chờ mạng.
  const cached = _readDbCache();
  if (cached) {
    _mem = cached;
    _useAPI = true;
    window.dbFresh = _revalidateDB();
    return;
  }

  window.dbFresh = Promise.resolve();
  try {
    const data = await _apiGetAsync("action=init");
    if (data && data.seeded === false) { await _seedViaAPIAsync(); return; }
    if (data && data.settings && Object.keys(data.settings).length > 0) {
      _mem = data; _useAPI = true; _writeDbCache(data); return;
    }
  } catch (e) { /* api.php không tồn tại — dev mode */ }
  _useAPI = false;
  await _loadSeedScripts();
  _initLocalStorage();
}

// ── Bootstrap ──────────────────────────────────────────────────────
if (typeof window !== "undefined" && window.__ASYNC_INIT__) {
  window.dbReady = initDBAsync();
} else {
  initDB();
}
