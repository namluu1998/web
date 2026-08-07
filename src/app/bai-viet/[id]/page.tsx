import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { WithContext, BlogPosting } from "schema-dts";
import Link from "next/link";
import ShareButtons from "@/components/ShareButtons";
import { db } from "@/lib/data";
import PostContent, { extractFaqItems } from "@/components/PostContent";
import { isImageValue } from "@/lib/imageHelper";

type Props = { params: Promise<{ id: string }> };


function parseViews(v: string): number {
  return parseInt(String(v).replace(/[.\s]/g, ""), 10) || 0;
}

function ReservationCta({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? "p-5" : "mt-10 p-7"} rounded-2xl text-center text-white shadow-sm`}
      style={{ background: "linear-gradient(135deg, #c4612a, #e07b39)" }}
    >
      <div className={compact ? "text-2xl mb-2" : "text-3xl mb-2"}>🍜</div>
      <h2 className={`${compact ? "text-sm" : "text-lg"} font-bold mb-1`}>Đặt bàn ngay hôm nay</h2>
      <p className={`${compact ? "text-xs" : "text-sm"} opacity-85 mb-4`}>
        Giữ chỗ trước để thưởng thức đặc sản Phú Quốc tươi ngon.
      </p>
      <Link
        href="/#lien-he"
        className={`${compact ? "block px-4 py-2" : "inline-block px-7 py-2.5"} rounded-full bg-white text-sm font-semibold transition-colors hover:bg-orange-50`}
        style={{ color: "#e07b39" }}
      >
        Đặt bàn ngay →
      </Link>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = db.posts.getById(id);
  if (!post || !post.published) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `https://dacsan-phuquoc.vn/bai-viet/${id}` },
    openGraph: {
      type: "article",
      url: `https://dacsan-phuquoc.vn/bai-viet/${id}`,
      title: post.title,
      description: post.excerpt,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const postCheck = db.posts.getById(id);
  if (!postCheck || !postCheck.published) notFound();

  const post = db.posts.incrementViews(id) ?? postCheck;

  const allPublished = db.posts.getPublished();
  const mostRead = [...allPublished]
    .sort((a, b) => parseViews(b.views) - parseViews(a.views))
    .filter((p) => p.id !== id)
    .slice(0, 8);

  const schema: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Đặc Sản Phú Quốc" },
    publisher: { "@type": "Organization", name: "Đặc Sản Phú Quốc", url: "https://dacsan-phuquoc.vn" },
    mainEntityOfPage: `https://dacsan-phuquoc.vn/bai-viet/${id}`,
  };

  const faqItems = extractFaqItems(post.content);
  const faqSchema = faqItems.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      {/* ── Header ── */}
      <div className="hidden">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🦐</span>
            <span className="font-bold text-base group-hover:opacity-80 transition-opacity" style={{ color: "#e07b39" }}>
              Đặc Sản Phú Quốc
            </span>
          </Link>
          <Link href="/#bai-viet"
            className="text-sm text-gray-500 hover:text-[#e07b39] transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tất cả bài viết
          </Link>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#e07b39] transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link href="/#bai-viet" className="hover:text-[#e07b39] transition-colors">Bài viết</Link>
          <span>/</span>
          <span className="text-gray-500 line-clamp-1">{post.title}</span>
        </nav>

        {/* Meta bar */}
        <div className="flex items-center gap-3 text-xs text-gray-400 border-b border-gray-100 pb-3 mb-6 flex-wrap">
          {post.tag && (
            <>
              <span className="font-bold uppercase tracking-wide" style={{ color: "#1a5276" }}>{post.tag}</span>
              <span className="text-gray-200">|</span>
            </>
          )}
          <span>📅 {post.date}</span>
          <span className="text-gray-200">|</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {post.views} lượt xem
          </span>
        </div>

        {/* Grid layout */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Article ── */}
          <article className="lg:col-span-2">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-5" style={{ color: "#1a5276" }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base italic text-gray-600 border-l-4 pl-4 mb-6 leading-relaxed"
                style={{ borderColor: "#e07b39" }}>
                {post.excerpt}
              </p>
            )}

            {isImageValue(post.emoji) && (
              <figure className="mb-6 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.emoji} alt={post.title} className="w-full object-cover max-h-[480px]" />
                <figcaption className="text-center text-xs text-gray-400 mt-2 italic">{post.title}</figcaption>
              </figure>
            )}

            <PostContent content={post.content} />

            {/* Share buttons */}
            <ShareButtons title={post.title} id={id} />

            {/* CTA đặt bàn */}
            <ReservationCta />
            <div className="hidden"
              style={{ background: "linear-gradient(135deg, #c4612a, #e07b39)" }}>
              <div className="text-3xl mb-2">🍜</div>
              <h2 className="text-lg font-bold mb-1">Muốn thưởng thức ngay?</h2>
              <p className="text-sm opacity-85 mb-4">Đặt bàn trước để có chỗ ngồi đẹp và hải sản tươi nhất.</p>
              <Link href="/#lien-he"
                className="inline-block px-7 py-2.5 rounded-full font-semibold bg-white hover:bg-orange-50 transition-colors text-sm"
                style={{ color: "#e07b39" }}>
                Đặt bàn ngay →
              </Link>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1 space-y-6 sticky top-20">
            {/* Bài đọc nhiều */}
            {mostRead.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "#e07b39" }} />
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#1a5276" }}>
                    Bài đọc nhiều
                  </h2>
                </div>
                <ol className="divide-y divide-gray-50">
                  {mostRead.map((r, i) => (
                    <li key={r.id}>
                      <Link href={`/bai-viet/${r.id}`}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                        <span className="text-2xl font-black shrink-0 leading-none mt-0.5 w-7 text-center"
                          style={{ color: i < 3 ? "#e07b39" : "#d1d5db" }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-[#e07b39] transition-colors line-clamp-3 leading-snug">
                            {r.title}
                          </p>
                          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {r.views}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* CTA card sidebar */}
            <ReservationCta compact />
            <div className="hidden"
              style={{ background: "linear-gradient(135deg, #c4612a, #e07b39)" }}>
              <div className="text-2xl mb-2">📞</div>
              <p className="font-bold text-sm mb-1">Đặt bàn ngay hôm nay</p>
              <p className="text-xs opacity-80 mb-3">Hải sản tươi mỗi ngày từ biển Phú Quốc</p>
              <Link href="/#lien-he"
                className="block px-4 py-2 rounded-full text-sm font-semibold bg-white hover:bg-orange-50 transition-colors"
                style={{ color: "#e07b39" }}>
                Liên hệ đặt bàn →
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <div className="hidden" aria-hidden="true">
        <Link href="/" className="hover:text-[#e07b39] transition-colors font-medium">
          ← Quay về trang chủ Đặc Sản Phú Quốc
        </Link>
        <p className="mt-2 text-xs">© 2025 Đặc Sản Phú Quốc. Bảo lưu mọi quyền.</p>
      </div>
    </>
  );
}
