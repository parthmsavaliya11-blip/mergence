// Orchestration layer: combines live providers (FMP / news) with the curated
// sample dataset, and wires deals into the model engine. API routes call these.

import type {
  CompanyFinancials,
  DealFacts,
  DealStatus,
  ModelAssumptions,
  ModelResult,
} from "./types";
import { getCompanyFinancials, getLatestMA, hasFmpKey } from "./fmp";
import { getFinnhubFundamentals, hasFinnhubKey } from "./finnhub";
import { getRumoredDeals, hasNewsKey } from "./news";
import {
  SAMPLE_DEALS,
  sampleDealById,
  sampleDealsByStatus,
  sampleFinancials,
} from "./sample-data";
import { assumptionsFromFacts, clampAssumptions, runModel } from "./mna-model";
import { edgarUiSearchUrl } from "./sec";

export interface DataSourceInfo {
  fmp: boolean;
  news: boolean;
}

export function dataSources(): DataSourceInfo {
  return { fmp: hasFmpKey(), news: hasNewsKey() };
}

/** List deals for a section, merging live feed with curated rich examples. */
export async function listDeals(status: DealStatus): Promise<DealFacts[]> {
  const curated = sampleDealsByStatus(status);

  if (status === "rumored") {
    const live = await getRumoredDeals(20);
    return dedupe([...curated, ...live]);
  }

  // completed / announced. The live FMP feed is freshly-filed merger filings,
  // so it enriches the "announced" section; "completed" stays curated.
  let live: DealFacts[] = [];
  if (hasFmpKey() && status === "announced") {
    live = await getLatestMA(40);
  }
  return dedupe([...curated, ...live]);
}

function dedupe(deals: DealFacts[]): DealFacts[] {
  // Key on normalized company NAMES, not symbols: the FMP feed lists one row per
  // security class (e.g. GNL-PE, GNL-PB) for the same deal, which share a name.
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const seen = new Set<string>();
  const out: DealFacts[] = [];
  for (const d of deals) {
    const k = `${norm(d.acquirer)}|${norm(d.target)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
  }
  return out;
}

/** Find a single deal's facts by id (curated first, then live feeds). */
export async function findDeal(id: string): Promise<DealFacts | undefined> {
  const sample = sampleDealById(id);
  if (sample) return sample;
  // Search live feeds. Live ids are prefixed (`ma-…` from the FMP feed,
  // `rumor-news-…` from Marketaux), so we only hit the feed that can own this id
  // instead of fetching all three sequentially.
  const statuses: DealStatus[] = id.startsWith("rumor")
    ? ["rumored"]
    : id.startsWith("ma-")
      ? ["announced"]
      : ["announced", "rumored", "completed"];
  const lists = await Promise.all(statuses.map((s) => listDeals(s)));
  for (const deals of lists) {
    const hit = deals.find((d) => d.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export interface DealWithModel {
  facts: DealFacts;
  acquirer: CompanyFinancials | null;
  target: CompanyFinancials | null;
  assumptions: ModelAssumptions;
  model: ModelResult | null;
  edgarUrl: string | null;
}

/** Resolve financials for a deal and run the model (optionally with overrides). */
export async function modelDeal(
  facts: DealFacts,
  overrides?: Partial<ModelAssumptions>,
): Promise<DealWithModel> {
  const [acquirer, target] = await Promise.all([
    resolveFinancials(facts.acquirerSymbol, facts.acquirer),
    resolveFinancials(facts.targetSymbol, facts.target),
  ]);

  const base = assumptionsFromFacts(facts);
  // Overrides arrive from an untrusted POST body — clamp into sane ranges.
  const assumptions: ModelAssumptions = clampAssumptions({ ...base, ...overrides });

  let model: ModelResult | null = null;
  if (acquirer && target) {
    model = runModel({ facts, acquirer, target, assumptions });
  }

  const isUS = (facts.region ?? "").toUpperCase() === "US" || !facts.region;
  const edgarUrl = isUS ? edgarUiSearchUrl(facts.target) : null;

  return { facts, acquirer, target, assumptions, model, edgarUrl };
}

async function resolveFinancials(
  symbol: string | undefined,
  name: string,
): Promise<CompanyFinancials | null> {
  if (symbol) {
    let live = await getCompanyFinancials(symbol);
    // FMP's free tier omits earnings (income-statement is premium). If net
    // income is missing, fill it from Finnhub's free Basic Financials so the
    // accretion model has real EPS to work with.
    if (live && live.netIncome === 0 && hasFinnhubKey()) {
      const f = await getFinnhubFundamentals(live.symbol);
      if (f) {
        live = {
          ...live,
          netIncome: f.netIncome || live.netIncome,
          sharesOutstanding: live.sharesOutstanding || f.sharesOutstanding,
          price: live.price || f.price || 0,
          marketCap: live.marketCap || f.marketCap || 0,
          industry: live.industry || f.sector,
        };
      }
    }
    // If the live profile lacks an overview, borrow the curated description.
    if (live && !live.description) {
      const s = sampleFinancials(live.symbol) ?? sampleFinancials(symbol);
      if (s?.description) {
        live = {
          ...live,
          description: s.description,
          website: live.website || s.website,
          industry: live.industry || s.industry,
          employees: live.employees || s.employees,
        };
      }
    }
    if (live) return live;
    const sample = sampleFinancials(symbol);
    if (sample) return sample;
  }
  // No symbol (e.g. private target) — synthesize a minimal placeholder so the
  // model can still run partially; flagged via low dataCompleteness.
  return {
    symbol: symbol ?? "—",
    name,
    price: 0,
    sharesOutstanding: 0,
    netIncome: 0,
    marketCap: 0,
  };
}

export { SAMPLE_DEALS };
