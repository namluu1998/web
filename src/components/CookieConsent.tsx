"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_accepted")) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_accepted", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:max-w-sm z-40 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        🍪 Chúng tôi dùng cookie để cải thiện trải nghiệm của bạn. Tiếp tục sử dụng nghĩa là bạn đồng ý với{" "}
        <a href="#" className="underline" style={{ color: "#e07b39" }}>Chính sách cookie</a>.
      </p>
      <div className="flex gap-2">
        <button
          onClick={accept}
          className="flex-1 py-2 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: "#e07b39" }}>
          Đồng ý
        </button>
        <button
          onClick={() => setVisible(false)}
          className="flex-1 py-2 rounded-full text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
          Từ chối
        </button>
      </div>
    </div>
  );
}


