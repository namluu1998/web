import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { can, getSessionUserFromRequest } from "@/lib/auth";

const REVIEWS_FILE = path.join(process.cwd(), "data", "reviews.json");

type GPlacesReview = {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
};

export async function GET(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "reviews")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const googleApiKeyConfigured = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  try {
    const raw = fs.readFileSync(REVIEWS_FILE, "utf8");
    return NextResponse.json({ ...JSON.parse(raw), googleApiKeyConfigured });
  } catch {
    return NextResponse.json({ reviews: [], rating: 0, totalRatings: 0, lastFetched: null, googleApiKeyConfigured });
  }
}

export async function POST(req: NextRequest) {
  const me = getSessionUserFromRequest(req);
  if (!can(me, "reviews")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY chưa được cấu hình trong .env.local" }, { status: 400 });
  }

  // Step 1: find place_id
  const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=B%C3%BAn+Qu%E1%BA%ADy+Nh%C6%B0+%C3%9D&inputtype=textquery&fields=place_id&locationbias=circle%3A2000%4010.2313774%2C103.9537616&key=${apiKey}`;
  const findRes = await fetch(findUrl);
  const findData = await findRes.json();
  const placeId: string | undefined = findData.candidates?.[0]?.place_id;

  if (!placeId) {
    return NextResponse.json({ error: "Không tìm thấy địa điểm. Kiểm tra lại API key hoặc tên quán." }, { status: 404 });
  }

  // Step 2: get place details + reviews
  const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&language=vi&reviews_sort=newest&key=${apiKey}`;
  const detailRes = await fetch(detailUrl);
  const detailData = await detailRes.json();
  const result = detailData.result ?? {};

  const reviews = ((result.reviews ?? []) as GPlacesReview[])
    .filter((r) => r.rating >= 4 && r.text?.trim())
    .map((r) => ({
      name: r.author_name,
      stars: r.rating,
      date: new Date(r.time * 1000).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      text: r.text.trim(),
      profilePhoto: r.profile_photo_url ?? null,
    }));

  const data = {
    reviews,
    rating: result.rating ?? 0,
    totalRatings: result.user_ratings_total ?? 0,
    lastFetched: new Date().toISOString(),
  };

  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(data, null, 2), "utf8");
  return NextResponse.json(data);
}
