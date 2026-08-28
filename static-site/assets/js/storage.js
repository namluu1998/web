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

// ── db.* CRUD ─────────────────────────────────────────────────────
const db = {
  posts: {
    getAll()       { return [..._mem.posts]; },
    getPublished() {
      return _mem.posts.filter((p) => p.published)
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    },
    getById(id) { return _mem.posts.find((p) => String(p.id) === String(id)) || null; },
    create(data) {
      const post = {
        id: uid(), emoji: data.emoji || "📝", title: data.title || "",
        date: data.date || new Date().toLocaleDateString("vi-VN"),
        views: "0", excerpt: data.excerpt || "", content: data.content || "",
        tag: data.tag || "", tags: data.tags || [],
        published: data.published !== undefined ? data.published : true,
        featured: data.featured || false,
      };
      _mem.posts.unshift(post);
      if (_useAPI) _apiPost("posts", "create", null, post);
      else writeJSON(DB_KEYS.posts, _mem.posts);
      return post;
    },
    update(id, data) {
      const idx = _mem.posts.findIndex((p) => String(p.id) === String(id));
      if (idx === -1) return null;
      _mem.posts[idx] = { ..._mem.posts[idx], ...data };
      if (_useAPI) _apiPost("posts", "update", id, _mem.posts[idx]);
      else writeJSON(DB_KEYS.posts, _mem.posts);
      return _mem.posts[idx];
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
    create(data) {
      const item = {
        id: uid(), emoji: data.emoji || "🍜", name: data.name || "",
        desc: data.desc || "", price: data.price || "", tag: data.tag || "",
        group: data.group || "",
        available: data.available !== undefined ? data.available : true,
      };
      _mem.menu.push(item);
      if (_useAPI) _apiPost("menu", "create", null, item);
      else writeJSON(DB_KEYS.menu, _mem.menu);
      return item;
    },
    update(id, data) {
      const idx = _mem.menu.findIndex((m) => String(m.id) === String(id));
      if (idx === -1) return null;
      _mem.menu[idx] = { ..._mem.menu[idx], ...data };
      if (_useAPI) _apiPost("menu", "update", id, _mem.menu[idx]);
      else writeJSON(DB_KEYS.menu, _mem.menu);
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

async function _seedViaAPIAsync() {
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
  if (res.status === 200) { _mem = seed; _useAPI = true; }
  else { _useAPI = false; _initLocalStorage(); }
}

async function initDBAsync() {
  try {
    const data = await _apiGetAsync("action=init");
    if (data && data.seeded === false) { await _seedViaAPIAsync(); return; }
    if (data && data.settings && Object.keys(data.settings).length > 0) {
      _mem = data; _useAPI = true; return;
    }
  } catch (e) { /* api.php không tồn tại — dev mode */ }
  _useAPI = false;
  _initLocalStorage();
}

// ── Bootstrap ──────────────────────────────────────────────────────
if (typeof window !== "undefined" && window.__ASYNC_INIT__) {
  window.dbReady = initDBAsync();
} else {
  initDB();
}
