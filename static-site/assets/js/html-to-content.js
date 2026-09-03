/* ===================================================================
   html-to-content.js — chuyen 1 file HTML hoan chinh thanh cu phap
   cua o "Noi dung" ma post.js hieu duoc.

   Ly do ton tai: truoc day file HTML duoc upload len server roi nhung
   qua <iframe>. Google coi iframe la tai lieu rieng nen noi dung khong
   duoc tinh cho trang bai viet — bai viet thanh thin content, con file
   trong iframe thi tu canh tranh voi chinh no. Chuyen sang cu phap
   Noi dung thi noi dung nam thang trong trang.

   Dung:
     const kq = htmlToContent(htmlString);
     kq.content   -> chuoi de dan vao o Noi dung
     kq.warnings  -> canh bao can nguoi doc quyet dinh
     kq.stats     -> thong ke so khoi da tao

   Khong phu thuoc thu vien nao. Chay duoc ca trong trang admin lan
   trong trang cong cu chuyen doi rieng.
=================================================================== */
(function (global) {
  "use strict";

  /* Cac luat nay phai khop voi parseContent() trong assets/js/post.js.
     Doi o day ma khong doi ben do (hoac nguoc lai) se sinh ra khoi sai loai. */
  var GIOI_HAN = {
    subheadingToiDa: 80,   // dong dai hon se bi coi la doan van
    subheadingToiThieu: 11, // parseContent yeu cau length > 10
    ketThucLaDauCau: /[.,…]$/  // dong ket thuc bang cac dau nay khong thanh tieu de
  };

  var BO_QUA = [
    "script", "style", "noscript", "template", "link", "meta",
    "nav", "header", "footer",
    ".breadcrumb", ".breadcrumbs", ".crumbs",
    ".meta", ".post-meta", ".article-meta",
    ".toc", ".table-of-contents",
    ".share", ".social", ".sidebar"
  ];

  function coClass(el, tuKhoa) {
    var c = (el.getAttribute && el.getAttribute("class") || "").toLowerCase();
    var id = (el.id || "").toLowerCase();
    return tuKhoa.some(function (t) { return c.indexOf(t) !== -1 || id.indexOf(t) !== -1; });
  }

  function chuHoaHet(s) {
    /* Tieng Viet co dau van toUpperCase binh thuong. */
    return String(s || "").toUpperCase();
  }

  function gonKhoangTrang(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }

  function layChu(el) {
    return gonKhoangTrang(el.textContent);
  }

  /* Mot dong se bi parseContent doc nham thanh subheading neu no dung
     mot minh, dai 11..80 ky tu va khong ket thuc bang . , …
     Ham nay de canh bao chu khong tu sua chu nguoi dung. */
  function deBiDocNhamLaTieuDe(text) {
    var t = gonKhoangTrang(text);
    if (t.indexOf("\n") !== -1) return false;
    return t.length >= GIOI_HAN.subheadingToiThieu &&
           t.length <= GIOI_HAN.subheadingToiDa &&
           !GIOI_HAN.ketThucLaDauCau.test(t);
  }

  /* parseImageLine() ben post.js chi chap nhan /uploads/... hoac http(s). */
  function anhHopLe(src) {
    var s = String(src || "").trim();
    return s.indexOf("/uploads/") === 0 || s.indexOf("http://") === 0 || s.indexOf("https://") === 0;
  }

  /* Mot bo trich dac biet (faq/cta/grid/tip) chi duoc phep "nuot" ca phan tu
     neu no lay duoc phan lon chu ben trong. Neu khong, phan tu do that ra la
     mot khung bao ngoai — phai di sau vao trong thay vi vut phan con lai.
     Day chinh la loi da lam mat gan het bai o lan chay dau tien. */
  function phuDuChu(ketQua, el) {
    if (!ketQua) return false;
    var chuGoc = layChu(el).length;
    if (!chuGoc) return false;
    /* Bo cac dong cu phap (:::faq, Q:, |, ...) truoc khi do do dai. */
    var chuRa = String(ketQua)
      .replace(/^:::\w*$/gm, "")
      .replace(/^:::$/gm, "")
      .replace(/^[QA]:\s*/gm, "")
      .replace(/\s+/g, " ").trim().length;
    return chuRa >= chuGoc * 0.6;
  }

  function taoBoChuyenDoi() {
    var khoi = [];      // cac khoi van ban da tao
    var canhBao = [];   // thong diep cho nguoi dung
    var thongKe = {};


    function them(loai, text) {
      if (!text || !String(text).trim()) return;
      /* Cac o trang tri chi chua emoji (cham timeline, icon...) khong mang
         thong tin — de lai se thanh doan van rac trong bai. */
      if (loai === "paragraph" && !/[\p{L}\p{N}]/u.test(String(text))) return;
      /* parseContent doc lai chuoi nay; mot doan van ngan khong co dau cau
         cuoi se bi no hieu thanh tieu de phu. Canh bao o day de bat duoc
         moi duong sinh ra doan van, khong chi tu the <p>. */
      if (loai === "paragraph" && deBiDocNhamLaTieuDe(text)) {
        canhBao.push('Đoạn ngắn này sẽ hiển thị thành tiêu đề phụ (dài ' +
          gonKhoangTrang(text).length + ' ký tự, không kết thúc bằng dấu câu): "' +
          gonKhoangTrang(text).slice(0, 70) + '". Thêm dấu chấm ở cuối nếu muốn giữ là đoạn văn.');
      }
      khoi.push(String(text));
      thongKe[loai] = (thongKe[loai] || 0) + 1;
    }
    return { khoi: khoi, canhBao: canhBao, thongKe: thongKe, them: them };
  }

  /* ---------- cac bo trich xuat cho tung dang khoi ---------- */

  function trichBang(table) {
    var hangs = Array.prototype.slice.call(table.querySelectorAll("tr"));
    if (!hangs.length) return null;
    var duLieu = hangs.map(function (tr) {
      return Array.prototype.slice.call(tr.querySelectorAll("th,td")).map(function (c) {
        /* Dau | trong noi dung se pha vo cu phap bang -> doi thanh gach dung. */
        return layChu(c).replace(/\|/g, "/");
      });
    }).filter(function (r) { return r.length; });
    if (duLieu.length < 2) return null;

    var soCot = Math.max.apply(null, duLieu.map(function (r) { return r.length; }));
    var deu = duLieu.map(function (r) {
      var out = r.slice();
      while (out.length < soCot) out.push("");   // hang thieu o -> bu cho du
      return out.slice(0, soCot);
    });

    var dong = ["| " + deu[0].join(" | ") + " |"];
    dong.push("|" + Array(soCot + 1).join(" --- |"));
    for (var i = 1; i < deu.length; i++) dong.push("| " + deu[i].join(" | ") + " |");
    return dong.join("\n");
  }

  function trichDanhSach(list) {
    var items = Array.prototype.slice.call(list.children)
      .filter(function (li) { return li.tagName === "LI"; })
      .map(function (li) { return layChu(li); })
      .filter(Boolean);
    if (items.length < 2) return null;   // duoi 2 dong parseContent khong nhan la danh sach
    var danhSachSo = list.tagName === "OL";
    return items.map(function (t, i) {
      return danhSachSo ? (i + 1) + ". " + t : "• " + t;
    }).join("\n");
  }

  function trichAnh(el) {
    var img = el.tagName === "IMG" ? el : el.querySelector("img");
    if (!img) return null;
    var src = img.getAttribute("src") || "";
    if (!anhHopLe(src)) return null;
    var cap = "";
    var figcap = el.querySelector && el.querySelector("figcaption");
    if (figcap) cap = layChu(figcap);
    if (!cap) cap = gonKhoangTrang(img.getAttribute("alt"));
    /* Dau ) trong chu thich se cat cu phap ![...](...) -> bo di. */
    cap = cap.replace(/[()]/g, "");
    return "![" + cap + "](" + src + ")";
  }

  /* Mot .faq-item dung mot minh (khong co wrapper .faq-section) van phai
     nhan ra duoc — va nhieu .faq-item lien tiep phai gop thanh MOT khoi
     :::faq, vi moi khoi :::faq rieng se render thanh nhieu hop roi rac. */
  function laFaqItem(el) {
    return el.nodeType === 1 && coClass(el, ["faq-item", "faq-row"]);
  }

  function trichFaqTuNhieuPhanTu(dsPhanTu) {
    var cap = [];
    dsPhanTu.forEach(function (it) {
      var q = it.querySelector(".faq-q, .question, dt, summary, h3, h4");
      var a = it.querySelector(".faq-a, .answer, dd, p");
      if (q && a) cap.push({ q: layChu(q), a: layChu(a) });
    });
    return dongGoiFaq(cap);
  }

  function dongGoiFaq(cap) {
    cap = cap.filter(function (c) { return c.q && c.a; }).map(function (c) {
      return { q: c.q.replace(/^[^\p{L}\p{N}]+/u, "").trim(), a: c.a };
    });
    if (!cap.length) return null;
    return ":::faq\n" + cap.map(function (c) {
      return "Q: " + gonKhoangTrang(c.q) + "\nA: " + gonKhoangTrang(c.a);
    }).join("\n") + "\n:::";
  }

  function trichFaq(el) {
    var cap = [];

    /* Dang 1: .faq-item chua .faq-q va .faq-a */
    var items = el.querySelectorAll(".faq-item, .faq-row, .faq");
    Array.prototype.forEach.call(items, function (it) {
      var q = it.querySelector(".faq-q, .question, dt, summary, h3, h4");
      var a = it.querySelector(".faq-a, .answer, dd, p");
      if (q && a) cap.push({ q: layChu(q), a: layChu(a) });
    });

    /* Dang 2: <details><summary>Q</summary>A</details> */
    if (!cap.length) {
      Array.prototype.forEach.call(el.querySelectorAll("details"), function (d) {
        var s = d.querySelector("summary");
        if (!s) return;
        var clone = d.cloneNode(true);
        var s2 = clone.querySelector("summary");
        if (s2) s2.parentNode.removeChild(s2);
        cap.push({ q: layChu(s), a: layChu(clone) });
      });
    }

    /* Dang 3: <dl> voi cac cap dt/dd */
    if (!cap.length) {
      var dts = el.querySelectorAll("dt");
      Array.prototype.forEach.call(dts, function (dt) {
        var dd = dt.nextElementSibling;
        if (dd && dd.tagName === "DD") cap.push({ q: layChu(dt), a: layChu(dd) });
      });
    }

    /* Dang 4: h3/h4 ket thuc bang ? theo sau la doan van */
    if (!cap.length) {
      Array.prototype.forEach.call(el.querySelectorAll("h3,h4"), function (h) {
        var t = layChu(h);
        if (t.slice(-1) !== "?") return;
        var p = h.nextElementSibling;
        if (p && p.tagName === "P") cap.push({ q: t, a: layChu(p) });
      });
    }

    /* Bo emoji dan dat o dau cau hoi — post.js tu them "❓" khi render. */
    return dongGoiFaq(cap);
  }

  /* Cac hang "badge" kieu <div><span>💰 60k</span><span>⏱ 90 phut</span></div>
     neu de nguyen se thanh nhieu doan van ngan, va parseContent lai doc moi
     doan thanh mot tieu de phu — sinh ra hang chuc tieu de rac. Gop thanh
     danh sach gach dau dong. */
  var THE_INLINE = ["SPAN", "STRONG", "B", "EM", "I", "SMALL", "A", "TIME", "CODE"];
  function trichHangInline(el) {
    var con = Array.prototype.slice.call(el.children);
    if (con.length < 2) return null;
    if (!con.every(function (c) { return THE_INLINE.indexOf(c.tagName) !== -1; })) return null;
    var muc = con.map(layChu).filter(Boolean);
    if (muc.length < 2) return null;
    if (layChu(el).length > 300) return null;   // qua dai thi khong phai hang badge
    return muc.map(function (t) { return "• " + t; }).join("\n");
  }

  function trichCta(el) {
    var h = el.querySelector("h1,h2,h3,h4,.cta-title");
    var a = el.querySelector("a[href]");
    var ps = Array.prototype.slice.call(el.querySelectorAll("p"))
      .map(layChu).filter(Boolean);
    var tieuDe = h ? layChu(h) : (ps.shift() || "");
    var than = ps.join(" ");
    if (!tieuDe && !than) return null;

    var dong = [":::cta"];
    if (tieuDe) dong.push(gonKhoangTrang(tieuDe));
    if (than) dong.push(gonKhoangTrang(than));
    if (a) {
      var nhan = layChu(a).replace(/[\[\]()]/g, "");
      var href = a.getAttribute("href") || "";
      if (nhan && href) dong.push("[" + nhan + "](" + href + ")");
    }
    dong.push(":::");
    return dong.join("\n");
  }

  function trichGrid(el) {
    var the = el.querySelectorAll(".info-card, .spec-card, .card, .grid-item, .season-card");
    var muc = [];
    Array.prototype.forEach.call(the, function (c) {
      var h = c.querySelector("h1,h2,h3,h4,h5,strong,b");
      var nhan = h ? layChu(h) : "";
      var clone = c.cloneNode(true);
      if (h) {
        var h2 = clone.querySelector("h1,h2,h3,h4,h5,strong,b");
        if (h2) h2.parentNode.removeChild(h2);
      }
      var giaTri = layChu(clone);
      /* Dau | trong noi dung se pha vo cu phap "nhan | gia tri". */
      if (nhan && giaTri) muc.push(nhan.replace(/\|/g, "/") + " | " + giaTri.replace(/\|/g, "/"));
    });
    if (muc.length < 2) return null;
    return ":::grid\n" + muc.join("\n") + "\n:::";
  }

  /* ---------- ham chinh ---------- */

  function htmlToContent(html, tuyChon) {
    tuyChon = tuyChon || {};
    var boQuaH1DauTien = tuyChon.boQuaH1DauTien !== false;
    var tuThemMucLuc   = tuyChon.tuThemMucLuc   !== false;

    var doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    var body = doc.body;
    if (!body) return { content: "", warnings: ["Không đọc được nội dung file."], stats: {} };

    var bo = taoBoChuyenDoi();
    var daBoQuaH1 = false;
    var soTieuDeLon = 0;

    /* Xoa truoc cac nhanh khong bao gio muon giu, de khong phai kiem tra
       lai o moi buoc duyet. */
    BO_QUA.forEach(function (sel) {
      Array.prototype.forEach.call(body.querySelectorAll(sel), function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    });

    /* Danh sach "Bai viet lien quan" cuoi bai thuong tro toi URL chua ton
       tai. Bo di va bao cho nguoi dung biet. */
    Array.prototype.forEach.call(body.querySelectorAll("h1,h2,h3,h4"), function (h) {
      if (!/lien quan|liên quan|related|xem them|xem thêm/i.test(layChu(h))) return;
      var ke = h.nextElementSibling;
      if (ke && (ke.tagName === "UL" || ke.tagName === "OL")) {
        bo.canhBao.push('Đã bỏ mục "' + layChu(h) + '" — các link trong đó thường trỏ tới trang chưa tồn tại. Kiểm tra lại nếu cần giữ.');
        ke.parentNode.removeChild(ke);
        h.parentNode.removeChild(h);
      }
    });

    function duyet(node) {
      var dsCon = Array.prototype.slice.call(node.children);   // ten rieng: nhanh UL/OL cung dung bien ten "ds"
      for (var i = 0; i < dsCon.length; i++) {
        var el = dsCon[i];
        var tag = el.tagName;

        /* Nhieu .faq-item nam canh nhau (khong co wrapper) phai gop thanh
           MOT khoi :::faq — de rieng se ra nhieu hop FAQ roi rac. */
        if (laFaqItem(el)) {
          var nhom = [el];
          while (i + 1 < dsCon.length && laFaqItem(dsCon[i + 1])) { nhom.push(dsCon[i + 1]); i++; }
          var faqGop = trichFaqTuNhieuPhanTu(nhom);
          if (faqGop) { bo.them("faq", faqGop); continue; }
        }

        if (tag === "H1") {
          if (boQuaH1DauTien && !daBoQuaH1) { daBoQuaH1 = true; continue; }
          bo.them("heading", chuHoaHet(layChu(el))); soTieuDeLon++; continue;
        }
        if (tag === "H2") {
          bo.them("heading", chuHoaHet(layChu(el))); soTieuDeLon++; continue;
        }
        if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
          var t = layChu(el);
          if (t.length > GIOI_HAN.subheadingToiDa) {
            bo.canhBao.push('Tiêu đề phụ quá dài (' + t.length + ' ký tự, tối đa ' + GIOI_HAN.subheadingToiDa + ') nên sẽ hiển thị như đoạn văn: "' + t.slice(0, 60) + '…"');
            bo.them("paragraph", t);
          } else if (t.length < GIOI_HAN.subheadingToiThieu) {
            bo.canhBao.push('Tiêu đề phụ quá ngắn (' + t.length + ' ký tự, cần từ ' + GIOI_HAN.subheadingToiThieu + ') nên sẽ hiển thị như đoạn văn: "' + t + '"');
            bo.them("paragraph", t);
          } else if (GIOI_HAN.ketThucLaDauCau.test(t)) {
            bo.canhBao.push('Tiêu đề phụ kết thúc bằng dấu câu nên sẽ hiển thị như đoạn văn: "' + t + '"');
            bo.them("paragraph", t);
          } else {
            bo.them("subheading", t);
          }
          continue;
        }

        if (tag === "TABLE") {
          var bang = trichBang(el);
          if (bang) bo.them("table", bang);
          else bo.canhBao.push("Có 1 bảng không đọc được (thiếu dòng dữ liệu) — đã bỏ qua.");
          continue;
        }

        if (tag === "UL" || tag === "OL") {
          var ds = trichDanhSach(el);
          if (ds) bo.them(tag === "OL" ? "numbered" : "bullets", ds);
          else {
            var loi = Array.prototype.slice.call(el.querySelectorAll("li")).map(layChu).filter(Boolean);
            /* Danh sach 1 dong: parseContent khong nhan, de thanh doan van. */
            if (loi.length) bo.them("paragraph", loi.join(" "));
          }
          continue;
        }

        if (tag === "FIGURE" || tag === "IMG" || tag === "PICTURE") {
          var anh = trichAnh(el);
          if (anh) bo.them("image", anh);
          else bo.canhBao.push("Có 1 ảnh dùng đường dẫn không hợp lệ (cần /uploads/… hoặc http) — đã bỏ qua.");
          continue;
        }

        if (tag === "BLOCKQUOTE") {
          bo.them("callout", ":::tip\n" + layChu(el) + "\n:::");
          continue;
        }

        if (tag === "P") {
          var chiCoAnh = el.querySelector("img") && !layChu(el);
          if (chiCoAnh) {
            var a2 = trichAnh(el);
            if (a2) { bo.them("image", a2); continue; }
          }
          var chu = layChu(el);
          if (!chu) continue;
          /* Canh bao "bi doc nham thanh tieu de" nam trong them() — bao phu
             moi duong sinh doan van, khong chi the <p>. Dat them o day se
             lam moi cai bao hai lan. */
          bo.them("paragraph", chu);
          continue;
        }

        if (tag === "DIV" || tag === "SECTION" || tag === "ARTICLE" || tag === "MAIN" || tag === "ASIDE" || tag === "DL") {
          /* Hang badge (toan the inline) -> danh sach, thay vi nhieu doan ngan. */
          var hang = trichHangInline(el);
          if (hang) { bo.them("bullets", hang); continue; }

          /* Tieu de nam truc tiep trong khoi dac biet (vi du <h2> dau khoi
             .faq-section) phai duoc giu lai — truoc day bi bo trich nuot mat. */
          var tieuDeTrong = Array.prototype.slice.call(el.children).filter(function (c) {
            return /^H[1-6]$/.test(c.tagName);
          });
          /* KHONG rut heading ra khoi .cta-box: bo trich CTA dung chinh
             heading do lam dong tieu de cua :::cta. Rut ra se lam CTA mat
             tieu de, con tieu de thi lac ra ngoai thanh mot dong roi. */
          if (tieuDeTrong.length && coClass(el, ["faq", "grid", "cards", "info-", "spec-", "season-"])) {
            tieuDeTrong.forEach(function (h) {
              if (h.tagName === "H1" || h.tagName === "H2") {
                bo.them("heading", chuHoaHet(layChu(h))); soTieuDeLon++;
              } else {
                var tp = layChu(h);
                if (tp.length >= GIOI_HAN.subheadingToiThieu && tp.length <= GIOI_HAN.subheadingToiDa &&
                    !GIOI_HAN.ketThucLaDauCau.test(tp)) bo.them("subheading", tp);
                else bo.them("paragraph", tp);
              }
              h.parentNode.removeChild(h);
            });
          }

          /* Cac dang khoi dac biet — nhan dien theo ten class. */
          if (coClass(el, ["faq"])) {
            var faq = trichFaq(el);
            if (phuDuChu(faq, el)) { bo.them("faq", faq); continue; }
          }
          if (coClass(el, ["cta", "call-to-action"])) {
            var cta = trichCta(el);
            if (phuDuChu(cta, el)) { bo.them("cta", cta); continue; }
          }
          if (coClass(el, ["grid", "cards", "info-", "spec-", "season-"])) {
            var grid = trichGrid(el);
            if (phuDuChu(grid, el)) { bo.them("grid", grid); continue; }
          }
          if (coClass(el, ["highlight", "callout", "tip", "note", "intro", "box", "alert"])) {
            var chuKhoi = layChu(el);
            /* Khoi co cau truc ben trong (bang/danh sach) khong nhet vua
               vao :::tip vi :::tip chi nhan van ban phang. */
            if (chuKhoi && !el.querySelector("table,ul,ol,figure,img") &&
                !el.querySelector("h1,h2,h3,h4")) {
              bo.them("callout", ":::tip\n" + chuKhoi + "\n:::");
              continue;
            }
          }
          if (el.children.length) { duyet(el); continue; }
          var chuDiv = layChu(el);
          if (chuDiv) bo.them("paragraph", chuDiv);
          continue;
        }

        /* The khong biet nhung co con -> di sau vao trong. */
        if (el.children && el.children.length) { duyet(el); continue; }
        var conLai = layChu(el);
        if (conLai) bo.them("paragraph", conLai);
      }
    }

    duyet(body);

    var noiDung = bo.khoi;
    /* [toc] chi gom cac khoi "heading" (dong VIET HOA). Duoi 3 muc thi
       muc luc khong dang co. */
    if (tuThemMucLuc && soTieuDeLon >= 3) {
      noiDung = ["[toc]"].concat(noiDung);
      bo.thongKe.toc = 1;
    }

    return {
      content: noiDung.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n",
      warnings: bo.canhBao,
      stats: bo.thongKe
    };
  }

  global.htmlToContent = htmlToContent;
  if (typeof module !== "undefined" && module.exports) module.exports = { htmlToContent: htmlToContent };
})(typeof window !== "undefined" ? window : this);
