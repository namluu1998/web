# Dac San Phu Quoc

Next.js 16 landing page and admin panel for restaurant content, menu, reviews, reservations, and site settings.

## Local Development

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by execution policy.

## Required Environment Variables

Create `.env.local` for local work and configure the same variables in production hosting:

```env
SESSION_SECRET=change-this-to-at-least-32-random-characters
ADMIN_PASSWORD=change-this-to-at-least-12-characters
GOOGLE_PLACES_API_KEY=
```

`SESSION_SECRET` is required for admin sessions and password hashing. `ADMIN_PASSWORD` is only used when `data/users.json` is missing or empty and the first admin user must be created.

## Production Checks

Run these before deploying:

```bash
npm.cmd run lint
npm.cmd run build
```

## Dish URLs, per-dish SEO, and Code Scripts (`static-site/`)

Menu rows sharing a `group` are variants of one product, so a slug identifies a
**product**, not a variant row — the three Bún Quậy sizes share
`/mon/bun-quay-phu-quoc` instead of getting three URLs with the same content.
Product pages use slug URLs: `/mon/<slug>` (previously `/mon?id=<id>`).

- The slug comes from **Thực đơn → sửa món → SEO → Đường dẫn**; leave it blank and
  it is generated from the product name — the group when there is one, otherwise
  the dish name (`Bún Quậy Phú Quốc` → `bun-quay-phu-quoc`).
- Editing SEO on any variant writes it to every variant in the group, so the
  product keeps one URL and one set of tags however you reach it.
- The same SEO block sets the **Tiêu đề** and **Mô tả** used for `<title>`,
  `meta[description]`, Open Graph, Twitter cards, and JSON-LD.
- Old URLs keep working: `/mon?id=<id>` still resolves, and the previous slug is
  kept in `slugAliases` when an admin changes the path, so shared and indexed
  links do not break.
- **Cài đặt → 🧩 Code Scripts** holds four snippet fields (Google Analytics,
  Google Remarketing, Facebook Pixel, Livechat) injected into `<head>` on every
  public page. `/admin/` is always excluded. A snippet in the Google Analytics
  field disables the hardcoded GA4 tag in `assets/js/common.js` so views are not
  double-counted.

Articles follow the same pattern at `/bai-viet/<slug>`, with the SEO block on
the post form and the slug derived from the title. Posts have no variants, so
each post is simply one URL.

### Page-to-page loading

Public pages fetch `api.php?action=init` (the whole database, ~64 KB) and render
nothing until it resolves, so every navigation used to blank the content area.
Two changes fix that:

- `storage.js` caches the init payload in `sessionStorage` (60s TTL, cleared on
  every write), so the second and later navigations in a tab render immediately
  and revalidate in the background. `window.dbFresh` resolves once the
  background refresh lands, if a page ever needs guaranteed-fresh data.
- The seed files (`data.js`, `data-posts.js`, `data-reservations.js`, ~96 KB)
  are only used to populate an empty database, so public pages no longer ship
  them as `<script>` tags — `storage.js` loads them on demand when seeding is
  actually needed. Admin pages keep the tags because they init synchronously.

Trimming the init payload itself is a server-side change; see the php-patch
README.

The server half of the slug routing lives in `mon.php`, which is gitignored
(it embeds the live DB credentials). Apply it with
[`static-site/php-patch/README.md`](static-site/php-patch/README.md) — the
shared helper `static-site/php-patch/seo-slug.php` is committed and contains no
secrets.

## Hosting Notes

This project currently stores editable content in JSON files under `data/` and uploaded images under `public/uploads/`. Use a VPS or hosting plan with persistent writable disk for this version.

For serverless hosting such as Vercel, Netlify Functions, or similar immutable deployments, move `data/` to a database and uploads to object storage before relying on the admin panel in production.
