// Finnhub client — FREE earnings fallback (60 calls/min, no hard daily cap).
// FMP's free tier doesn't expose net income / EPS / shares (income-statement is
// premium). Finnhub's free "Basic Financials" (/stock/metric) + "Profile2"
// endpoints do, so we use them to fill the earnings the accretion model needs.
// Get a free key at https://finnhub.io and set FINNHUB_API_KEY in .env.

import { cached } from "./cache";

const BASE = "https://finnhub.io/api/v1";
const TTL = 60 * 60; // 1h
const TIMEOUT_MS = 8000; // abort a stalled upstream so handlers don't hang

export function hasFinnhubKey(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY && process.env.FINNHUB_API_KEY.trim());
}

function key(): string {
  return process.env.FINNHUB_API_KEY!.trim();
}

export interface FinnhubFundamentals {
  netIncome: number;
  sharesOutstanding: number;
  eps: number;
  price?: number;
  marketCap?: number;
  name?: string;
  sector?: string;
  currency?: string;
}

interface FinnhubMetric {
  metric?: Record<string, number | null>;
}
interface FinnhubProfile2 {
  name?: string;
  shareOutstanding?: number; // in millions
  marketCapitalization?: number; // in millions
  finnhubIndustry?: string;
  currency?: string;
}

/** Fetch EPS + shares (→ net income) for a symbol from Finnhub's free tier. */
export async function getFinnhubFundamentals(
  symbol: string,
): Promise<FinnhubFundamentals | null> {
  if (!hasFinnhubKey() || !symbol) return null;
  const sym = symbol.toUpperCase();
  return cached(`finnhub:fund:${sym}`, TTL, async () => {
    try {
      const [metricRes, profRes] = await Promise.all([
        // cache: "no-store" — the token rides in the query string; keep it out
        // of .next/cache/fetch-cache. lib/cache.ts handles caching in memory.
        fetch(`${BASE}/stock/metric?symbol=${encodeURIComponent(sym)}&metric=all&token=${key()}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        }),
        fetch(`${BASE}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${key()}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        }),
      ]);
      if (!metricRes.ok || !profRes.ok) return null;
      const metric = (await metricRes.json()) as FinnhubMetric;
      const prof = (await profRes.json()) as FinnhubProfile2;
      const m = metric?.metric ?? {};

      const eps =
        num(m.epsTTM) ??
        num(m.epsAnnual) ??
        num(m["epsBasicExclExtraItemsTTM"]) ??
        num(m["epsInclExtraItemsTTM"]) ??
        0;
      const sharesM = prof?.shareOutstanding ?? 0; // millions
      const shares = sharesM * 1e6;
      const marketCap = (prof?.marketCapitalization ?? 0) * 1e6; // millions -> absolute

      // Approximate net income as (TTM EPS x current shares); that's what the
      // model consumes. This mixes a trailing-twelve-month EPS with a point-in-
      // time share count, so it can diverge from reported net income when shares
      // changed materially over the year (buybacks/issuance). Best-effort on the
      // free tier — `eps` may legitimately be negative for a loss-making target.
      const netIncome = eps && shares ? eps * shares : 0;
      if (!shares && !eps) return null;

      return {
        netIncome,
        sharesOutstanding: shares,
        eps,
        marketCap,
        name: prof?.name,
        sector: prof?.finnhubIndustry,
        currency: prof?.currency ?? "USD",
      };
    } catch {
      return null;
    }
  });
}

function num(v: number | null | undefined): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}
