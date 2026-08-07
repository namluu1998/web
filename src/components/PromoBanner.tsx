"use client";
import { useState } from "react";

export default function PromoBanner({ text, phone }: { text: string; phone: string }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const telPhone = phone.replace(/\s+/g, "");

  // Replace phone number in text with a clickable link
  const parts = text.split(phone);

  return (
    <div className="relative z-[65] text-white text-sm text-center py-2 px-10 font-medium"
      style={{ background: "linear-gradient(90deg, #c4612a, #e07b39, #f9c74f, #e07b39, #c4612a)" }}>
      {parts.length > 1 ? (
        <>
          {parts[0]}
          <a href={`tel:${telPhone}`} className="underline font-bold">{phone}</a>
          {parts.slice(1).join(phone)}
        </>
      ) : (
        text
      )}
      <button onClick={() => setClosed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
        aria-label="Đóng">✕</button>
    </div>
  );
}
