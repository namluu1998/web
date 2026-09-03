/* ===================================================================
   post.js — bai-viet.html (post detail page)
=================================================================== */

const BASE_URL = "https://bunquayphuquoc.com";

function parseViews(v) {
  return parseInt(String(v).replace(/[.\s]/g, ""), 10) || 0;
}

function parseImageLine(line) {
  const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (!match) return null;
  const caption = match[1].trim();
  const src = match[2].trim();
  if (!src.startsWith("/uploads/") && !src.startsWith("http://") && !src.startsWith("https://")) {
    return null;
  }
  return { src, caption };
}

function slugifyHeading(text) {
  const noDiacritics = (text || "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return code < 0x300 || code > 0x36f; // drop combining diacritical marks
    })
    .join("");
  return noDiacritics.replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "section";
}

function parseFencedBlock(fenceType, rawLines) {
  const lines = rawLines.map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  if (fenceType === "tip" || fenceType === "note") {
    return { type: "callout", text: nonEmpty.join(" ") };
  }

  if (fenceType === "faq") {
    const items = [];
    let curQ = null;
    let curA = [];
    const pushCur = () => {
      if (curQ !== null) items.push({ q: curQ, a: curA.join(" ").trim() });
      curQ = null;
      curA = [];
    };
    for (const l of lines) {
      const qm = l.match(/^Q:\s*(.+)$/i);
      const am = l.match(/^A:\s*(.+)$/i);
      if (qm) {
        pushCur();
        curQ = qm[1].trim();
      } else if (am) {
        curA.push(am[1].trim());
      } else if (l && curQ !== null) {
        curA.push(l);
      }
    }
    pushCur();
    return { type: "faq", items };
  }

  if (fenceType === "cta") {
    let button = null;
    const textLines = [];
    for (const l of nonEmpty) {
      const m = l.match(/^\[(.+?)\]\((.+?)\)$/);
      if (m) button = { label: m[1].trim(), href: m[2].trim() };
      else textLines.push(l);
    }
    return { type: "cta", heading: textLines[0] || "", body: textLines.slice(1).join(" "), button };
  }

  if (fenceType === "grid") {
    const items = nonEmpty.map((l) => {
      const [label, value] = l.split("|").map((s) => (s || "").trim());
      return { label: label || "", value: value || "" };
    });
    return { type: "grid", items };
  }

  return { type: "paragraph", text: nonEmpty.join(" ") };
}

function parseParagraphChunk(chunk) {
  const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
  const image = lines.length === 1 ? parseImageLine(lines[0]) : null;

  if (image) {
    return [{ type: "image", ...image }];
  }

  if (lines.length === 1 && lines[0] === lines[0].toUpperCase() && lines[0].length > 3) {
    return [{ type: "heading", text: lines[0] }];
  }

  if (
    lines.length === 1 &&
    lines[0].length <= 80 &&
    !/[.,…]$/.test(lines[0]) &&
    lines[0].length > 10
  ) {
    return [{ type: "subheading", text: lines[0] }];
  }

  const bulletLines = lines.filter((l) => /^[•\-–]\s/.test(l));
  if (bulletLines.length >= 2 && bulletLines.length === lines.length) {
    return [{
      type: "bullets",
      items: bulletLines.map((l) => l.replace(/^[•\-–]\s+/, "")),
    }];
  }

  const numLines = lines.filter((l) => /^\d+[.)]\s/.test(l));
  if (numLines.length >= 2 && numLines.length === lines.length) {
    return [{
      type: "numbered",
      items: numLines.map((l) => {
        const m = l.match(/^(\d+)[.)]\s+(.+)$/);
        return m ? { num: m[1], text: m[2] } : { num: "", text: l };
      }),
    }];
  }

  if (lines.length > 1) {
    const firstLine = lines[0];
    const restBullets = lines.slice(1).filter((l) => /^[•\-–]\s/.test(l));
    if (restBullets.length === lines.length - 1 && restBullets.length >= 2) {
      const out = [];
      if (!/[.!?…,]$/.test(firstLine) && firstLine.length <= 80) {
        out.push({ type: "subheading", text: firstLine });
      } else {
        out.push({ type: "paragraph", text: firstLine });
      }
      out.push({
        type: "bullets",
        items: restBullets.map((l) => l.replace(/^[•\-–]\s+/, "")),
      });
      return out;
    }
  }

  // Table: all lines start with |
  if (lines.every((l) => l.startsWith("|"))) {
    const parseRow = (row) => row.split("|").slice(1, -1).map((c) => c.trim());
    const isSep = (row) => parseRow(row).every((c) => /^[-:_\s]+$/.test(c));
    const sepIdx = lines.findIndex(isSep);
    if (sepIdx >= 1) {
      const headers = parseRow(lines[0]);
      const rows = lines.slice(sepIdx + 1).map(parseRow);
      return [{ type: "table", headers, rows }];
    }
  }

  return [{ type: "paragraph", text: lines.join(" ") }];
}

function isRawHtmlContent(raw) {
  return /^\s*</.test(raw || "");
}

const RAW_HTML_ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "strong", "em", "b", "i", "u", "s", "mark",
  "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "a", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td", "sup", "sub", "code", "pre",
  // Static/decorative SVG illustrations only — no script, foreignObject, animate, or use (external ref risk).
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
  "text", "tspan", "defs", "lineargradient", "radialgradient", "stop",
];
const RAW_HTML_ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "id", "target", "rel", "colspan", "rowspan",
  "viewBox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "opacity", "d", "cx", "cy", "rx", "ry", "r", "x1", "y1", "x2", "y2", "x", "y",
  "transform", "text-anchor", "font-size", "font-weight", "font-family", "points", "xmlns", "offset", "stop-color",
];

function renderRawHtml(raw) {
  const doc = new DOMParser().parseFromString(raw, "text/html");
  const bodyHtml = doc.body ? doc.body.innerHTML : raw;
  return DOMPurify.sanitize(bodyHtml, {
    ALLOWED_TAGS: RAW_HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: RAW_HTML_ALLOWED_ATTR,
  });
}

function parseContent(raw) {
  const lines = (raw || "").split("\n");
  const blocks = [];
  let buffer = [];

  const flushBuffer = () => {
    const chunks = buffer.join("\n").split(/\n\n+/).map((c) => c.trim()).filter(Boolean);
    for (const chunk of chunks) blocks.push(...parseParagraphChunk(chunk));
    buffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (/^\[toc\]$/i.test(trimmed)) {
      flushBuffer();
      blocks.push({ type: "toc" });
      i++;
      continue;
    }

    const fenceMatch = trimmed.match(/^:::(\w+)\s*$/);
    if (fenceMatch) {
      flushBuffer();
      const fenceType = fenceMatch[1].toLowerCase();
      const innerLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        innerLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ':::'
      blocks.push(parseFencedBlock(fenceType, innerLines));
      continue;
    }

    buffer.push(lines[i]);
    i++;
  }
  flushBuffer();

  // Assign anchor ids to headings and collect them for any [toc] block.
  const usedSlugs = {};
  const tocItems = [];
  blocks.forEach((b) => {
    if (b.type !== "heading") return;
    let slug = slugifyHeading(b.text);
    if (usedSlugs[slug] != null) {
      usedSlugs[slug]++;
      slug = `${slug}-${usedSlugs[slug]}`;
    } else {
      usedSlugs[slug] = 0;
    }
    b.id = slug;
    tocItems.push({ text: b.text, id: slug });
  });
  blocks.forEach((b) => {
    if (b.type === "toc") b.items = tocItems;
  });

  return blocks;
}

function renderContentBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type === "heading") {
      return `<h2 id="${escapeHtml(block.id || "")}" class="text-xl md:text-2xl font-bold mt-10 mb-4 pb-3 border-b border-orange-100" style="color:#1a5276;">${escapeHtml(block.text)}</h2>`;
    }
    if (block.type === "toc") {
      if (!block.items || block.items.length === 0) return "";
      return `<div class="toc"><h4>📋 Nội dung bài viết</h4><ol>${block.items.map((it) => `<li><a href="#${escapeHtml(it.id)}">${escapeHtml(it.text)}</a></li>`).join("")}</ol></div>`;
    }
    if (block.type === "callout") {
      return `<div class="highlight-box"><p>${escapeHtml(block.text)}</p></div>`;
    }
    if (block.type === "faq") {
      return `<div class="faq-section">${block.items.map((it) => `
        <div class="faq-item">
          <div class="faq-q">❓ ${escapeHtml(it.q)}</div>
          <div class="faq-a">${escapeHtml(it.a)}</div>
        </div>`).join("")}</div>`;
    }
    if (block.type === "cta") {
      return `<div class="cta-box">
        ${block.heading ? `<h3>${escapeHtml(block.heading)}</h3>` : ""}
        ${block.body ? `<p>${escapeHtml(block.body)}</p>` : ""}
        ${block.button ? `<a href="${escapeHtml(block.button.href)}" class="cta-btn">${escapeHtml(block.button.label)}</a>` : ""}
      </div>`;
    }
    if (block.type === "grid") {
      return `<div class="info-grid">${block.items.map((it) => `
        <div class="info-card"><h4>${escapeHtml(it.label)}</h4><p>${escapeHtml(it.value)}</p></div>`).join("")}</div>`;
    }
    if (block.type === "subheading") {
      return `<h3 class="text-base md:text-lg font-bold mt-7 mb-3 flex items-center gap-2" style="color:#c4612a;">
        <span class="w-1 h-5 rounded-full inline-block shrink-0" style="background-color:#e07b39;"></span>
        ${escapeHtml(block.text)}
      </h3>`;
    }
    if (block.type === "bullets") {
      return `<ul class="my-4 space-y-2">${block.items.map((item) => `
        <li class="flex items-start gap-2.5 leading-relaxed">
          <span class="mt-1.5 w-2 h-2 rounded-full shrink-0" style="background-color:#e07b39;"></span>
          ${escapeHtml(item)}
        </li>`).join("")}</ul>`;
    }
    if (block.type === "numbered") {
      return `<ol class="my-4 space-y-3">${block.items.map((item, j) => `
        <li class="flex items-start gap-3 leading-relaxed">
          <span class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background-color:#e07b39;">${escapeHtml(item.num || String(j + 1))}</span>
          <span class="pt-0.5">${escapeHtml(item.text)}</span>
        </li>`).join("")}</ol>`;
    }
    if (block.type === "table") {
      const thead = `<thead><tr style="background-color:#1a5276;color:#fff;">${block.headers.map((h) => `<th class="px-4 py-3 text-left font-semibold whitespace-nowrap">${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${block.rows.map((row, i) => `<tr class="${i % 2 === 1 ? "bg-orange-50" : ""} border-b border-orange-100">${row.map((cell) => `<td class="px-4 py-2.5 leading-relaxed">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      return `<div class="overflow-x-auto my-6 rounded-lg border border-orange-100 shadow-sm"><table class="w-full text-sm border-collapse">${thead}${tbody}</table></div>`;
    }
    if (block.type === "image") {
      return `<figure class="my-8">
        <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.caption || "Anh minh hoa bai viet")}" class="w-full rounded-lg object-cover shadow-sm" loading="lazy" />
        ${block.caption ? `<figcaption class="mt-3 text-center text-sm italic text-gray-500">${escapeHtml(block.caption)}</figcaption>` : ""}
      </figure>`;
    }
    return `<p class="my-5 leading-8">${escapeHtml(block.text)}</p>`;
  }).join("");
}

/* Schema.org yeu cau ngay theo chuan ISO 8601 (2026-06-23). Trong DB ngay
   duoc luu theo dinh dang hien thi kieu Viet Nam ("23/6/2026", "10/07/2025")
   nen phai doi truoc khi dua vao JSON-LD. Tra ve undefined neu khong doc
   duoc dinh dang — thieu truong van tot hon truong sai chuan. */
function toISODate(value) {
  const raw = String(value == null ? "" : value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;            // da dung chuan
  const m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!m) return undefined;
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return undefined;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const d = new Date(iso + "T00:00:00Z");                      // chan ngay khong ton tai (31/02)
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== day) return undefined;
  return iso;
}

document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const settings = db.settings.get();
  initCommonUI(settings);

  /* URL chuẩn: /bai-viet/<slug>. URL cũ /bai-viet?id=... vẫn mở đúng
     bài để link/bookmark/kết quả Google cũ không gãy. */
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/+$/, "");
  const matched = path.match(/\/bai-viet(?:\.html|\.php)?\/(.+)$/);
  let slugFromPath = "";
  if (matched) {
    try { slugFromPath = decodeURIComponent(matched[1]); }
    catch (e) { slugFromPath = matched[1]; }
  }
  const routeSlug = params.get("slug") || slugFromPath;
  const bySlug = routeSlug ? db.posts.getBySlug(routeSlug) : null;
  const id = bySlug ? bySlug.id : params.get("id");

  const layout = document.getElementById("post-layout");
  const metaBar = document.getElementById("post-meta-bar");
  const notFound = document.getElementById("post-not-found");

  const postCheck = id ? db.posts.getById(id) : null;
  if (!postCheck || !postCheck.published) {
    layout.classList.add("hidden");
    metaBar.classList.add("hidden");
    notFound.classList.remove("hidden");
    document.getElementById("page-title").textContent = "Không tìm thấy bài viết | " + settings.siteName;
    return;
  }

  db.posts.incrementViews(id);
  const post = db.posts.getById(id);

  /* Ưu tiên Tiêu đề + Mô tả admin nhập trong phần SEO của bài; để
     trống thì suy từ tiêu đề và tóm tắt. */
  const fullTitle = postSeoTitle(post, settings.siteName);
  const seoDesc = postSeoDesc(post);
  document.getElementById("page-title").textContent = fullTitle;
  const descEl = document.getElementById("page-description");
  if (descEl) descEl.setAttribute("content", seoDesc);

  const canonicalPath = postUrl(post);
  const pageUrl = `${BASE_URL}${canonicalPath}`;

  /* Mở bằng URL cũ thì dọn thanh địa chỉ về /bai-viet/<slug> (không tải
     lại trang). Redirect 301 thật nằm ở bai-viet.php để bot cũng thấy. */
  if (window.location.pathname + window.location.search !== canonicalPath) {
    try { history.replaceState(null, "", canonicalPath); } catch (e) {}
  }
  const ogImage = isImageValue(post.emoji)
    ? (post.emoji.startsWith("http") || post.emoji.startsWith("data:") ? post.emoji : `${BASE_URL}${post.emoji}`)
    : `${BASE_URL}/uploads/1780645751588-lekzpy.png`;
  document.getElementById("page-canonical").setAttribute("href", pageUrl);
  document.getElementById("og-title").setAttribute("content", fullTitle);
  document.getElementById("og-description").setAttribute("content", seoDesc);
  document.getElementById("og-url").setAttribute("content", pageUrl);
  document.getElementById("og-image").setAttribute("content", ogImage);
  document.getElementById("twitter-title").setAttribute("content", fullTitle);
  document.getElementById("twitter-description").setAttribute("content", seoDesc);
  document.getElementById("twitter-image").setAttribute("content", ogImage);

  document.getElementById("breadcrumb-title").textContent = post.title;

  if (post.tag) {
    setText("post-meta-tag", post.tag);
    document.getElementById("post-meta-tag").classList.remove("hidden");
    document.getElementById("post-meta-sep1").classList.remove("hidden");
  }
  document.getElementById("post-meta-date").textContent = `📅 ${post.date}`;
  setText("post-meta-views", post.views);

  /* Bài dùng "trang HTML độc lập": trang được nhúng đã có sẵn tiêu đề,
     mô tả và ảnh hero của riêng nó. Nếu site render thêm phần header
     của mình nữa thì mọi thứ hiện hai lần. Ẩn phần nhìn thấy được,
     nhưng vẫn giữ <h1> (ẩn với mắt, không ẩn với Google/trình đọc màn
     hình) vì nội dung trong iframe là tài liệu riêng, không tính là
     h1 của trang này. */
  const trangDocLap = Boolean(post.htmlFileUrl);

  const titleEl = document.getElementById("post-title");
  titleEl.textContent = post.title;
  if (trangDocLap) titleEl.classList.add("sr-only");

  if (post.excerpt && !trangDocLap) {
    const excerptEl = document.getElementById("post-excerpt");
    excerptEl.textContent = post.excerpt;
    excerptEl.classList.remove("hidden");
  }

  if (isImageValue(post.emoji) && !trangDocLap) {
    document.getElementById("post-cover-img").src = post.emoji;
    document.getElementById("post-cover-img").alt = post.title;
    document.getElementById("post-cover-caption").textContent = post.title;
    document.getElementById("post-cover-figure").classList.remove("hidden");
  }

  let contentBlocks = [];
  if (post.htmlFileUrl) {
    document.getElementById("post-content").innerHTML =
      `<iframe src="${escapeHtml(post.htmlFileUrl)}" id="post-html-iframe" loading="lazy" style="width:100%;border:0;display:block;min-height:400px;"></iframe>`;
    const iframe = document.getElementById("post-html-iframe");
    iframe.addEventListener("load", () => {
      try {
        iframe.style.height = iframe.contentWindow.document.documentElement.scrollHeight + "px";
      } catch (e) { /* cross-origin fallback: keep min-height */ }
    });
  } else {
    const rawHtmlMode = isRawHtmlContent(post.content);
    contentBlocks = rawHtmlMode ? [] : parseContent(post.content);
    document.getElementById("post-content").innerHTML = rawHtmlMode
      ? renderRawHtml(post.content)
      : renderContentBlocks(contentBlocks);
  }

  /* Share buttons */
  const shareUrl = pageUrl;
  const enc = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(post.title);
  document.getElementById("share-facebook").href = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;
  // Zalo: dùng plugin chia sẻ chính thức (sp.zalo.me). Nó tự đọc tiêu đề +
  // ảnh từ thẻ OG của trang được chia sẻ (đã render sẵn phía server ở bai-viet.php).
  document.getElementById("share-zalo").href = `https://sp.zalo.me/plugins/share?url=${enc}`;
  document.getElementById("share-twitter").href = `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`;

  /* Copy link — có phản hồi rõ ràng và fallback nếu clipboard bị chặn */
  const copyBtn = document.getElementById("share-copy");
  const copyLabel = document.getElementById("share-copy-label");
  const showCopied = () => {
    if (!copyLabel) return;
    copyLabel.textContent = window.t ? window.t("post_copied") : "Đã sao chép!";
    setTimeout(() => {
      copyLabel.textContent = window.t ? window.t("post_copy") : "Sao chép link";
    }, 2000);
  };
  const fallbackCopy = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopied();
    } catch (e) {
      if (copyLabel) copyLabel.textContent = shareUrl; // cùng lắm: hiện link để tự copy
    }
  };
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(showCopied).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }

  /* Sidebar: most read */
  const allPublished = db.posts.getPublished();
  const mostRead = [...allPublished]
    .sort((a, b) => parseViews(b.views) - parseViews(a.views))
    .filter((p) => String(p.id) !== String(id))
    .slice(0, 8);

  const mostReadBox = document.getElementById("most-read-box");
  const mostReadList = document.getElementById("most-read-list");
  if (mostRead.length === 0) {
    mostReadBox.classList.add("hidden");
  } else {
    mostReadList.innerHTML = mostRead.map((r, i) => `
      <li>
        <a href="${escapeHtml(postUrl(r))}" class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
          <span class="text-2xl font-black shrink-0 leading-none mt-0.5 w-7 text-center" style="color:${i < 3 ? "#e07b39" : "#d1d5db"};">${i + 1}</span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-700 group-hover:text-[#e07b39] transition-colors line-clamp-3 leading-snug">${escapeHtml(r.title)}</p>
            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ${escapeHtml(r.views)}
            </span>
          </div>
        </a>
      </li>`).join("");
  }

  /* BlogPosting (+ FAQPage, when the post uses a :::faq block) schema.org */
  const blogSchema = {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Organization", name: settings.siteName },
    publisher: { "@type": "Organization", name: settings.siteName, url: BASE_URL },
    mainEntityOfPage: pageUrl,
  };

  /* Chi gan khi doi duoc sang ISO 8601; ngay sai dinh dang bi Google bo qua. */
  const isoDate = toISODate(post.date);
  if (isoDate) blogSchema.datePublished = isoDate;

  const faqItems = contentBlocks.filter((b) => b.type === "faq").flatMap((b) => b.items);
  const graph = [blogSchema];
  if (faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqItems.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    });
  }

  document.getElementById("post-schema").textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  });
});
