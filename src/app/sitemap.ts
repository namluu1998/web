import type { MetadataRoute } from "next";
import { db } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dacsan-phuquoc.vn";

  const posts = db.posts.getPublished().map((post) => ({
    url: `${baseUrl}/bai-viet/${post.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...posts,
  ];
}
