import type { Metadata } from "next";
import { db } from "@/lib/data";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = db.settings.get();
  const logoImage = s.logoImage || "";

  return {
    metadataBase: new URL("https://dacsan-phuquoc.vn"),
    title: {
      default: "Đặc Sản Phú Quốc | Hương Vị Đảo Ngọc",
      template: "%s | Đặc Sản Phú Quốc",
    },
    description:
      "Khám phá những đặc sản nổi tiếng của Phú Quốc: Bún quậy, hải sản tươi sống, nước mắm truyền thống và nhiều món ngon khác từ đảo ngọc.",
    keywords: [
      "đặc sản Phú Quốc", "bún quậy Phú Quốc", "ăn gì ở Phú Quốc", "hải sản Phú Quốc",
      "Bún Quậy Như Ý", "nhà hàng Phú Quốc", "nước mắm Phú Quốc", "ẩm thực Phú Quốc",
    ],
    authors: [{ name: "Đặc Sản Phú Quốc" }],
    ...(logoImage && {
      icons: {
        icon: logoImage,
        apple: logoImage,
        shortcut: logoImage,
      },
    }),
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: "https://dacsan-phuquoc.vn",
      siteName: "Đặc Sản Phú Quốc",
      title: "Đặc Sản Phú Quốc | Hương Vị Đảo Ngọc",
      description: "Khám phá những đặc sản nổi tiếng của Phú Quốc: Bún quậy, hải sản tươi sống, nước mắm truyền thống và nhiều món ngon khác từ đảo ngọc.",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Đặc Sản Phú Quốc" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Đặc Sản Phú Quốc | Hương Vị Đảo Ngọc",
      description: "Bún quậy, hải sản tươi sống, nước mắm truyền thống — đặc sản đảo ngọc Phú Quốc.",
      images: ["/og-image.jpg"],
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className="font-sans bg-white text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
