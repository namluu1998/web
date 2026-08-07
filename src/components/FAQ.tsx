import type { WithContext, FAQPage } from "schema-dts";
import type { Faq } from "@/lib/data";
import { db } from "@/lib/data";
import FAQClient from "./FAQClient";

export default function FAQ() {
  const faqs: Faq[] = db.faqs.getAll();

  const jsonLd: WithContext<FAQPage> = {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClient faqs={faqs} />
    </>
  );
}
