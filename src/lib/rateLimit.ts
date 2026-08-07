type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((v, k) => { if (now > v.resetAt) store.delete(k); });
}, 10 * 60 * 1000);

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}
