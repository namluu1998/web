# Hướng dẫn deploy lên bunquayphuquoc.com

Ghi cho lần deploy sau đợt thay đổi: URL slug cho món & bài viết, SEO từng
sản phẩm/bài, Code Scripts, admin thực đơn dạng sản phẩm–biến thể, và tối ưu
tốc độ chuyển trang.

> **Trước khi bắt đầu:** tải một bản backup mới trong cPanel. Có 2 file PHP
> phải chép đè, và 1 file `.htaccess` phải sửa — nếu sai thì trang chi tiết
> món / bài viết sẽ hỏng cho tới khi khôi phục.

---

## 1. Chép các file tĩnh lên `public_html/`

Giữ nguyên cấu trúc thư mục. Danh sách đầy đủ:

| Đường dẫn trên server | Vì sao đổi |
|---|---|
| `assets/js/storage.js` | slug + SEO cho món và bài, cache phiên, nạp seed theo yêu cầu |
| `assets/js/mon.js` | định tuyến `/mon/<slug>`, thẻ SEO theo sản phẩm |
| `assets/js/post.js` | định tuyến `/bai-viet/<slug>`, thẻ SEO theo bài |
| `assets/js/main.js` | thẻ món/bài ngoài trang chủ trỏ URL slug |
| `assets/js/common.js` | chèn Code Scripts, sửa lightbox `src=""` |
| `assets/css/style.css` | style ô dán snippet + bộ đếm ký tự SEO |
| `index.html` | bỏ 3 thẻ seed, sửa `<img src="">` |
| `mon.html` | bỏ thẻ seed, đổi sang đường dẫn tuyệt đối |
| `bai-viet.html` | bỏ thẻ seed, đường dẫn tuyệt đối, sửa `<img src="">` |
| `blog.html` | bỏ thẻ seed, link bài dùng URL slug |
| `thu-vien-anh.html` | bỏ thẻ seed |
| `404.html` | bỏ thẻ seed, đường dẫn tuyệt đối |
| `admin/thuc-don.html` | admin thực đơn 3 tầng: sản phẩm → biến thể |
| `admin/cai-dat.html` | tab 🧩 Code Scripts |
| `admin/bai-viet.html` | hiện URL công khai trong bảng |
| `admin/bai-viet-form.html` | khối SEO cho bài viết |
| `admin/danh-gia.html` | sửa `<img src="">` |
| `php-patch/seo-slug.php` | **thư mục mới**, PHP dùng chung cho slug/SEO |

`php-patch/` phải nằm **cùng cấp** với `mon.php` (tức trong `public_html/`).
Các file `.md` và `.template` trong đó không ảnh hưởng gì nếu upload kèm, nhưng
không cần thiết.

---

## 2. Vá 2 file PHP

Hai file này chứa mật khẩu DB nên repo không giữ bản thật. Trong
`php-patch/` có sẵn bản vá:

1. Mở `mon.php` **đang chạy trên server**, copy 3 giá trị: tên database, user,
   mật khẩu.
2. Mở `php-patch/mon.php.template`, thay vào `___TEN_DATABASE___`,
   `___TEN_USER___`, `___MAT_KHAU___`.
3. Upload đè lên `mon.php` (bỏ đuôi `.template`).
4. Làm y hệt với `php-patch/bai-viet.php.template` → `bai-viet.php`.

Chi tiết từng thay đổi: [`static-site/php-patch/README.md`](static-site/php-patch/README.md).

---

## 3. Sửa `.htaccess`

Thêm 4 dòng sau, đặt **trước** rule `RewriteRule ^([^.]+)$ $1.html`:

```apache
RewriteRule ^mon/([^/]+)/?$ mon.php?slug=$1 [L,QSA]
RewriteRule ^mon/?$ mon.php [L,QSA]
RewriteRule ^bai-viet/([^/]+)/?$ bai-viet.php?slug=$1 [L,QSA]
RewriteRule ^bai-viet/?$ bai-viet.php [L,QSA]
```

Hai dòng `^mon/?$` và `^bai-viet/?$` có thể đã có sẵn — nếu có thì chỉ thêm 2
dòng `([^/]+)`, và nhớ đặt chúng **lên trên** dòng không có `([^/]+)`.

Bản mẫu đầy đủ: [`static-site/.htaccess.example`](static-site/.htaccess.example).

---

## 4. Nên làm thêm (không bắt buộc)

- `sitemap.php`: đổi sang `bq_menu_products()` + `bq_post_abs_url()` để sitemap
  ra 1 URL mỗi sản phẩm (4 thay vì 8) và bài viết dùng slug.
- `api.php`: `action=init` đang trả **toàn bộ** DB (~64 KB) cho mọi lượt xem
  trang, trong đó 52 KB là nội dung bài viết mà trang món không dùng. Xem mục
  "3b" trong php-patch/README.md.
- `api.php` cũng đang trả `users` (tên đăng nhập + vai trò admin) cho khách.
  Không lộ mật khẩu, nhưng nên bỏ.

---

## 5. Nghiệm thu sau khi deploy

| # | Kiểm tra | Kỳ vọng |
|---|---|---|
| 1 | Trang chủ | 4 thẻ sản phẩm (không phải 8), giá "từ ...đ" |
| 2 | Bấm 1 sản phẩm | Vào `/mon/<slug>`, có nút chọn biến thể |
| 3 | Đổi biến thể | Giá/mô tả/ảnh đổi, URL **không** đổi |
| 4 | Mở `/mon?id=17848842917841kqr3a` | 301 sang `/mon/bun-quay-phu-quoc` |
| 5 | `curl -sI /mon/khong-co-that` | HTTP 404 |
| 6 | Xem nguồn trang món, tìm `<title>` | Không lặp "Phú Quốc Phú Quốc" |
| 7 | Mở 1 bài viết từ /blog | Vào `/bai-viet/<slug>` |
| 8 | Mở `/bai-viet?id=5` | 301 sang slug |
| 9 | Admin → Thực đơn | Danh sách sản phẩm, vào được 3 tầng |
| 10 | Admin → sửa 1 món → nhập Đường dẫn → Lưu → F5 | Giá trị còn nguyên (xác nhận api.php không lọc field) |
| 11 | Admin → Bài viết → tạo bài + tải trang HTML độc lập → Lưu → mở lại | Link file vẫn còn |
| 12 | Admin → Cài đặt → 🧩 Code Scripts → dán snippet → Lưu → mở trang chủ | Snippet chạy; mở `/admin/` thì **không** chạy |
| 13 | Facebook Sharing Debugger với URL slug | Đúng ảnh + tiêu đề |

---

## 6. Nếu cần quay lại

Khôi phục từ backup cPanel, hoặc chép lại 2 file PHP và `.htaccess` cũ. Phần
JS/HTML tĩnh có thể quay lại bằng `git checkout 6024af3 -- static-site`.

Lưu ý: các trường mới (`slug`, `slugAliases`, `seoTitle`, `seoDesc` trên món và
bài) nằm trong cột JSON nên **rollback không làm hỏng dữ liệu** — code cũ chỉ
bỏ qua chúng.
