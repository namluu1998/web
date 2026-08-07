export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import type { WithContext, Restaurant } from "schema-dts";
import { db } from "@/lib/data";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GioiThieu from "@/components/GioiThieu";
import Menu from "@/components/Menu";
import Gallery from "@/components/Gallery";
import DanhGia from "@/components/DanhGia";
import BaiViet from "@/components/BaiViet";
import InfoRow from "@/components/InfoRow";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import MobileCTA from "@/components/MobileCTA";
import ScrollProgress from "@/components/ScrollProgress";
import PromoBanner from "@/components/PromoBanner";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: { absolute: "Đặc Sản Phú Quốc | Hương Vị Đảo Ngọc" },
  description: "Bún Quậy Như Ý — đặc sản trứ danh số 1 Phú Quốc. Hải sản tươi sống, nước chấm tự pha độc đáo. Đ. Trần Phú, Khu Phố 9, Phú Quốc. Mở 06:00–22:00. Gọi 0297 123 4567.",
  alternates: { canonical: "https://dacsan-phuquoc.vn" },
};

const restaurantSchema: WithContext<Restaurant> = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Bún Quậy Như Ý",
  description: "Quán bún quậy đặc sản Phú Quốc nổi tiếng với hải sản tươi và nước chấm tự pha độc đáo.",
  url: "https://dacsan-phuquoc.vn",
  telephone: "+842971234567",
  priceRange: "45.000đ – 75.000đ",
  servesCuisine: "Ẩm thực Việt Nam",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Đường Trần Phú, Xóm Chài, Khu Phố 9",
    addressLocality: "Phú Quốc",
    addressRegion: "Kiên Giang",
    addressCountry: "VN",
  },
  geo: { "@type": "GeoCoordinates", latitude: 10.2370, longitude: 103.9495 },
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "06:00", closes: "22:00",
  }],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "1200", bestRating: "5" },
  menu: "https://dacsan-phuquoc.vn/#menu",
  hasMap: "https://maps.app.goo.gl/nLeTLiePPoe5PAvC8",
};

export default function HomePage() {
  const s = db.settings.get();
  const faqs = db.faqs.getAll();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ScrollProgress />
      <PromoBanner text={s.promoBanner} phone={s.phone} />
      <Navbar settings={s} />
      <main>
        <Hero settings={s} />
        <GioiThieu settings={s} />
        <Menu />
        <Gallery />
        <DanhGia />
        <BaiViet />
        <InfoRow phone={s.phone} address={s.address} hours={s.hours} mapShare={s.mapEmbed} faqs={faqs} />
      </main>
      <Footer settings={s} />
      <FloatingButtons phone={s.phone} />
      <MobileCTA phone={s.phone} />
      <CookieConsent />
    </>
  );
}
