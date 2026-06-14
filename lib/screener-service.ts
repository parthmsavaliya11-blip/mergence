// Screener orchestration: runs the FMP company screener, then scores/ranks
// matches against the user's stated criteria + rationale. Falls back to the
// curated company universe when no API key is present.

import type { ScreenerMatch, ScreenerQuery } from "./types";
import { screenCompanies, hasFmpKey, type ScreenerRowRaw } from "./fmp";
import { SAMPLE_FINANCIALS } from "./sample-data";

// Lightweight rationale -> sector/keyword hints, so a free-text reason nudges
// ranking (e.g. "technological development" favors Technology targets).
const RATIONALE_HINTS: { keywords: string[]; sectors: string[]; note: string }[] = [
  { keywords: ["tech", "technolog", "software", "ai", "digital", "data"], sectors: ["Technology", "Communication Services"], note: "technology capability" },
  { keywords: ["global", "expansion", "international", "geograph", "market entry"], sectors: [], note: "geographic expansion" },
  { keywords: ["health", "pharma", "biotech", "drug", "medical"], sectors: ["Healthcare"], note: "healthcare reach" },
  { keywords: ["energy", "oil", "gas", "renewable", "power"], sectors: ["Energy", "Utilities"], note: "energy assets" },
  { keywords: ["financ", "bank", "payment", "fintech", "insurance"], sectors: ["Financial Services"], note: "financial services" },
  { keywords: ["consumer", "retail", "brand", "product"], sectors: ["Consumer Cyclical", "Consumer Defensive"], note: "consumer brand" },
  { keywords: ["vertical", "supply", "integrat"], sectors: [], note: "vertical integration" },
];

const MAX_RESULTS = 100;

/**
 * Coerce/clamp an untrusted screener query. The API casts the POST body to
 * ScreenerQuery without validation, so numeric fields can arrive as NaN,
 * negatives, or absurd values (e.g. limit: 1e9 → slice(0, 1e9)). Normalize here.
 */
function sanitizeQuery(q: ScreenerQuery): ScreenerQuery {
  const numOrUndef = (v: unknown): number | undefined =>
    typeof v === "number" && isFinite(v) && v >= 0 ? v : undefined;
  const limit = Math.min(MAX_RESULTS, Math.max(1, numOrUndef(q.limit) ?? 24));
  return {
    ...q,
    marketCapMin: numOrUndef(q.marketCapMin),
    marketCapMax: numOrUndef(q.marketCapMax),
    ownMarketCap: numOrUndef(q.ownMarketCap),
    limit,
  };
}

export async function runScreener(rawQuery: ScreenerQuery): Promise<{
  matches: ScreenerMatch[];
  live: boolean;
}> {
  const q = sanitizeQuery(rawQuery);
  // FMP's company-screener endpoint is paid-only. If a key is present we try it,
  // but fall back to the curated universe whenever it returns nothing (no key,
  // restricted endpoint, or no matches) so the screener never appears broken.
  let rows: ScreenerRowRaw[] = [];
  let live = false;
  if (hasFmpKey()) {
    rows = await screenCompanies(q);
    live = rows.length > 0;
  }
  if (rows.length === 0) {
    rows = fallbackUniverse(q);
    live = false;
  }
  const matches = rows
    .filter((r) => r.symbol)
    .map((r) => scoreMatch(r, q))
    // Don't suggest the user's own company.
    .filter((m) => !q.ownCompanyName || m.name.toLowerCase() !== q.ownCompanyName.toLowerCase())
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, q.limit ?? 24);
  return { matches, live };
}

function scoreMatch(r: ScreenerRowRaw, q: ScreenerQuery): ScreenerMatch {
  const reasons: string[] = [];
  let score = 50;

  if (q.targetSector && r.sector) {
    if (r.sector.toLowerCase() === q.targetSector.toLowerCase()) {
      score += 20;
      reasons.push(`Sector match: ${r.sector}`);
    } else {
      score -= 10;
    }
  }

  if (q.targetRegion && r.country) {
    if (r.country.toLowerCase() === q.targetRegion.toLowerCase()) {
      score += 12;
      reasons.push(`Region match: ${r.country}`);
    }
  }

  if (q.marketCapMin && r.marketCap >= q.marketCapMin) {
    score += 5;
  }
  if (q.marketCapMax && r.marketCap <= q.marketCapMax) {
    score += 5;
  }
  if (q.marketCapMin || q.marketCapMax) {
    reasons.push(`Within valuation band`);
  }

  // Relative-size sanity: a digestible target is < ~60% of the acquirer.
  if (q.ownMarketCap && r.marketCap > 0) {
    const ratio = r.marketCap / q.ownMarketCap;
    if (ratio <= 0.6) {
      score += 8;
      reasons.push(`Digestible size (~${(ratio * 100).toFixed(0)}% of your cap)`);
    } else if (ratio > 1.5) {
      score -= 12;
      reasons.push(`Larger than you — a merger-of-equals / reverse play`);
    }
  }

  // Rationale keyword nudges.
  if (q.rationale) {
    const rl = q.rationale.toLowerCase();
    for (const hint of RATIONALE_HINTS) {
      if (hint.keywords.some((k) => rl.includes(k))) {
        if (hint.sectors.length === 0) {
          score += 3;
          reasons.push(`Supports ${hint.note}`);
        } else if (r.sector && hint.sectors.some((s) => s.toLowerCase() === r.sector!.toLowerCase())) {
          score += 10;
          reasons.push(`Fits "${hint.note}" rationale`);
        }
      }
    }
  }

  return {
    symbol: r.symbol,
    name: r.name,
    sector: r.sector,
    industry: r.industry,
    country: r.country,
    marketCap: r.marketCap,
    price: r.price,
    beta: r.beta,
    matchReasons: reasons.length ? reasons : ["Meets baseline filters"],
    matchScore: Math.max(0, Math.min(100, Math.round(score))),
  };
}

function fallbackUniverse(q: ScreenerQuery): ScreenerRowRaw[] {
  return Object.values(SAMPLE_FINANCIALS)
    .filter((c) => c.price > 0)
    .map((c) => ({
      symbol: c.symbol,
      name: c.name,
      sector: c.sector,
      industry: undefined,
      country: c.country,
      marketCap: c.marketCap,
      price: c.price,
      beta: undefined,
    }));
}
