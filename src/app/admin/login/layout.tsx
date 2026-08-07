import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Đăng nhập | Admin — Đặc Sản Phú Quốc" },
  description: "Trang đăng nhập quản trị nội bộ.",
  robots: { index: false, follow: false },
  openGraph: undefined,
  twitter: undefined,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
