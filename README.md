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

## Hosting Notes

This project currently stores editable content in JSON files under `data/` and uploaded images under `public/uploads/`. Use a VPS or hosting plan with persistent writable disk for this version.

For serverless hosting such as Vercel, Netlify Functions, or similar immutable deployments, move `data/` to a database and uploads to object storage before relying on the admin panel in production.
