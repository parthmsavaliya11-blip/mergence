// Pure, presentation-layer helpers derived from a computed ModelResult.
// No I/O and no server-only imports, so client components can use these too.

import type { DealFacts, ModelResult } from "./types";
import { fmtCurrencyCompact, fmtPct, fmtPctRaw, fmtPrice } from "./format";

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * A single 0–100 "deal score" distilled from the model's signals (50 = neutral).
 * Accretion/dilution dominates; premium discipline and synergies adjust it.
 * Low data completeness pulls the score toward neutral so we don't over-claim.
 */
export function computeDealScore(m: ModelResult): number {
  let s = 50;

  // EPS accretion/dilution — the dominant driver (±35).
  s += clamp(m.accretionDilutionPct * 100 * 2, -35, 35);

  // Premium discipline.
  if (m.premiumPct < 0) s += 2; // a discount offer
  else if (m.premiumPct <= 0.3) s += 6;
  else if (m.premiumPct <= 0.45) s -= 4;
  else s -= 12; // rich premium → overpayment risk

  // Synergies actually contribute.
  if (m.netSynergies > 0) s += 5;

  // If little real data backed the model, dampen toward neutral.
  if (m.dataCompleteness < 0.6) s = 50 + (s - 50) * 0.7;

  return Math.round(clamp(s, 1, 99));
}

export function scoreMeta(score: number): {
  label: string;
  tone: "bull" | "bear" | "neutral";
} {
  if (score >= 66) return { label: "Strong", tone: "bull" };
  if (score >= 57) return { label: "Favorable", tone: "bull" };
  if (score >= 44) return { label: "Mixed", tone: "neutral" };
  if (score >= 35) return { label: "Weak", tone: "bear" };
  return { label: "Poor", tone: "bear" };
}

/**
 * A plain-English, jargon-light explanation of the deal for newcomers —
 * generated deterministically from the model's numbers (no AI needed).
 */
export function explainDeal(facts: DealFacts, m: ModelResult, cur = "USD"): string {
  const direction = m.isAccretive ? "accretive" : "dilutive";
  const moreLess = m.isAccretive ? "more" : "less";
  const parts: string[] = [];

  parts.push(
    `${facts.acquirer} would acquire ${facts.target} for about ${fmtCurrencyCompact(
      m.offerValue,
      cur,
    )} — roughly a ${fmtPctRaw(m.premiumPct, 0)} premium over ${facts.target}'s undisturbed share price (the extra amount paid to win the deal).`,
  );

  parts.push(
    `Combining the two looks ${direction} to ${facts.acquirer}'s earnings per share by about ${fmtPct(
      Math.abs(m.accretionDilutionPct),
    )}, meaning each existing share would earn ${moreLess} than before (pro-forma EPS ${fmtPrice(
      m.proFormaEPS,
      cur,
    )} vs ${fmtPrice(m.acquirerStandaloneEPS, cur)} standalone).`,
  );

  if (m.netSynergies > 0) {
    parts.push(
      `The model assumes about ${fmtCurrencyCompact(
        m.netSynergies,
        cur,
      )} a year of synergies (savings from combining), versus roughly ${fmtCurrencyCompact(
        m.breakevenSynergies,
        cur,
      )} needed just to keep EPS flat.`,
    );
  }

  const read =
    m.verdict === "bullish"
      ? "reads as favorable for the acquirer"
      : m.verdict === "bearish"
        ? "reads as risky for the acquirer"
        : "reads as roughly balanced";
  parts.push(`Overall, the model ${read}. These are estimates, not investment advice.`);

  return parts.join(" ");
}
