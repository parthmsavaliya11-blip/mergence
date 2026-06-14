// News client for RUMORED deals. Uses Marketaux (free 100/day, finance + global)
// when MARKETAUX_API_KEY is set. Falls back to FMP stock-news if available, then
// to the curated sample rumors. Rumor detection is keyword-based and best-effort.

import { cached } from "./cache";
import type { DealFacts } from "./types";

const TTL = 60 * 20; // 20 min
const RUMOR_TERMS = [
  "in talks",
  "exploring a sale",
  "considering a bid",
  "approached",
  "takeover interest",
  "merger talks",
  "weighing a deal",
  "potential acquisition",
  "rumored",
];

export function hasNewsKey(): boolean {
  return Boolean(process.env.MARKETAUX_API_KEY && process.env.MARKETAUX_API_KEY.trim());
}

interface MarketauxArticle {
  uuid: string;
  title: string;
  description?: string;
  snippet?: string;
  url: string;
  source?: string;
  published_at?: string;
  entities?: { symbol?: string; name?: string }[];
}
interface MarketauxResponse {
  data?: MarketauxArticle[];
}

/** Pull finance news and surface likely M&A rumors. */
export async function getRumoredDeals(limit = 20): Promise<DealFacts[]> {
  if (!hasNewsKey()) return [];
  return cached(`news:rumors:${limit}`, TTL, async () => {
    try {
      const url = new URL("https://api.marketaux.com/v1/news/all");
      url.searchParams.set("api_token", process.env.MARKETAUX_API_KEY!.trim());
      url.searchParams.set("language", "en");
      url.searchParams.set("search", "merger OR acquisition OR takeover OR bid");
      url.searchParams.set("filter_entities", "true");
      url.searchParams.set("limit", String(limit));
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        // Don't persist the api_token-bearing URL to .next/cache; we cache in memory.
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = (await res.json()) as MarketauxResponse;
      const articles = data.data ?? [];
      return articles
        .filter((a) => looksLikeRumor(`${a.title} ${a.description ?? ""} ${a.snippet ?? ""}`))
        .map((a, i) => articleToDeal(a, i));
    } catch {
      return [];
    }
  });
}

function looksLikeRumor(text: string): boolean {
  const t = text.toLowerCase();
  return RUMOR_TERMS.some((term) => t.includes(term));
}

function articleToDeal(a: MarketauxArticle, i: number): DealFacts {
  const ent = a.entities?.[0];
  const target = ent?.name ?? "Target named in report";
  return {
    id: `rumor-news-${a.uuid?.slice(0, 8) ?? i}`,
    status: "rumored",
    acquirer: "Reported acquirer / market speculation",
    target,
    targetSymbol: ent?.symbol,
    announcedDate: a.published_at,
    structure: "unknown",
    confidence: "low",
    rationale: a.description ?? a.snippet ?? a.title,
    sourceUrl: a.url,
    sourceName: a.source ?? "News",
  };
}
