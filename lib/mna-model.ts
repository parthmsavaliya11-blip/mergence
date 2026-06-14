// ------------------------------------------------------------------------
// M&A model engine — pure, deterministic accretion/dilution analysis.
//
// IMPORTANT: every number this produces is a MODEL ESTIMATE derived from the
// supplied facts + assumptions. It is not fetched truth and not advice. The
// math here is the standard accretion/dilution framework used in M&A:
//
//   pro-forma EPS = (acquirer NI + target NI + after-tax synergies
//                    - after-tax new interest) / (acquirer shares + new shares)
//   accretion/dilution = (pro-forma EPS - acquirer standalone EPS) / standalone EPS
//
// ------------------------------------------------------------------------

import type {
  CompanyFinancials,
  DealFacts,
  ModelAssumptions,
  ModelResult,
  Verdict,
} from "./types";

export const DEFAULT_ASSUMPTIONS: ModelAssumptions = {
  synergyRunRatePct: 0.03, // 3% of combined relevant base
  integrationCost: 0,
  cashPortionPct: 0,
  stockPortionPct: 1,
  debtPortionPct: 0,
  assumedPE: 18,
  taxRate: 0.21,
  costOfDebtPct: 0.06,
  premiumPct: 0.3,
};

/** Build a sensible default assumption set, seeded from any disclosed facts. */
export function assumptionsFromFacts(facts: DealFacts): ModelAssumptions {
  const a: ModelAssumptions = { ...DEFAULT_ASSUMPTIONS };
  if (facts.premiumPct != null) a.premiumPct = facts.premiumPct;
  switch (facts.structure) {
    case "cash":
      a.cashPortionPct = 1;
      a.stockPortionPct = 0;
      a.debtPortionPct = 0;
      break;
    case "stock":
      a.cashPortionPct = 0;
      a.stockPortionPct = 1;
      a.debtPortionPct = 0;
      break;
    case "mixed":
      a.cashPortionPct = 0.5;
      a.stockPortionPct = 0.5;
      a.debtPortionPct = 0;
      break;
  }
  return a;
}

/**
 * Sanitize user-supplied assumptions into sane ranges. The API accepts these
 * from an untrusted POST body, so coerce non-finite values and clamp each field
 * to a defensible bound — keeps the model from producing nonsense (or being
 * abused with extreme inputs) while still allowing wide exploration.
 */
export function clampAssumptions(a: ModelAssumptions): ModelAssumptions {
  const finite = (v: number, fallback: number) =>
    typeof v === "number" && isFinite(v) ? v : fallback;
  const clamp = (v: number, lo: number, hi: number, fallback: number) =>
    Math.min(hi, Math.max(lo, finite(v, fallback)));
  const d = DEFAULT_ASSUMPTIONS;
  return {
    synergyRunRatePct: clamp(a.synergyRunRatePct, 0, 1, d.synergyRunRatePct),
    integrationCost: clamp(a.integrationCost, 0, 1e13, d.integrationCost),
    cashPortionPct: clamp(a.cashPortionPct, 0, 1, d.cashPortionPct),
    stockPortionPct: clamp(a.stockPortionPct, 0, 1, d.stockPortionPct),
    debtPortionPct: clamp(a.debtPortionPct, 0, 1, d.debtPortionPct),
    assumedPE: clamp(a.assumedPE, 0, 1000, d.assumedPE),
    taxRate: clamp(a.taxRate, 0, 0.6, d.taxRate),
    costOfDebtPct: clamp(a.costOfDebtPct, 0, 0.5, d.costOfDebtPct),
    premiumPct: clamp(a.premiumPct, -0.99, 5, d.premiumPct),
  };
}

function normalizeFinancing(a: ModelAssumptions): {
  cash: number;
  stock: number;
  debt: number;
} {
  const sum = a.cashPortionPct + a.stockPortionPct + a.debtPortionPct;
  if (sum <= 0) return { cash: 0, stock: 1, debt: 0 };
  return {
    cash: a.cashPortionPct / sum,
    stock: a.stockPortionPct / sum,
    debt: a.debtPortionPct / sum,
  };
}

export interface ModelInput {
  facts: DealFacts;
  acquirer: CompanyFinancials;
  target: CompanyFinancials;
  assumptions: ModelAssumptions;
}

/**
 * Run the model. Robust to missing data: falls back to estimates and tracks a
 * `dataCompleteness` score + warnings so the UI can show how grounded it is.
 */
export function runModel(input: ModelInput): ModelResult {
  const { facts, acquirer, target, assumptions: a } = input;
  const warnings: string[] = [];
  let dataPoints = 0;
  let dataMax = 0;

  const track = (present: boolean, weight = 1) => {
    dataMax += weight;
    if (present) dataPoints += weight;
  };

  // --- Offer value & premium -------------------------------------------------
  track(target.price > 0, 1);
  track(target.sharesOutstanding > 0, 1);

  const targetShares =
    target.sharesOutstanding > 0
      ? target.sharesOutstanding
      : estimateShares(target);
  if (target.sharesOutstanding <= 0)
    warnings.push("Target shares outstanding estimated from market cap / price.");

  const undisturbed = target.price > 0 ? target.price : 1;

  // Disclosed offer price per share, from explicit terms or deal value / shares.
  const disclosedOfferPrice =
    facts.offerPricePerShare != null && facts.offerPricePerShare > 0
      ? facts.offerPricePerShare
      : facts.dealValue != null && facts.dealValue > 0 && targetShares > 0
        ? facts.dealValue / targetShares
        : null;

  // The undisturbed (pre-announcement) reference price the premium is measured
  // against. The premium *assumption* is the knob the user turns, so the offer
  // must scale with it. When the deal discloses a premium we back it out of the
  // disclosed offer to recover that reference — the target's *current* price is
  // already disturbed toward the offer for a pending deal and can't be used.
  // Otherwise the current price is the best reference we have.
  const referencePrice =
    disclosedOfferPrice != null && facts.premiumPct != null && facts.premiumPct > -1
      ? disclosedOfferPrice / (1 + facts.premiumPct)
      : undisturbed;

  // Reprice from the assumed premium unless the only thing we have is a fixed
  // disclosed offer price with no premium to anchor it (then the slider can't
  // meaningfully move it, so leave it pinned).
  const premiumDriven = disclosedOfferPrice == null || facts.premiumPct != null;

  const offerPricePerShare = premiumDriven
    ? referencePrice * (1 + a.premiumPct)
    : disclosedOfferPrice;

  const offerValue = premiumDriven
    ? offerPricePerShare * targetShares
    : facts.dealValue != null && facts.dealValue > 0
      ? facts.dealValue
      : offerPricePerShare * targetShares;
  track(facts.dealValue != null, 1);

  const realizedPremium =
    referencePrice > 0 ? offerPricePerShare / referencePrice - 1 : a.premiumPct;

  // --- Financing split -------------------------------------------------------
  const fin = normalizeFinancing(a);
  const stockConsideration = offerValue * fin.stock;
  const cashConsideration = offerValue * fin.cash;
  const debtConsideration = offerValue * fin.debt;

  // --- New shares issued (stock-funded portion) ------------------------------
  track(acquirer.price > 0, 1);
  const acquirerPrice = acquirer.price > 0 ? acquirer.price : 1;
  const newSharesIssued = acquirerPrice > 0 ? stockConsideration / acquirerPrice : 0;

  // Exchange ratio: acquirer shares per target share, for the stock portion.
  const exchangeRatio =
    facts.statedExchangeRatio != null
      ? facts.statedExchangeRatio
      : targetShares > 0
        ? newSharesIssued / targetShares
        : null;

  // --- Earnings --------------------------------------------------------------
  track(acquirer.netIncome !== 0, 1);
  track(target.netIncome !== 0, 1);
  track(acquirer.sharesOutstanding > 0, 1);

  const acquirerShares =
    acquirer.sharesOutstanding > 0 ? acquirer.sharesOutstanding : estimateShares(acquirer);
  if (acquirer.sharesOutstanding <= 0)
    warnings.push("Acquirer shares outstanding estimated from market cap / price.");

  const acquirerStandaloneEPS =
    acquirerShares > 0 ? acquirer.netIncome / acquirerShares : 0;

  // --- Synergies -------------------------------------------------------------
  // Base synergies on disclosed figure if available, else % of combined net income.
  const combinedNI = acquirer.netIncome + target.netIncome;
  const grossSynergies =
    facts.disclosedSynergies != null && facts.disclosedSynergies > 0
      ? facts.disclosedSynergies
      : Math.abs(combinedNI) * a.synergyRunRatePct;
  track(facts.disclosedSynergies != null, 1);

  // After-tax synergies, net of an annualized slice of integration cost (3yr).
  const afterTaxSynergies = grossSynergies * (1 - a.taxRate);
  const integrationDrag = a.integrationCost > 0 ? a.integrationCost / 3 : 0;
  const netSynergies = afterTaxSynergies - integrationDrag;

  // --- Financing cost --------------------------------------------------------
  const afterTaxInterest = debtConsideration * a.costOfDebtPct * (1 - a.taxRate);
  // Cash funded from the balance sheet has an opportunity cost (foregone yield on
  // that cash). We approximate it at HALF the cost of debt (the 0.5 factor):
  // idle corporate cash typically earns a money-market/short-rate well below a
  // company's marginal borrowing rate, so charging the full cost of debt would
  // overstate the drag. Crude but deliberately conservative.
  const CASH_YIELD_VS_DEBT = 0.5;
  const foregoneCashYield = cashConsideration * a.costOfDebtPct * (1 - a.taxRate) * CASH_YIELD_VS_DEBT;

  // --- Pro-forma EPS ---------------------------------------------------------
  const proFormaNI =
    acquirer.netIncome + target.netIncome + netSynergies - afterTaxInterest - foregoneCashYield;
  const proFormaShares = acquirerShares + newSharesIssued;
  const proFormaEPS = proFormaShares > 0 ? proFormaNI / proFormaShares : 0;

  const accretionDilutionPct =
    acquirerStandaloneEPS !== 0
      ? (proFormaEPS - acquirerStandaloneEPS) / Math.abs(acquirerStandaloneEPS)
      : 0;
  const isAccretive = proFormaEPS > acquirerStandaloneEPS;

  // --- Breakeven synergies ---------------------------------------------------
  // Synergies (pre-tax) needed for pro-forma EPS == standalone EPS.
  // standaloneEPS * proFormaShares = acquirerNI + targetNI + Sx(1-t) - interest
  const requiredProFormaNI = acquirerStandaloneEPS * proFormaShares;
  const requiredNetSynergies =
    requiredProFormaNI - (acquirer.netIncome + target.netIncome - afterTaxInterest - foregoneCashYield);
  const breakevenSynergies =
    a.taxRate < 1 ? Math.max(0, requiredNetSynergies / (1 - a.taxRate)) : 0;

  // --- Expected prices -------------------------------------------------------
  const peReference =
    a.assumedPE > 0
      ? a.assumedPE
      : acquirerStandaloneEPS > 0
        ? acquirerPrice / acquirerStandaloneEPS
        : 18;
  const expectedAcquirerPrice = proFormaEPS > 0 ? proFormaEPS * peReference : acquirerPrice;
  const expectedTargetPrice = offerPricePerShare; // target converges to offer

  // --- Verdict ---------------------------------------------------------------
  const { verdict, drivers } = decideVerdict({
    accretionDilutionPct,
    realizedPremium,
    netSynergies,
    breakevenSynergies,
    grossSynergies,
    expectedAcquirerPrice,
    acquirerPrice,
    // Only treat accretion/dilution as a real signal when we actually have the
    // acquirer's earnings. With netIncome=0 (free-tier, no Finnhub backfill),
    // standalone EPS is 0 → accretion is forced to 0, which must NOT be reported
    // as a genuine "EPS-neutral" deal.
    hasEarnings: acquirerStandaloneEPS !== 0,
  });

  const dataCompleteness = dataMax > 0 ? dataPoints / dataMax : 0;
  if (dataCompleteness < 0.6)
    warnings.push("Limited financial data — treat results as indicative only.");

  return {
    offerValue,
    premiumPct: realizedPremium,
    exchangeRatio,
    newSharesIssued,
    acquirerStandaloneEPS,
    proFormaEPS,
    accretionDilutionPct,
    isAccretive,
    netSynergies,
    breakevenSynergies,
    expectedAcquirerPrice,
    expectedTargetPrice,
    verdict,
    drivers,
    dataCompleteness,
    warnings,
  };
}

function decideVerdict(x: {
  accretionDilutionPct: number;
  realizedPremium: number;
  netSynergies: number;
  breakevenSynergies: number;
  grossSynergies: number;
  expectedAcquirerPrice: number;
  acquirerPrice: number;
  hasEarnings: boolean;
}): { verdict: Verdict; drivers: string[] } {
  const drivers: string[] = [];
  let score = 0;

  // EPS accretion is the dominant driver — but only when we actually have the
  // acquirer's earnings. Without them, say so instead of claiming "neutral".
  if (!x.hasEarnings) {
    drivers.push("Acquirer earnings unavailable — accretion/dilution not assessed.");
  } else if (x.accretionDilutionPct > 0.02) {
    score += 2;
    drivers.push(
      `EPS accretive (~${(x.accretionDilutionPct * 100).toFixed(1)}%) for the acquirer.`,
    );
  } else if (x.accretionDilutionPct < -0.02) {
    score -= 2;
    drivers.push(
      `EPS dilutive (~${(x.accretionDilutionPct * 100).toFixed(1)}%) for the acquirer.`,
    );
  } else {
    drivers.push("Roughly EPS-neutral for the acquirer.");
  }

  // Premium paid.
  if (x.realizedPremium > 0.45) {
    score -= 1;
    drivers.push(`Rich premium (~${(x.realizedPremium * 100).toFixed(0)}%) raises overpayment risk.`);
  } else if (x.realizedPremium >= 0) {
    drivers.push(`Control premium ~${(x.realizedPremium * 100).toFixed(0)}%.`);
  } else {
    drivers.push(
      `Offer at a ~${(Math.abs(x.realizedPremium) * 100).toFixed(0)}% discount to the reference price.`,
    );
  }

  // Synergy cushion: are projected synergies above what's needed to break even?
  if (x.netSynergies > 0 && x.grossSynergies > x.breakevenSynergies * 1.1) {
    score += 1;
    drivers.push("Projected synergies exceed the EPS break-even threshold.");
  } else if (x.grossSynergies < x.breakevenSynergies * 0.9) {
    score -= 1;
    drivers.push("Synergies fall short of the EPS break-even threshold.");
  }

  // Upside to expected acquirer price.
  const upside = x.acquirerPrice > 0 ? x.expectedAcquirerPrice / x.acquirerPrice - 1 : 0;
  if (upside > 0.05) drivers.push(`Implied acquirer upside ~${(upside * 100).toFixed(0)}%.`);
  else if (upside < -0.05) drivers.push(`Implied acquirer downside ~${(upside * 100).toFixed(0)}%.`);

  const verdict: Verdict = score >= 2 ? "bullish" : score <= -2 ? "bearish" : "neutral";
  return { verdict, drivers };
}

function estimateShares(c: CompanyFinancials): number {
  if (c.marketCap > 0 && c.price > 0) return c.marketCap / c.price;
  return 0;
}
