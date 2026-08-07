import type { SiteSettings } from "@/lib/data";

function highlightTitle(title: string, highlight: string) {
  if (!highlight) return <>{title}</>;
  const idx = title.indexOf(highlight);
  if (idx === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, idx)}
      <span style={{ color: "#f9c74f" }}>{highlight}</span>
      {title.slice(idx + highlight.length)}
    </>
  );
}

export default function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section
      className="relative flex items-center justify-center text-white overflow-hidden pt-14 pb-20"
      style={{
        background: "linear-gradient(135deg, #7b3f00 0%, #c4612a 50%, #e07b39 100%)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ background: "#f9c74f" }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"
        style={{ background: "#f9c74f" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 opacity-80">
          {settings.tagline}
        </p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
          {highlightTitle(settings.heroTitle, settings.heroHighlight)}
        </h1>
        <p className="text-base md:text-lg opacity-85 max-w-xl mx-auto mb-7 leading-relaxed">
          {settings.heroDesc}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#gioi-thieu"
            className="px-7 py-2.5 rounded-full font-semibold text-white border-2 border-white hover:bg-white hover:text-[#e07b39] transition-all text-sm">
            Khám phá ngay
          </a>
          <a href="#ban-do"
            className="px-7 py-2.5 rounded-full font-semibold text-sm"
            style={{ backgroundColor: "#f9c74f", color: "#7b3f00" }}>
            📍 Xem bản đồ
          </a>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm mx-auto">
          {settings.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-bold" style={{ color: "#f9c74f" }}>{s.num}</div>
              <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="#fffbf5" />
        </svg>
      </div>
    </section>
  );
}
