import DOMPurify from "isomorphic-dompurify";

type Block =
  | { type: "heading"; text: string; id: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; caption: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: { num: string; text: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "toc"; items: { text: string; id: string }[] }
  | { type: "callout"; text: string }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "cta"; heading: string; body: string; button: { label: string; href: string } | null }
  | { type: "grid"; items: { label: string; value: string }[] };

function parseImageLine(line: string): { src: string; caption: string } | null {
  const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (!match) return null;

  const caption = match[1].trim();
  const src = match[2].trim();
  if (!src.startsWith("/uploads/") && !src.startsWith("http://") && !src.startsWith("https://")) {
    return null;
  }

  return { src, caption };
}

function slugifyHeading(text: string): string {
  const noDiacritics = (text || "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x300 || code > 0x36f; // drop combining diacritical marks
    })
    .join("");
  return noDiacritics.replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") || "section";
}

function parseFencedBlock(fenceType: string, rawLines: string[]): Block {
  const lines = rawLines.map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  if (fenceType === "tip" || fenceType === "note") {
    return { type: "callout", text: nonEmpty.join(" ") };
  }

  if (fenceType === "faq") {
    const items: { q: string; a: string }[] = [];
    let curQ: string | null = null;
    let curA: string[] = [];
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
    let button: { label: string; href: string } | null = null;
    const textLines: string[] = [];
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

function parseParagraphChunk(chunk: string): Block[] {
  const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
  const image = lines.length === 1 ? parseImageLine(lines[0]) : null;

  if (image) {
    return [{ type: "image", ...image }];
  }

  if (lines.length === 1 && lines[0] === lines[0].toUpperCase() && lines[0].length > 3) {
    return [{ type: "heading", text: lines[0], id: slugifyHeading(lines[0]) }];
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
      const out: Block[] = [];
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
    const parseRow = (row: string) => row.split("|").slice(1, -1).map((c) => c.trim());
    const isSep = (row: string) => parseRow(row).every((c) => /^[-:_\s]+$/.test(c));
    const sepIdx = lines.findIndex(isSep);
    if (sepIdx >= 1) {
      const headers = parseRow(lines[0]);
      const rows = lines.slice(sepIdx + 1).map(parseRow);
      return [{ type: "table", headers, rows }];
    }
  }

  return [{ type: "paragraph", text: lines.join(" ") }];
}

function parseContent(raw: string): Block[] {
  const lines = (raw || "").split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];

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
      blocks.push({ type: "toc", items: [] });
      i++;
      continue;
    }

    const fenceMatch = trimmed.match(/^:::(\w+)\s*$/);
    if (fenceMatch) {
      flushBuffer();
      const fenceType = fenceMatch[1].toLowerCase();
      const innerLines: string[] = [];
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

  const tocItems = blocks
    .filter((b): b is Block & { type: "heading" } => b.type === "heading")
    .map((b) => ({ text: b.text, id: b.id }));
  for (const b of blocks) {
    if (b.type === "toc") b.items = tocItems;
  }

  return blocks;
}

function isRawHtmlContent(raw: string): boolean {
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

function sanitizeRawHtml(raw: string): string {
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: RAW_HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: RAW_HTML_ALLOWED_ATTR,
  });
}

/** FAQ items found in the post content, used to emit FAQPage schema from the parent page. */
export function extractFaqItems(content?: string): { q: string; a: string }[] {
  if (!content || isRawHtmlContent(content)) return [];
  return parseContent(content)
    .filter((b): b is Block & { type: "faq" } => b.type === "faq")
    .flatMap((b) => b.items);
}

export default function PostContent({ content }: { content?: string }) {
  const raw = content ?? "";

  if (isRawHtmlContent(raw)) {
    return (
      <article
        className="prose-custom text-[15px] md:text-base leading-8 text-gray-700"
        dangerouslySetInnerHTML={{ __html: sanitizeRawHtml(raw) }}
      />
    );
  }

  const blocks = parseContent(raw);

  return (
    <article className="prose-custom text-[15px] md:text-base leading-8 text-gray-700">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2 key={i} id={block.id} className="text-xl md:text-2xl font-bold mt-10 mb-4 pb-3 border-b border-orange-100"
              style={{ color: "#1a5276" }}>
              {block.text}
            </h2>
          );
        }

        if (block.type === "toc") {
          if (block.items.length === 0) return null;
          return (
            <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 mb-9">
              <h4 className="text-sm font-bold mb-3" style={{ color: "#1a5276" }}>📋 Nội dung bài viết</h4>
              <ol className="pl-5 space-y-1.5">
                {block.items.map((it, j) => (
                  <li key={j} className="text-sm">
                    <a href={`#${it.id}`} className="hover:underline" style={{ color: "#c4612a" }}>{it.text}</a>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        if (block.type === "callout") {
          return (
            <div key={i} className="my-6 rounded-r-lg border-l-4 px-5 py-4" style={{ borderColor: "#e07b39", background: "#fff7ed" }}>
              <p className="m-0" style={{ color: "#c4612a" }}>{block.text}</p>
            </div>
          );
        }

        if (block.type === "grid") {
          return (
            <div key={i} className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {block.items.map((it, j) => (
                <div key={j} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{it.label}</h4>
                  <p className="text-sm font-medium text-gray-900 m-0">{it.value}</p>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "faq") {
          return (
            <div key={i} className="mt-10 space-y-3">
              {block.items.map((it, j) => (
                <div key={j} className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-4 font-semibold text-[15px] text-gray-900">❓ {it.q}</div>
                  <div className="px-5 py-3.5 text-sm text-gray-600">{it.a}</div>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "cta") {
          return (
            <div key={i} className="mt-10 rounded-2xl px-8 py-7 text-center text-white"
              style={{ background: "linear-gradient(135deg, #e07b39, #c4612a)" }}>
              {block.heading && <h3 className="text-lg font-bold mb-2">{block.heading}</h3>}
              {block.body && <p className="text-sm opacity-90 mb-4">{block.body}</p>}
              {block.button && (
                <a href={block.button.href} className="inline-block rounded-lg bg-white px-7 py-2.5 font-bold"
                  style={{ color: "#c4612a" }}>
                  {block.button.label}
                </a>
              )}
            </div>
          );
        }

        if (block.type === "subheading") {
          return (
            <h3 key={i} className="text-base md:text-lg font-bold mt-7 mb-3 flex items-center gap-2"
              style={{ color: "#c4612a" }}>
              <span className="w-1 h-5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: "#e07b39" }} />
              {block.text}
            </h3>
          );
        }

        if (block.type === "bullets") {
          return (
            <ul key={i} className="my-4 space-y-2">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: "#e07b39" }} />
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered") {
          return (
            <ol key={i} className="my-4 space-y-3">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3 leading-relaxed">
                  <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "#e07b39" }}>
                    {item.num || j + 1}
                  </span>
                  <span className="pt-0.5">{item.text}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "table") {
          return (
            <div key={i} className="my-6 overflow-x-auto rounded-lg border border-orange-100 shadow-sm">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#1a5276", color: "#fff" }}>
                    {block.headers.map((h, j) => (
                      <th key={j} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, j) => (
                    <tr key={j} className={`border-b border-orange-100 ${j % 2 === 1 ? "bg-orange-50" : ""}`}>
                      {row.map((cell, k) => (
                        <td key={k} className="px-4 py-2.5 leading-relaxed">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={i} className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.src}
                alt={block.caption || "Anh minh hoa bai viet"}
                className="w-full rounded-lg object-cover shadow-sm"
                loading="lazy"
              />
              {block.caption && (
                <figcaption className="mt-3 text-center text-sm italic text-gray-500">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // paragraph
        return (
          <p key={i} className="my-5 leading-8">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}
