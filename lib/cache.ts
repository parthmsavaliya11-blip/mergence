// Tiny in-memory TTL cache to keep us under free-tier API rate limits.
// Survives across requests within a single server process (good enough for
// dev + a single Vercel serverless instance). Swap for Redis/KV at scale.

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
// Tracks loads currently in flight so concurrent callers for the same key share
// one upstream request instead of each firing their own (single-flight). This
// matters under FMP's ~250/day limit: resolving the same symbol for acquirer +
// target, or many parallel lookups during listDeals enrichment, would otherwise
// multiply provider calls.
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const load = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, load);
  return load;
}

export function cacheClear(): void {
  store.clear();
  inflight.clear();
}
