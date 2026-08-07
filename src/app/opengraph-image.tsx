import { ImageResponse } from "next/og";

export const alt = "Dac San Phu Quoc - Bun Quay Nhu Y";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7b3f00 0%, #c4612a 52%, #f2b35b 100%)",
          padding: "60px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "34px" }}>
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: 999,
              border: "4px solid rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            PQ
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Dac San Phu Quoc
          </div>
        </div>

        <div
          style={{
            fontSize: 74,
            fontWeight: 900,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "22px",
          }}
        >
          Bun Quay Nhu Y
        </div>

        <div
          style={{
            fontSize: 34,
            color: "rgba(255,255,255,0.88)",
            textAlign: "center",
            marginBottom: "34px",
          }}
        >
          Huong vi dao ngoc Phu Quoc
        </div>

        <div
          style={{
            display: "flex",
            gap: "34px",
            background: "rgba(0,0,0,0.24)",
            borderRadius: "16px",
            padding: "18px 46px",
          }}
        >
          {[
            { num: "4.8/5", label: "Google Maps" },
            { num: "1,200+", label: "Danh gia" },
            { num: "06:00-22:00", label: "Mo cua" },
          ].map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>{s.num}</span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.72)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
