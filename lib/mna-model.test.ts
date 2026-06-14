import { describe, it, expect } from "vitest";
import { runModel, DEFAULT_ASSUMPTIONS, assumptionsFromFacts } from "./mna-model";
import type { CompanyFinancials, DealFacts } from "./types";

const acquirer: CompanyFinancials = {
  symbol: "ACQ",
  name: "Acquirer Inc",
  price: 100,
  sharesOutstanding: 1_000_000_000, // 1B shares
  netIncome: 5_000_000_000, // $5B -> EPS $5.00
  marketCap: 100_000_000_000,
};

const target: CompanyFinancials = {
  symbol: "TGT",
  name: "Target Co",
  price: 40,
  sharesOutstanding: 500_000_000, // 500M shares
  netIncome: 1_000_000_000, // $1B
  marketCap: 20_000_000_000,
};

describe("M&A model engine", () => {
  it("computes a sensible offer value and premium", () => {
    const facts: DealFacts = {
      id: "t1",
      status: "announced",
      acquirer: "Acquirer Inc",
      target: "Target Co",
      structure: "stock",
      premiumPct: 0.25,
    };
    const r = runModel({ facts, acquirer, target, assumptions: assumptionsFromFacts(facts) });
    // Offer = 40 * 1.25 * 500M = 25B
    expect(r.offerValue).toBeCloseTo(25_000_000_000, -6);
    expect(r.premiumPct).toBeCloseTo(0.25, 2);
    expect(r.acquirerStandaloneEPS).toBeCloseTo(5, 2);
  });

  it("is accretive when target earnings yield exceeds the cost of the shares issued", () => {
    // All-stock, no premium, no synergies. Target P/E = 40/2 = 20 (yield 5%),
    // acquirer P/E = 100/5 = 20. With equal yields it should be ~neutral.
    const facts: DealFacts = {
      id: "t2",
      status: "announced",
      acquirer: "Acquirer Inc",
      target: "Target Co",
      structure: "stock",
      premiumPct: 0,
    };
    const a = { ...DEFAULT_ASSUMPTIONS, premiumPct: 0, synergyRunRatePct: 0 };
    const r = runModel({ facts, acquirer, target, assumptions: a });
    expect(Math.abs(r.accretionDilutionPct)).toBeLessThan(0.02);
  });

  it("turns dilutive when a large premium is paid in stock with no synergies", () => {
    const facts: DealFacts = {
      id: "t3",
      status: "announced",
      acquirer: "Acquirer Inc",
      target: "Target Co",
      structure: "stock",
      premiumPct: 0.6,
    };
    const a = { ...DEFAULT_ASSUMPTIONS, premiumPct: 0.6, synergyRunRatePct: 0 };
    const r = runModel({ facts, acquirer, target, assumptions: a });
    expect(r.accretionDilutionPct).toBeLessThan(0);
    expect(r.isAccretive).toBe(false);
    expect(r.verdict).not.toBe("bullish");
  });

  it("synergies improve accretion and can flip the verdict", () => {
    const facts: DealFacts = {
      id: "t4",
      status: "announced",
      acquirer: "Acquirer Inc",
      target: "Target Co",
      structure: "stock",
      premiumPct: 0.3,
      disclosedSynergies: 2_000_000_000, // large synergies
    };
    const r = runModel({ facts, acquirer, target, assumptions: assumptionsFromFacts(facts) });
    expect(r.accretionDilutionPct).toBeGreaterThan(0);
    expect(r.verdict).toBe("bullish");
    expect(r.breakevenSynergies).toBeGreaterThan(0);
  });

  it("produces a positive exchange ratio for stock deals", () => {
    const facts: DealFacts = {
      id: "t5",
      status: "announced",
      acquirer: "Acquirer Inc",
      target: "Target Co",
      structure: "stock",
      premiumPct: 0.25,
    };
    const r = runModel({ facts, acquirer, target, assumptions: assumptionsFromFacts(facts) });
    expect(r.exchangeRatio).not.toBeNull();
    expect(r.exchangeRatio!).toBeGreaterThan(0);
  });

  it("handles missing data without throwing and flags low completeness", () => {
    const thin: CompanyFinancials = {
      symbol: "X",
      name: "X",
      price: 0,
      sharesOutstanding: 0,
      netIncome: 0,
      marketCap: 0,
    };
    const facts: DealFacts = {
      id: "t6",
      status: "rumored",
      acquirer: "X",
      target: "Y",
      structure: "unknown",
    };
    const r = runModel({ facts, acquirer: thin, target: thin, assumptions: DEFAULT_ASSUMPTIONS });
    expect(r.dataCompleteness).toBeLessThan(0.6);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
