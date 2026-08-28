<?php
/* ===================================================================
   seo-slug.php — helper dùng chung cho URL /mon/<slug> và thẻ SEO
   của từng món.

   File này KHÔNG chứa mật khẩu / thông tin kết nối, nên được commit
   vào repo (khác với mon.php / api.php đang nằm trong .gitignore).

   Cách dùng trong mon.php / sitemap.php:
       require_once __DIR__ . '/php-patch/seo-slug.php';

   Logic ở đây phải khớp 1-1 với assets/js/storage.js (slugify,
   menuSlug, menuUrl, menuSeoTitle, menuSeoDesc) để server và client
   luôn sinh ra cùng một URL.
=================================================================== */

if (!defined('BQ_SITE_URL')) {
    define('BQ_SITE_URL', 'https://bunquayphuquoc.com');
}

/**
 * Bỏ dấu tiếng Việt và chuyển về kebab-case an toàn cho URL.
 * "Bún Quậy Phú Quốc" -> "bun-quay-phu-quoc"
 *
 * Không dùng ext/intl (Transliterator) vì hosting cPanel không phải
 * lúc nào cũng bật; bảng thay thế bên dưới đủ cho tiếng Việt.
 */
function bq_slugify($str)
{
    static $table = null;
    if ($table === null) {
        $lower = array(
            'à'=>'a','á'=>'a','ạ'=>'a','ả'=>'a','ã'=>'a','â'=>'a','ầ'=>'a','ấ'=>'a','ậ'=>'a','ẩ'=>'a','ẫ'=>'a',
            'ă'=>'a','ằ'=>'a','ắ'=>'a','ặ'=>'a','ẳ'=>'a','ẵ'=>'a',
            'è'=>'e','é'=>'e','ẹ'=>'e','ẻ'=>'e','ẽ'=>'e','ê'=>'e','ề'=>'e','ế'=>'e','ệ'=>'e','ể'=>'e','ễ'=>'e',
            'ì'=>'i','í'=>'i','ị'=>'i','ỉ'=>'i','ĩ'=>'i',
            'ò'=>'o','ó'=>'o','ọ'=>'o','ỏ'=>'o','õ'=>'o','ô'=>'o','ồ'=>'o','ố'=>'o','ộ'=>'o','ổ'=>'o','ỗ'=>'o',
            'ơ'=>'o','ờ'=>'o','ớ'=>'o','ợ'=>'o','ở'=>'o','ỡ'=>'o',
            'ù'=>'u','ú'=>'u','ụ'=>'u','ủ'=>'u','ũ'=>'u','ư'=>'u','ừ'=>'u','ứ'=>'u','ự'=>'u','ử'=>'u','ữ'=>'u',
            'ỳ'=>'y','ý'=>'y','ỵ'=>'y','ỷ'=>'y','ỹ'=>'y',
            'đ'=>'d',
        );
        // Thêm bản viết hoa (Đ, Ậ, Ơ...) để không phụ thuộc thứ tự hạ
        // chữ thường: strtolower() của PHP chỉ xử lý được ASCII.
        $table = $lower;
        if (function_exists('mb_strtoupper')) {
            foreach ($lower as $accented => $plain) {
                $table[mb_strtoupper($accented, 'UTF-8')] = $plain;
            }
        }
    }

    $str = strtr((string) $str, $table);
    $str = strtolower($str);               // tới đây chỉ còn ASCII
    $str = preg_replace('/[^a-z0-9]+/', '-', $str);
    $str = trim($str, '-');
    if (strlen($str) > 80) {
        $str = rtrim(substr($str, 0, 80), '-');
    }
    return $str;
}

/**
 * Khoá gom nhóm: tên group, hoặc chính id nếu là món độc lập.
 * Các dòng menu cùng group là BIẾN THỂ của một sản phẩm.
 */
function bq_group_key($item)
{
    $g = trim(isset($item['group']) ? $item['group'] : '');
    return $g !== '' ? $g : ('__id__' . (isset($item['id']) ? (string) $item['id'] : ''));
}

/** Tên sản phẩm: tên nhóm nếu có biến thể, không thì tên món. */
function bq_product_name($item)
{
    $g = trim(isset($item['group']) ? $item['group'] : '');
    return $g !== '' ? $g : trim(isset($item['name']) ? $item['name'] : '');
}

/**
 * Slug công khai của SẢN PHẨM: ưu tiên "Đường dẫn" admin đặt trong phần
 * SEO, không có thì sinh từ tên sản phẩm, cuối cùng mới rơi về id.
 * Các món cũ (chưa có trường slug trong DB) vẫn có URL đẹp mà không
 * cần chạy migration.
 */
function bq_menu_slug($item)
{
    if (!$item) return '';
    $fromSlug = bq_slugify(isset($item['slug']) ? $item['slug'] : '');
    if ($fromSlug !== '') return $fromSlug;
    $fromName = bq_slugify(bq_product_name($item));
    if ($fromName !== '') return $fromName;
    return isset($item['id']) ? (string) $item['id'] : '';
}

/** Đường dẫn công khai (phần path) của 1 sản phẩm. */
function bq_menu_url($item)
{
    $slug = bq_menu_slug($item);
    if ($slug !== '') return '/mon/' . rawurlencode($slug);
    $id = isset($item['id']) ? (string) $item['id'] : '';
    return '/mon?id=' . rawurlencode($id);
}

/** URL tuyệt đối, dùng cho canonical / og:url / sitemap. */
function bq_menu_abs_url($item)
{
    return BQ_SITE_URL . bq_menu_url($item);
}

/** Các biến thể cùng sản phẩm, giữ nguyên thứ tự thực đơn. */
function bq_menu_variants($menu, $item)
{
    if (!$item) return array();
    $key = bq_group_key($item);
    $out = array();
    foreach ($menu as $m) {
        if (bq_group_key($m) === $key) $out[] = $m;
    }
    return $out ? $out : array($item);
}

/**
 * Tìm sản phẩm theo slug (URL mới) hoặc id (URL cũ).
 * Trả về biến thể còn phục vụ đầu tiên, để trang mở ra đúng loại khách
 * mua được. $menu là mảng các món đã decode từ cột `menu`.`data`.
 */
function bq_menu_find($menu, $slug, $id)
{
    $wantSlug = bq_slugify($slug);
    if ($wantSlug !== '') {
        // Ưu tiên biến thể còn phục vụ, rồi mới tới bất kỳ biến thể nào.
        foreach (array(true, false) as $onlyAvailable) {
            foreach ($menu as $item) {
                if ($onlyAvailable && empty($item['available'])) continue;
                if (bq_menu_slug($item) === $wantSlug) return $item;
            }
            // Slug cũ: admin đổi "Đường dẫn" thì slug trước đó nằm trong
            // slugAliases để link đã share / đã index không chết.
            foreach ($menu as $item) {
                if ($onlyAvailable && empty($item['available'])) continue;
                $aliases = isset($item['slugAliases']) && is_array($item['slugAliases']) ? $item['slugAliases'] : array();
                if (in_array($wantSlug, $aliases, true)) return $item;
            }
        }
    }
    $id = (string) $id;
    if ($id !== '') {
        foreach ($menu as $item) {
            if (isset($item['id']) && (string) $item['id'] === $id) return $item;
        }
    }
    return null;
}

/** Danh sách SẢN PHẨM (mỗi nhóm 1 đại diện) — dùng cho sitemap. */
function bq_menu_products($menu, $availableOnly = true)
{
    $seen = array();
    $out = array();
    foreach ($menu as $m) {
        if ($availableOnly && empty($m['available'])) continue;
        $k = bq_group_key($m);
        if (isset($seen[$k])) continue;
        $seen[$k] = true;
        $out[] = $m;
    }
    return $out;
}

/** Tiêu đề hiển thị trên Google / khi share. */
function bq_menu_seo_title($item, $siteName)
{
    $custom = trim(isset($item['seoTitle']) ? $item['seoTitle'] : '');
    if ($custom !== '') return $custom;
    $name = bq_product_name($item);
    if ($name === '') return (string) $siteName;
    // Chỉ chèn "Phú Quốc" khi tên chưa có sẵn, tránh lặp thành
    // "Bún Quậy Phú Quốc Phú Quốc | ..." như bản đang chạy.
    $withPlace = preg_match('/phú quốc/iu', $name) ? $name : $name . ' Phú Quốc';
    return $siteName ? $withPlace . ' | ' . $siteName : $withPlace;
}

/** Mô tả meta; để trống thì cắt gọn từ mô tả món (~160 ký tự). */
function bq_menu_seo_desc($item, $limit = 160)
{
    $custom = trim(isset($item['seoDesc']) ? $item['seoDesc'] : '');
    if ($custom !== '') return $custom;

    $raw = trim(preg_replace('/\s+/u', ' ', isset($item['desc']) ? $item['desc'] : ''));
    $len = function_exists('mb_strlen') ? mb_strlen($raw, 'UTF-8') : strlen($raw);
    if ($len <= $limit) return $raw;

    $cut = function_exists('mb_substr') ? mb_substr($raw, 0, $limit - 1, 'UTF-8') : substr($raw, 0, $limit - 1);
    $lastSpace = function_exists('mb_strrpos') ? mb_strrpos($cut, ' ', 0, 'UTF-8') : strrpos($cut, ' ');
    if ($lastSpace !== false && $lastSpace > $limit * 0.6) {
        $cut = function_exists('mb_substr') ? mb_substr($cut, 0, $lastSpace, 'UTF-8') : substr($cut, 0, $lastSpace);
    }
    return rtrim($cut, " ,;:.-") . '…';
}
