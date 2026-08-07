"use client";
import { useState, useEffect } from "react";

/* Icon Zalo chính xác theo brand guideline */
function ZaloIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bubble chat background */}
      <path
        d="M14 2C7.37 2 2 7.03 2 13.22c0 3.56 1.74 6.74 4.47 8.84l-.9 3.94 4.3-1.42A12.5 12.5 0 0014 24.44c6.63 0 12-5.03 12-11.22C26 7.03 20.63 2 14 2z"
        fill="white"
      />
      {/* Chữ Z */}
      <path
        d="M9.5 10.5h5.8l-5.8 7H16v-1.5h-5.5l5.7-7H9.5v1.5z"
        fill="#0068FF"
      />
      {/* Chữ a */}
      <path
        d="M17.2 13.2c0-1.3 1-2.2 2.3-2.2s2.3.9 2.3 2.2v4.3h-1.4v-.7c-.4.5-1 .8-1.6.8-1.2 0-2.1-.9-2.1-2 0-1.2.9-2 2.2-2h1.5v-.2c0-.6-.4-1-1-.1l-.1-.1c-.5 0-.9.4-.9 1H17.2zm3.2 1.3H19c-.5 0-.8.3-.8.7s.3.7.8.7c.6 0 1.2-.4 1.2-1v-.4z"
        fill="#0068FF"
      />
    </svg>
  );
}

export default function FloatingButtons({ phone }: { phone: string }) {
  const [showTop, setShowTop] = useState(false);
  const telPhone = phone.replace(/\s+/g, "");
  const zaloUrl = `https://zalo.me/${telPhone}`;

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-24 right-5 z-[60] flex flex-col items-center gap-3 md:bottom-10 md:right-6">
      {/* Zalo */}
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat Zalo"
        className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: "#0068FF" }}
      >
        <ZaloIcon />
      </a>

      {/* Gọi điện */}
      <a
        href={`tel:${telPhone}`}
        title="Gọi điện ngay"
        className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-110"
        style={{ backgroundColor: "#22c55e" }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
        </svg>
      </a>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Lên đầu trang"
          className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white transition-all hover:scale-110"
          style={{ backgroundColor: "#e07b39" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
