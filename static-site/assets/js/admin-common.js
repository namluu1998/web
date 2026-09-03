/* ===================================================================
   admin-common.js — shared sidebar/layout, auth guard, helpers
   for all admin pages (except login.html)
=================================================================== */

const ADMIN_NAV = [
  { href: "dashboard.html", label: "Dashboard", icon: "📊", exact: true },
  { href: "bai-viet.html", label: "Bài viết", icon: "📝", area: "posts" },
  { href: "chuyen-doi-html.html", label: "Chuyển HTML", icon: "🔄", area: "posts" },
  { href: "thuc-don.html", label: "Thực đơn", icon: "🍜", area: "menu" },
  { href: "dat-ban.html", label: "Đặt bàn", icon: "📋", area: "reservations" },
  { href: "danh-gia.html", label: "Đánh giá", icon: "⭐", area: "reviews" },
  { href: "anh.html", label: "Góc Ảnh Quán", icon: "🖼️", area: "gallery" },
  { href: "cai-dat.html", label: "Cài đặt", icon: "⚙️", area: "settings", adminOnly: true },
  { href: "users.html", label: "Người dùng", icon: "👥", area: "users", adminOnly: true },
];

/**
 * Renders the admin sidebar/topbar shell into the page and enforces auth.
 * Returns the current user, or null (and redirects to login) if not authed.
 */
function initAdminLayout(activeHref) {
  const user = auth.requireAuth();
  if (!user) return null;

  const navHtml = ADMIN_NAV.filter((item) => !item.adminOnly || user.role === "admin")
    .map((item) => {
      const isActive = item.href === activeHref;
      return `<a href="${item.href}"${isActive ? ' class="active"' : ""}>${item.icon} <span>${item.label}</span></a>`;
    })
    .join("");

  const navEl = document.getElementById("admin-nav");
  if (navEl) navEl.innerHTML = navHtml;

  const initial = (user.name || user.username || "?").trim().charAt(0).toUpperCase();
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.viewer;
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const userBox = document.getElementById("admin-user-box");
  if (userBox) {
    userBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;">
        <div style="width:2.25rem;height:2.25rem;border-radius:9999px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">${escapeHtml(initial)}</div>
        <div style="min-width:0;">
          <div style="font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(user.name || user.username)}</div>
          <span class="badge" style="color:${roleColor.color};background:${roleColor.bg};">${escapeHtml(roleLabel)}</span>
        </div>
      </div>
      <a href="../index.html" target="_blank" style="display:block;color:#d8e4ee;text-decoration:none;font-size:0.85rem;margin-bottom:0.5rem;">🌐 Xem trang web</a>
      <button id="admin-logout-btn" class="btn-admin-outline" style="width:100%;">🚪 Đăng xuất</button>
    `;
    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        auth.logout();
        window.location.href = "login.html";
      });
    }
  }

  const menuToggle = document.getElementById("admin-menu-toggle");
  const sidebar = document.getElementById("admin-sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  return user;
}

/**
 * Shows a toast notification (success/error/info).
 */
function showToast(message, type) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast" + (type ? ` ${type}` : "");
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

/**
 * Hộp xác nhận đẹp trong trang, trả về Promise<boolean>.
 * Dùng thay confirm() mặc định (dễ bị trình duyệt chặn + giao diện xấu).
 *   if (await confirmDialog("Xoá?")) { ... }
 */
function confirmDialog(message, opts) {
  opts = opts || {};
  const confirmText = opts.confirmText || "Xoá";
  const cancelText = opts.cancelText || "Huỷ";
  const danger = opts.danger !== false; // mặc định nút xác nhận màu đỏ
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:1rem;";
    const box = document.createElement("div");
    box.style.cssText = "background:#fff;border-radius:1rem;max-width:22rem;width:100%;padding:1.5rem;box-shadow:0 12px 40px rgba(0,0,0,.25);";
    box.innerHTML =
      '<p style="font-size:.95rem;color:#374151;line-height:1.5;margin:0 0 1.25rem;"></p>' +
      '<div style="display:flex;gap:.5rem;justify-content:flex-end;">' +
        '<button data-c="cancel" style="padding:.5rem 1rem;border-radius:.5rem;border:1px solid #e5e7eb;background:#fff;color:#374151;font-weight:600;cursor:pointer;"></button>' +
        '<button data-c="ok" style="padding:.5rem 1rem;border-radius:.5rem;border:none;color:#fff;font-weight:600;cursor:pointer;background:' + (danger ? "#dc2626" : "#e07b39") + ';"></button>' +
      '</div>';
    box.querySelector("p").textContent = message;
    box.querySelector('[data-c="cancel"]').textContent = cancelText;
    box.querySelector('[data-c="ok"]').textContent = confirmText;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const close = (val) => { overlay.remove(); document.removeEventListener("keydown", onKey); resolve(val); };
    const onKey = (e) => { if (e.key === "Escape") close(false); };
    box.querySelector('[data-c="cancel"]').addEventListener("click", () => close(false));
    box.querySelector('[data-c="ok"]').addEventListener("click", () => close(true));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
    document.addEventListener("keydown", onKey);
    box.querySelector('[data-c="ok"]').focus();
  });
}

/**
 * Pagination helper — returns the page-number array (with truncation),
 * and renders pagination buttons into the given container.
 */
function renderPagination(container, current, total, onPageChange) {
  if (!container) return;
  if (total <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  html += `<button ${current === 1 ? "disabled" : ""} data-page="${current - 1}">‹</button>`;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) {
      html += `<button class="${i === current ? "active" : ""}" data-page="${i}">${i}</button>`;
    } else if (i === current - 2 || i === current + 2) {
      html += `<span style="padding:0 0.25rem;color:#9ca3af;">…</span>`;
    }
  }
  html += `<button ${current === total ? "disabled" : ""} data-page="${current + 1}">›</button>`;

  container.innerHTML = html;
  container.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.getAttribute("data-page"), 10);
      if (page >= 1 && page <= total && page !== current) onPageChange(page);
    });
  });
}

/**
 * Reads a File object as a base64 data URL (used in lieu of /api/admin/upload).
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
