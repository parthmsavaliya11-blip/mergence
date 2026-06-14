// Shared domain types for the M&A platform.

export type DealStatus = "completed" | "announced" | "rumored";

export type DealStructure = "cash" | "stock" | "mixed" | "unknown";

export type Verdict = "bullish" | "bearish" | "neutral";

/** A single company's financial snapshot used by the model engine. */
export interface CompanyFinancials {
  symbol: string;
  name: string;
  price: number; // current share price
  sharesOutstanding: number;
  netIncome: number; // trailing net income
  marketCap: number;
  sector?: string;
  country?: string;
  currency?: string;
  // Profile / overview fields (best-effort; populated from FMP profile, with a
  // Finnhub/sample fallback). Used by the company detail page + deal snapshots.
  description?: string; // what the company does
  website?: string;
  industry?: string;
  ceo?: string;
  employees?: number;
  exchange?: string;
  beta?: number;
}

/** Inputs that describe a deal, before any modeling. */
export interface DealFacts {
  id: string;
  status: DealStatus;
  acquirer: string; // company name
  acquirerSymbol?: string;
  target: string;
  targetSymbol?: string;
  announcedDate?: string;
  closedDate?: string;
  dealValue?: number; // total transaction value (currency units)
  structure: DealStructure;
  // For stock/mixed deals: fixed exchange ratio (acquirer shares per target share)
  statedExchangeRatio?: number;
  // Cash portion per target share (cash or mixed deals)
  cashPerShare?: number;
  // Offer price per target share if disclosed
  offerPricePerShare?: number;
  premiumPct?: number; // premium over undisturbed price, if disclosed
  rationale?: string; // why the deal is happening
  disclosedSynergies?: number; // annual run-rate synergies disclosed by the company
  sector?: string;
  region?: string;
  sourceUrl?: string;
  sourceName?: string;
  // Rumored deals only:
  confidence?: "low" | "medium" | "high";
  // Completed deals only: qualitative post-deal effect notes
  postDealEffect?: string;
  currency?: string;
}

/** Assumptions the user can tweak; the model recomputes from these. */
export interface ModelAssumptions {
  synergyRunRatePct: number; // synergies as % of target revenue/net income proxy
  integrationCost: number; // one-time integration cost
  cashPortionPct: number; // 0..1 share of deal funded with cash
  stockPortionPct: number; // 0..1 share funded with new stock
  debtPortionPct: number; // 0..1 share funded with new debt
  assumedPE: number; // P/E applied to pro-forma EPS for target price
  taxRate: number; // 0..1
  costOfDebtPct: number; // annual interest rate on new debt
  premiumPct: number; // assumed control premium over target's current price
}

/** The computed output of the model engine. */
export interface ModelResult {
  offerValue: number;
  premiumPct: number;
  exchangeRatio: number | null;
  newSharesIssued: number;
  acquirerStandaloneEPS: number;
  proFormaEPS: number;
  accretionDilutionPct: number; // >0 accretive, <0 dilutive
  isAccretive: boolean;
  netSynergies: number; // after-tax annual synergies net of integration drag
  breakevenSynergies: number; // synergies needed for EPS neutrality
  expectedAcquirerPrice: number;
  expectedTargetPrice: number;
  verdict: Verdict;
  drivers: string[]; // human-readable reasons behind the verdict
  dataCompleteness: number; // 0..1 — how much real data backed the model
  warnings: string[];
}

/** A screener query. */
export interface ScreenerQuery {
  ownCompanyName?: string;
  ownMarketCap?: number;
  ownSector?: string;
  ownRegion?: string;
  targetSector?: string;
  targetRegion?: string;
  marketCapMin?: number;
  marketCapMax?: number;
  rationale?: string;
  limit?: number;
}

/** A screener match result. */
export interface ScreenerMatch {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  country?: string;
  marketCap: number;
  price: number;
  beta?: number;
  matchReasons: string[];
  matchScore: number; // 0..100
}
