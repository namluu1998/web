"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type Review = {
  name: string;
  stars: number;
  date: string;
  text: string;
  profilePhoto?: string | null;
};

export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right">("left");
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const perPage = usePerPage();
  const total = reviews.length;
  const maxIndex = Math.max(0, total - perPage);

  const goTo = useCallback((idx: number, dir: "left" | "right" = "left") => {
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setCurrent(idx);
      setVisible(true);
    }, 220);
  }, []);

  const next = useCallback(() => {
    goTo(current >= maxIndex ? 0 : current + 1, "left");
  }, [current, maxIndex, goTo]);

  const prev = useCallback(() => {
    goTo(current <= 0 ? maxIndex : current - 1, "right");
  }, [current, maxIndex, goTo]);

  useEffect(() => {
    if (paused || total <= perPage) return;
    timerRef.current = setTimeout(next, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next, total, perPage]);

  const visible3 = reviews.slice(current, current + perPage);

  const translateClass = visible
    ? "opacity-100 translate-x-0"
    : animDir === "left"
    ? "opacity-0 -translate-x-6"
    : "opacity-0 translate-x-6";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cards */}
      <div className={`grid gap-6 transition-all duration-300 ease-out ${translateClass}`}
        style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}>
        {visible3.map((r, i) => (
          <ReviewCard key={`${current}-${i}`} r={r} />
        ))}
      </div>

      {/* Controls */}
      {total > perPage && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:opacity-80 active:scale-95"
            style={{ backgroundColor: "#1a5276" }}
            aria-label="Trước"
          >
            ‹
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > current ? "left" : "right")}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  backgroundColor: i === current ? "#e07b39" : "#d1d5db",
                }}
                aria-label={`Trang ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:opacity-80 active:scale-95"
            style={{ backgroundColor: "#1a5276" }}
            aria-label="Sau"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {r.profilePhoto ? (
          <Image
            src={r.profilePhoto}
            alt={r.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
            👤
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-800">{r.name}</div>
          <div className="text-xs text-gray-400">{r.date}</div>
        </div>
      </div>
      <div className="text-yellow-400 text-base">
        {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
    </div>
  );
}

function usePerPage() {
  const [per, setPer] = useState(3);
  useEffect(() => {
    function update() {
      setPer(window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return per;
}
