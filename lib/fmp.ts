// Financial Modeling Prep (FMP) client — PRIMARY data source.
// Free tier ~250 calls/day. Get a key at https://site.financialmodelingprep.com
// and set FMP_API_KEY in your .env. All calls are cached and fail soft to the
// curated sample dataset so the app keeps working without a key.

import { cached } from "./cache";
import type { CompanyFinancials, DealFacts, ScreenerMatch, ScreenerQuery } from "./types";
import { SAMPLE_FINANCIALS } from "./sample-data";

const BASE = "https://financialmodelingprep.com/stable";
const TTL = 60 * 30; // 30 min
const TIMEOUT_MS = 8000; // abort a stalled upstream so handlers don't hang

export function hasFmpKey(): boolean {
  return Boolean(process.env.FMP_API_KEY && process.env.FMP_API_KEY.trim());
}

function key(): string {
  return process.env.FMP_API_KEY!.trim();
}

async function fmpGet<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("apikey", key());
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Don't let Next persist this request to .next/cache/fetch-cache — the key
    // rides in the query string and would be written to disk in plaintext. Our
    // own lib/cache.ts handles rate-limit caching in memory instead.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FMP ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

/* --------------------------------------------------------- Company financials */

interface FmpProfile {
  symbol: string;
  companyName?: string;
  price?: number;
  mktCap?: number;
  marketCap?: number;
  sector?: string;
  country?: string;
  currency?: string;
  description?: string;
  website?: string;
  industry?: string;
  ceo?: string;
  fullTimeEmployees?: string | number;
  exchange?: string;
  exchangeShortName?: string;
  beta?: number;
}

interface FmpIncome {
  netIncome?: number;
  weightedAverageShsOutDil?: number;
  weightedAverageShsOut?: number;
}

/**
 * The FMP M&A feed often lists the specific filing security (warrants "SOUNW",
 * preferred "GNL-PA") rather than the common stock. Generate common-stock
 * candidates so financials resolve. Only used as fallbacks if the original misses.
 */
function commonStockCandidates(sym: string): string[] {
  const variants: string[] = [];
  const noPref = sym.replace(/-[A-Z]+$/, ""); // GNL-PA -> GNL, BRK-B -> BRK
  if (noPref !== sym && noPref.length >= 1) variants.push(noPref);
  const noClass = sym.replace(/[WUR]$/, ""); // SOUNW -> SOUN (warrant/unit/right)
  if (noClass !== sym && noClass.length >= 2) variants.push(noClass);
  return [...new Set(variants)];
}

/**
 * Fetch one symbol's financials. `profile` is on the free tier (price, market
 * cap). `income-statement` is premium-only — we attempt it (so paid plans get
 * real net income / share counts) but degrade gracefully when it's restricted,
 * deriving shares from marketCap/price and leaving netIncome 0 (the model then
 * lowers its dataCompleteness score instead of inventing earnings).
 */
async function fetchOneFinancials(sym: string): Promise<CompanyFinancials | null> {
  let p: FmpProfile | undefined;
  try {
    const profileArr = await fmpGet<FmpProfile[]>("profile", { symbol: sym });
    p = Array.isArray(profileArr) ? profileArr[0] : undefined;
  } catch {
    return null;
  }
  if (!p || !(p.price && p.price > 0)) return null;

  const price = p.price;
  const marketCap = p.marketCap ?? p.mktCap ?? 0;
  let netIncome = 0;
  let shares = price > 0 ? marketCap / price : 0;
  try {
    const incomeArr = await fmpGet<FmpIncome[]>("income-statement", {
      symbol: sym,
      period: "annual",
      limit: 1,
    });
    const inc = Array.isArray(incomeArr) ? incomeArr[0] : undefined;
    if (inc) {
      netIncome = inc.netIncome ?? 0;
      shares = inc.weightedAverageShsOutDil || inc.weightedAverageShsOut || shares;
    }
  } catch {
    /* income-statement is premium-only on the free tier — ignore. */
  }

  const employees =
    typeof p.fullTimeEmployees === "string"
      ? parseInt(p.fullTimeEmployees.replace(/[^0-9]/g, ""), 10) || undefined
      : p.fullTimeEmployees;

  return {
    symbol: sym,
    name: p.companyName ?? sym,
    price,
    sharesOutstanding: shares,
    netIncome,
    marketCap,
    sector: p.sector,
    country: p.country,
    currency: p.currency ?? "USD",
    description: p.description || undefined,
    website: p.website || undefined,
    industry: p.industry || undefined,
    ceo: p.ceo || undefined,
    employees,
    exchange: p.exchangeShortName || p.exchange || undefined,
    beta: typeof p.beta === "number" ? p.beta : undefined,
  };
}

/** Fetch a company's financials, resolving warrant/preferred tickers to common stock. */
export async function getCompanyFinancials(symbol: string): Promise<CompanyFinancials | null> {
  if (!symbol) return null;
  const sym = symbol.toUpperCase();
  if (!hasFmpKey()) return SAMPLE_FINANCIALS[sym] ?? null;

  return cached(`fmp:fin:${sym}`, TTL, async () => {
    // Try the literal symbol FIRST so a real common ticker that merely *looks*
    // like a warrant/preferred (e.g. CLW, FUR) isn't shadowed by a stripped
    // candidate (CL = Colgate). `fetchOneFinancials` rejects anything without a
    // real price, so a genuine warrant ticker (SOUNW, price 0/none) falls
    // through to its common-stock candidate (SOUN).
    for (const candidate of [sym, ...commonStockCandidates(sym)]) {
      const r = await fetchOneFinancials(candidate);
      if (r) return r;
    }
    return SAMPLE_FINANCIALS[sym] ?? null;
  });
}

/* ----------------------------------------------------------- M&A deal feed */

interface FmpMA {
  symbol?: string;
  companyName?: string;
  targetedCompanyName?: string;
  targetedSymbol?: string;
  transactionDate?: string;
  acceptanceTime?: string;
  url?: string;
  link?: string;
}

/** Latest completed/announced M&A filings from FMP's M&A feed. */
export async function getLatestMA(limit = 40): Promise<DealFacts[]> {
  if (!hasFmpKey()) return [];
  return cached(`fmp:ma:${limit}`, TTL, async () => {
    try {
      // NOTE: the free tier caps `limit` at 5 and rejects larger values with a
      // "Premium Query Parameter" error. Omit it (default returns ~100) and
      // slice client-side so this works on every plan.
      const rows = await fmpGet<FmpMA[]>("mergers-acquisitions-latest", { page: 0 });
      if (!Array.isArray(rows)) return [];
      // Drop noisy rows: filings missing a real acquirer or target, or where the
      // two are the same entity (the raw feed has plenty of these).
      const clean = rows.filter((r) => {
        const acq = (r.companyName ?? "").trim();
        const tgt = (r.targetedCompanyName ?? "").trim();
        return acq && tgt && acq.toLowerCase() !== tgt.toLowerCase();
      });
      return clean.slice(0, limit).map((r) => normalizeMA(r));
    } catch {
      return [];
    }
  });
}

/** Slugify a symbol or company name into a stable, URL-safe id fragment. */
function slug(s: string | undefined, fallback: string): string {
  const out = (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  return out || fallback;
}

function normalizeMA(r: FmpMA): DealFacts {
  const acquirerSym = r.symbol;
  const targetSym = r.targetedSymbol;
  // Derive the id from STABLE fields (symbols/names + filing date) rather than
  // the feed's array index: a later /api/model POST re-fetches the feed, whose
  // order can shift — an index-based id would then fail findDeal and 404.
  const date = (r.transactionDate ?? r.acceptanceTime ?? "").slice(0, 10).replace(/-/g, "");
  const acqKey = slug(acquirerSym ?? r.companyName, "acq");
  const tgtKey = slug(targetSym ?? r.targetedCompanyName, "tgt");
  const id = `ma-${acqKey}-${tgtKey}${date ? `-${date}` : ""}`;
  return {
    id,
    // Feed rows are freshly-filed merger filings (e.g. S-4) → pending/announced.
    status: "announced",
    acquirer: r.companyName ?? acquirerSym ?? "Unknown acquirer",
    acquirerSymbol: acquirerSym,
    target: r.targetedCompanyName ?? targetSym ?? "Unknown target",
    targetSymbol: targetSym,
    announcedDate: r.transactionDate ?? r.acceptanceTime,
    structure: "unknown",
    sourceUrl: r.url ?? r.link,
    sourceName: "FMP / SEC filing",
  };
}

/* --------------------------------------------------------------- Screener */

interface FmpScreenerRow {
  symbol: string;
  companyName?: string;
  sector?: string;
  industry?: string;
  country?: string;
  marketCap?: number;
  price?: number;
  beta?: number;
}

/** Run FMP's company screener with sector / market-cap / country filters. */
export async function screenCompanies(q: ScreenerQuery): Promise<ScreenerRowRaw[]> {
  if (!hasFmpKey()) return [];
  const params: Record<string, string | number | undefined> = {
    sector: q.targetSector,
    country: q.targetRegion,
    marketCapMoreThan: q.marketCapMin,
    marketCapLowerThan: q.marketCapMax,
    isActivelyTrading: "true",
    limit: q.limit ?? 60,
  };
  const cacheKey = `fmp:screen:${JSON.stringify(params)}`;
  return cached(cacheKey, TTL, async () => {
    try {
      const rows = await fmpGet<FmpScreenerRow[]>("company-screener", params);
      if (!Array.isArray(rows)) return [];
      return rows.map((r) => ({
        symbol: r.symbol,
        name: r.companyName ?? r.symbol,
        sector: r.sector,
        industry: r.industry,
        country: r.country,
        marketCap: r.marketCap ?? 0,
        price: r.price ?? 0,
        beta: r.beta,
      }));
    } catch {
      return [];
    }
  });
}

export interface ScreenerRowRaw {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  country?: string;
  marketCap: number;
  price: number;
  beta?: number;
}
