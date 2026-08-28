# Patch PHP cho URL `/mon/<slug>`

Các file `*.php` ở gốc `static-site/` (`mon.php`, `api.php`, `sitemap.php`,
`bai-viet.php`) **không nằm trong repo** — chúng bị `.gitignore` chặn vì có
nhúng mật khẩu MariaDB thật. Vì vậy phần server của tính năng này được đóng gói
thành helper dùng chung ([`seo-slug.php`](seo-slug.php)) + hướng dẫn sửa tay
dưới đây. Toàn bộ phần client (JS/HTML/admin) đã xong trong repo.

Logic trong `seo-slug.php` khớp 1-1 với `assets/js/storage.js`, nên server và
trình duyệt luôn sinh ra cùng một URL cho cùng một món.

---

## 0. Mô hình dữ liệu: sản phẩm ↔ biến thể

Các dòng trong bảng `menu` cùng giá trị `group` là **biến thể của một sản
phẩm**. Dữ liệu thật hiện có 8 dòng = 4 sản phẩm:

| Sản phẩm (`group`) | Biến thể |
|---|---|
| Bún Quậy Phú Quốc | Thường · Tô Đặc Biệt · Tô Thượng Hạng |
| MẮT CÁ NGỪ ĐẠI DƯƠNG PHÚ QUỐC | Bình thường · MỰC · GÂN CÁ |
| Bún Rạm | *(không nhóm)* |
| Nước Mía | *(không nhóm)* |

**Slug và thẻ SEO gắn với SẢN PHẨM, không phải từng biến thể.** Nếu mỗi
biến thể có URL riêng thì 3 trang sẽ trùng nội dung — đúng thứ cần tránh.
`/mon/bun-quay-phu-quoc` là một URL duy nhất, mở ra bộ chọn biến thể.

Phía admin, sửa SEO ở biến thể nào cũng được: `db.menu.update()` tự chép
`slug` / `seoTitle` / `seoDesc` sang mọi biến thể cùng nhóm.

---

## 1. `mon.php` — bắt buộc

Đã có sẵn bản vá hoàn chỉnh: **[`mon.php.template`](mon.php.template)**.

1. Mở `mon.php` đang chạy trên server, copy 3 giá trị kết nối DB.
2. Dán vào `___TEN_DATABASE___`, `___TEN_USER___`, `___MAT_KHAU___` trong
   template (template cố ý không chứa mật khẩu thật vì nằm trong repo).
3. Upload đè lên `mon.php`, và upload cả thư mục `php-patch/` (chứa
   `seo-slug.php`) đặt cạnh nó.

Bản vá thay đổi đúng 3 chỗ so với file đang chạy:

- Nhận thêm `?slug=`, đọc cả thực đơn rồi resolve qua `bq_menu_find()`
  (slug hiện tại → slug cũ trong `slugAliases` → id), trả về biến thể
  còn phục vụ đầu tiên.
- 301 từ URL cũ (`?id=` hoặc slug cũ) sang URL chuẩn của sản phẩm; slug
  sai trả HTTP 404 thật thay vì 200.
- `title` / `description` / `canonical` / `og:*` lấy từ helper. Việc này
  cũng sửa luôn lỗi tiêu đề đang lặp — nhóm tên "Bún Quậy Phú Quốc" được
  nối thêm " Phú Quốc" thành **"Bún Quậy Phú Quốc Phú Quốc | Bún Quậy
  Như Ý"**; `bq_menu_seo_title()` chỉ chèn "Phú Quốc" khi tên chưa có.

### `.htaccess`

Thêm 2 dòng (đặt **trước** rule `^([^.]+)$ $1.html`), xem
[`../.htaccess.example`](../.htaccess.example):

```apache
RewriteRule ^mon/([^/]+)/?$ mon.php?slug=$1 [L,QSA]
RewriteRule ^mon/?$ mon.php [L,QSA]
```

---

## 2. `sitemap.php` — nên làm

Sitemap hiện chỉ có trang chủ, blog, thư viện ảnh và các bài viết. Thêm từng
món để Google index được các landing page mới:

```php
require_once __DIR__ . '/php-patch/seo-slug.php';

// Mỗi SẢN PHẨM một URL (không phải mỗi biến thể) — 4 dòng, không phải 8.
foreach (bq_menu_products($menu) as $item) {
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
| 2c | Mở `?id=` của **cả 3 biến thể** Bún Quậy | Cả 3 đều 301 về cùng 1 URL |
| 2d | Trang sản phẩm nhiều biến thể | Vẫn còn nút chọn loại, đổi giá tại chỗ |
| 2e | Xem `<title>` | Không lặp "Phú Quốc Phú Quốc" |
| 3 | `curl -s /mon/<slug> \| grep canonical` | Trỏ về chính URL slug |
| 4 | Xem nguồn trang, tìm `og:title` | Đúng Tiêu đề SEO đã nhập |
| 5 | Trang chủ → bấm 1 món | Điều hướng sang URL slug |
| 6 | `/mon/khong-co-that` | Trả HTTP 404 |
| 7 | Facebook Sharing Debugger với URL slug | Hiện đúng ảnh + tiêu đề |
