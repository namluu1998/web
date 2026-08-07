import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(file: string): T {
  const filePath = path.join(DATA_DIR, file);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function writeJson(file: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export type Post = {
  id: string;
  emoji: string;
  title: string;
  date: string;
  views: string;
  excerpt: string;
  content: string;
  tag: string;
  tags?: string;
  published: boolean;
  featured?: boolean;
};

export type MenuItem = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  price: string;
  tag: string;
  available: boolean;
};

export type Faq = {
  id: string;
  q: string;
  a: string;
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  heroTitle: string;
  heroHighlight: string;
  heroDesc: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  mapEmbed: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  promoBanner: string;
  stats: { num: string; label: string }[];
  logoImage?: string;
  introImage?: string;
  galleryImages?: string[];
  footerTagline?: string;
};

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  guests: string;
  date: string;
  time: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "done";
};

export const db = {
  posts: {
    getAll: () => readJson<Post[]>("posts.json"),
    getPublished: () => readJson<Post[]>("posts.json").filter((p) => p.published),
    getById: (id: string) => readJson<Post[]>("posts.json").find((p) => p.id === id),
    save: (posts: Post[]) => writeJson("posts.json", posts),
    incrementViews: (id: string): Post | undefined => {
      const posts = readJson<Post[]>("posts.json");
      const idx = posts.findIndex((p) => p.id === id);
      if (idx === -1) return undefined;
      const num = parseInt(String(posts[idx].views).replace(/[.\s]/g, ""), 10) || 0;
      posts[idx] = { ...posts[idx], views: (num + 1).toLocaleString("vi-VN") };
      writeJson("posts.json", posts);
      return posts[idx];
    },
  },
  menu: {
    getAll: () => readJson<MenuItem[]>("menu.json"),
    getAvailable: () => readJson<MenuItem[]>("menu.json").filter((m) => m.available),
    save: (items: MenuItem[]) => writeJson("menu.json", items),
  },
  settings: {
    get: () => readJson<SiteSettings>("settings.json"),
    save: (s: SiteSettings) => writeJson("settings.json", s),
  },
  reservations: {
    getAll: () => readJson<Reservation[]>("reservations.json"),
    save: (r: Reservation[]) => writeJson("reservations.json", r),
    add: (r: Omit<Reservation, "id" | "createdAt" | "status">) => {
      const all = readJson<Reservation[]>("reservations.json");
      const newItem: Reservation = {
        ...r,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: "new",
      };
      writeJson("reservations.json", [newItem, ...all]);
      return newItem;
    },
  },
  faqs: {
    getAll: () => readJson<Faq[]>("faqs.json"),
    save: (items: Faq[]) => writeJson("faqs.json", items),
  },
};
