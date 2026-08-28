# Patch PHP cho URL `/mon/<slug>`

Các file `*.php` ở gốc `static-site/` (`mon.php`, `api.php`, `sitemap.php`,
`bai-viet.php`) **không nằm trong repo** — chúng bị `.gitignore` chặn vì có
nhúng mật khẩu MariaDB thật. Vì vậy phần server của tính năng này được đóng gói
thành helper dùng chung ([`seo-slug.php`](seo-slug.php)) + hướng dẫn sửa tay
dưới đây. Toàn bộ phần client (JS/HTML/admin) đã xong trong repo.

Logic trong `seo-slug.php` khớp 1-1 với `assets/js/storage.js`, nên server và
trình duyệt luôn sinh ra cùng một URL cho cùng một món.

---

## 1. `mon.php` — bắt buộc

Đây là thay đổi duy nhất **bắt buộc**: bot Google/Facebook/Zalo không chạy JS,
nên `mon.php` phải tự resolve slug và render sẵn thẻ meta.

### 1.1 Nạp helper (đầu file)

```php
require_once __DIR__ . '/php-patch/seo-slug.php';
```

### 1.2 Thay chỗ đang đọc `$_GET['id']`

`$menu` là mảng tất cả các món đã `json_decode` từ cột `menu`.`data`
(chính là dữ liệu `mon.php` đang dùng để tìm món theo id).

```php
$slug = isset($_GET['slug']) ? $_GET['slug'] : '';
$id   = isset($_GET['id'])   ? $_GET['id']   : '';

// Tìm theo slug hiện tại -> slug cũ (slugAliases) -> id
$item = bq_menu_find($menu, $slug, $id);

// Vào bằng URL cũ (/mon?id=... hoặc slug cũ) -> 301 sang URL chuẩn
// hiện tại, để Google gộp tất cả về một URL duy nhất.
// Điều kiện so sánh cũng chính là chốt chặn lặp vô hạn: đang ở đúng
// URL chuẩn thì hai vế bằng nhau và không redirect nữa.
if ($item && bq_slugify($slug) !== bq_menu_slug($item)) {
    header('Location: ' . bq_menu_url($item), true, 301);
    exit;
}

if (!$item) {
    http_response_code(404);   // slug sai -> trả 404 thật, đừng trả 200
}
```

### 1.3 Thay chỗ đang in thẻ meta

```php
$canonical = bq_menu_abs_url($item);
$seoTitle  = bq_menu_seo_title($item, $siteName);   // $siteName lấy từ settings
$seoDesc   = bq_menu_seo_desc($item);               // tự cắt ~160 ký tự
```

Rồi dùng `$seoTitle` / `$seoDesc` / `$canonical` cho `<title>`,
`meta[name=description]`, `link[rel=canonical]`, `og:title`, `og:description`,
`og:url`, `twitter:*` và trường `url` trong JSON-LD.

> Hiện tại `mon.php` đang đổ **nguyên mô tả món** (nhiều đoạn, vài trăm ký tự)
> vào `description`/`og:description`. `bq_menu_seo_desc()` thay thế đúng chỗ đó:
> ưu tiên ô **Mô tả** trong phần SEO của món, không có thì cắt gọn mô tả.

### 1.4 `.htaccess`

Copy 2 dòng rewrite mới từ [`../.htaccess.example`](../.htaccess.example) sang
`.htaccess` thật (đặt **trước** rule `^([^.]+)$ $1.html`):

```apache
RewriteRule ^mon/([^/]+)/?$ mon.php?slug=$1 [L,QSA]
RewriteRule ^mon/?$ mon.php [L,QSA]
```

---

## 2. `sitemap.php` — nên làm

Sitemap hiện chỉ có trang chủ, blog, thư viện ảnh và các bài viết. Thêm từng
món để Google index được các landing page mới:

```php
foreach ($menu as $item) {
    if (empty($item['available'])) continue;
    echo "  <url>\n";
    echo "    <loc>" . htmlspecialchars(bq_menu_abs_url($item), ENT_XML1) . "</loc>\n";
    echo "    <changefreq>monthly</changefreq>\n";
    echo "    <priority>0.7</priority>\n";
    echo "  </url>\n";
}
```

---

## 3. `api.php` — thường **không cần sửa**

Bảng `menu` và `settings` lưu nguyên object JSON trong cột `data`, còn client
gửi lên full object, nên 4 trường mới của món (`slug`, `slugAliases`, `seoTitle`,
`seoDesc`)
và 4 trường Code Scripts của settings (`scriptGoogleAnalytics`,
`scriptGoogleRemarketing`, `scriptFacebookPixel`, `scriptLivechat`) sẽ tự được
lưu.

**Cần kiểm tra:** nếu `api.php` có whitelist field trước khi `json_encode`
(kiểu `$item = ['id'=>..., 'name'=>..., 'desc'=>...]`) thì phải bổ sung các
trường mới vào danh sách đó, nếu không admin lưu xong sẽ mất dữ liệu.

Cách thử nhanh sau khi deploy: vào **Thực đơn → sửa 1 món → nhập Đường dẫn →
Lưu → F5**. Nếu ô Đường dẫn vẫn còn giá trị thì `api.php` không cần sửa.

---

## 3b. `api.php?action=init` — nên thu gọn payload (tuỳ chọn)

Hiện `action=init` trả về **toàn bộ** database cho mọi trang công khai:

| Phần | Dung lượng | Trang món có dùng không? |
|------|-----------:|--------------------------|
| `posts` (kèm full HTML bài viết) | ~52 KB | ❌ |
| `menu` | ~5,5 KB | ✅ |
| `settings` | ~4 KB | ✅ |
| `reviews` + `faqs` | ~3,3 KB | ❌ |
| `users` | ~0,1 KB | ❌ |

Tổng ~64 KB (24 KB sau gzip) cho mỗi lượt xem trang, trong đó riêng 1 bài viết
đã chiếm 41 KB. Phía client đã được vá (xem mục dưới) nên chỉ còn tải 1 lần mỗi
phiên, nhưng cắt bớt ở server vẫn đáng làm:

```php
// ?action=init&scope=public  -> bỏ users, và chỉ trả excerpt của bài viết
$scope = isset($_GET['scope']) ? $_GET['scope'] : '';
if ($scope === 'public') {
    unset($out['users']);
    foreach ($out['posts'] as &$p) { unset($p['content']); }
    unset($p);
}
```

Kèm theo đó, `bai-viet.php` / `post.js` cần lấy nội dung bài riêng khi mở bài
(`?action=post&id=...`) thay vì trông chờ vào payload init.

`users` cũng không nên nằm trong payload công khai. Hiện `api.php` đã lọc bỏ
trường `password` (đã kiểm tra) nên **không lộ mật khẩu**, nhưng tên đăng nhập
và vai trò của tài khoản quản trị vẫn hiện ra với mọi khách — không cần thiết.

### Phía client đã làm gì (không cần sửa PHP)

`assets/js/storage.js` giờ chụp lại payload init vào `sessionStorage` (TTL 60
giây, tự xoá mỗi khi có thao tác ghi). Lần chuyển trang / chuyển món kế tiếp
trong cùng tab sẽ render ngay từ bản chụp rồi mới làm mới ngầm, nên không còn
cảnh vùng nội dung để trắng chờ mạng.

---

## 4. Checklist nghiệm thu

| # | Việc | Kỳ vọng |
|---|------|---------|
| 1 | Mở `/mon/bun-quay-phu-quoc` | Trang món hiện đúng, không 404 |
| 2 | Mở `/mon?id=17848842917841kqr3a` | 301 sang `/mon/<slug>` |
| 2b | Đổi Đường dẫn 1 món rồi mở slug cũ | 301 sang slug mới |
| 3 | `curl -s /mon/<slug> \| grep canonical` | Trỏ về chính URL slug |
| 4 | Xem nguồn trang, tìm `og:title` | Đúng Tiêu đề SEO đã nhập |
| 5 | Trang chủ → bấm 1 món | Điều hướng sang URL slug |
| 6 | `/mon/khong-co-that` | Trả HTTP 404 |
| 7 | Facebook Sharing Debugger với URL slug | Hiện đúng ảnh + tiêu đề |
