"use client";

import { useState } from "react";
import type { DealWithModel } from "@/lib/deals-service";
import { Badge, Button, Card, Stat, TextInput } from "@/components/ui";
import { VerdictPill } from "@/components/verdict-pill";
import {
  computeDealScore,
  dealRecommendation,
  explainDeal,
  scoreMeta,
} from "@/lib/deal-insights";
import { fmtCurrencyCompact, fmtPct, fmtPctRaw, fmtPrice } from "@/lib/format";

type Model = NonNullable<DealWithModel["model"]>;
type Financing = "stock" | "cash" | "mixed";

const FINANCING: Record<Financing, { cashPortionPct: number; stockPortionPct: number; debtPortionPct: number }> = {
  stock: { cashPortionPct: 0, stockPortionPct: 1, debtPortionPct: 0 },
  cash: { cashPortionPct: 1, stockPortionPct: 0, debtPortionPct: 0 },
  mixed: { cashPortionPct: 0.5, stockPortionPct: 0.5, debtPortionPct: 0 },
};

const EXAMPLES = [
  { a: "MSFT", t: "ATVI", label: "Microsoft → Activision" },
  { a: "COF", t: "DFS", label: "Capital One → Discover" },
  { a: "AVGO", t: "VMW", label: "Broadcom → VMware" },
];

export function DealEvaluator() {
  const [acquirer, setAcquirer] = useState("");
  const [target, setTarget] = useState("");
  const [premiumPct, setPremiumPct] = useState(0.3);
  const [assumedPE, setAssumedPE] = useState(18);
  const [financing, setFinancing] = useState<Financing>("stock");
  const [result, setResult] = useState<DealWithModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function evaluate(aOverride?: string, tOverride?: string) {
    const a = (aOverride ?? acquirer).trim();
    const t = (tOverride ?? target).trim();
    if (!a || !t) {
      setError("Enter both an acquirer and a target ticker.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acquirerSymbol: a,
          targetSymbol: t,
          assumptions: { premiumPct, assumedPE, ...FINANCING[financing] },
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as DealWithModel;
      setResult(data);
      if (!data.model) {
        setError(
          "Couldn't find priced financial data for one of those tickers. Try major US-listed symbols (e.g. MSFT, AAPL, COF, JPM).",
        );
      }
    } catch (err) {
      console.error("[evaluate]", err);
      setError("Something went wrong evaluating that deal. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function runExample(a: string, t: string) {
    setAcquirer(a);
    setTarget(t);
    void evaluate(a, t);
  }

  return (
    <div className="grid grid-cols-1 gap-lg lg:grid-cols-[360px_1fr]">
      {/* ---------------------------------------------------------- Input panel */}
      <Card className="lg:sticky lg:top-[72px] lg:self-start">
        <h2 className="text-card-title text-ink">Set up the deal</h2>

        <div className="mt-md space-y-md">
          <div>
            <label className="mb-xs block text-body-sm text-ink-muted">
              Acquirer ticker (the buyer)
            </label>
            <TextInput
              value={acquirer}
              onChange={(e) => setAcquirer(e.target.value)}
              placeholder="e.g. MSFT"
              autoCapitalize="characters"
            />
          </div>
          <div>
            <label className="mb-xs block text-body-sm text-ink-muted">
              Target ticker (the company being bought)
            </label>
            <TextInput
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. ATVI"
              autoCapitalize="characters"
            />
          </div>

          <Range
            label="Control premium"
            value={premiumPct}
            min={0}
            max={0.8}
            step={0.01}
            fmt={(v) => fmtPctRaw(v, 0)}
            hint="how much over the target's current price you'd pay"
            onChange={setPremiumPct}
          />

          <div>
            <label className="mb-xs block text-body-sm text-ink-muted">How it's paid for</label>
            <div className="flex gap-xs">
              {(["stock", "cash", "mixed"] as Financing[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFinancing(f)}
                  className={`focus-ring flex-1 rounded-md border px-sm py-xs text-body-sm capitalize transition-colors ${
                    financing === f
                      ? "border-primary bg-[#1a1d3a] text-ink"
                      : "border-hairline bg-surface-1 text-ink-subtle hover:text-ink"
                  }`}
                >
                  {f === "mixed" ? "50 / 50" : f}
                </button>
              ))}
            </div>
          </div>

          <Range
            label="Assumed P/E (for target price)"
            value={assumedPE}
            min={5}
            max={40}
            step={0.5}
            fmt={(v) => `${v.toFixed(1)}×`}
            onChange={setAssumedPE}
          />
        </div>

        {error && <p className="mt-md text-caption text-bear">{error}</p>}

        <Button
          variant="primary"
          onClick={() => evaluate()}
          disabled={loading}
          className="mt-md w-full"
        >
          {loading ? "Evaluating…" : "Evaluate deal"}
        </Button>

        <div className="mt-md border-t border-hairline-tertiary pt-md">
          <p className="text-caption text-ink-tertiary">Try an example:</p>
          <div className="mt-xs flex flex-col gap-xs">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => runExample(ex.a, ex.t)}
                className="focus-ring rounded-md px-xs py-[4px] text-left text-body-sm text-primary hover:text-primary-hover"
              >
                {ex.label} →
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------------- Result panel */}
      <div>
        {result?.model ? (
          <Result dw={result} model={result.model} />
        ) : (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed border-hairline bg-surface-1 p-xl text-center">
            <p className="max-w-[360px] text-body text-ink-subtle">
              Enter an acquirer and a target (or pick an example) and press{" "}
              <span className="text-ink">Evaluate deal</span> to value it and get a go / no-go
              recommendation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ dw, model }: { dw: DealWithModel; model: Model }) {
  const cur = dw.facts.currency ?? "USD";
  const score = computeDealScore(model);
  const meta = scoreMeta(score);
  const rec = dealRecommendation(model, cur);

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-baseline gap-x-sm gap-y-1">
        <h2 className="text-headline text-ink">
          {dw.acquirer?.name ?? dw.facts.acquirer}
          <span className="text-ink-tertiary"> → </span>
          {dw.target?.name ?? dw.facts.target}
        </h2>
      </div>

      {/* Recommendation */}
      <RecommendationCard rec={rec} score={score} meta={meta} verdict={model.verdict} />

      {/* Valuation */}
      <div>
        <h3 className="mb-md text-card-title text-ink">The deal, valued</h3>
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
          <Stat label="Offer value" value={fmtCurrencyCompact(model.offerValue, cur)} />
          <Stat label="Premium" value={fmtPctRaw(model.premiumPct, 0)} />
          <Stat
            label="Exchange ratio"
            value={model.exchangeRatio != null ? model.exchangeRatio.toFixed(4) : "—"}
          />
          <Stat
            label="Accretion / dilution"
            value={fmtPct(model.accretionDilutionPct)}
            tone={model.isAccretive ? "bull" : "bear"}
          />
          <Stat
            label="Pro-forma EPS"
            value={fmtPrice(model.proFormaEPS, cur)}
            hint={`standalone ${fmtPrice(model.acquirerStandaloneEPS, cur)}`}
          />
          <Stat label="Net synergies (annual)" value={fmtCurrencyCompact(model.netSynergies, cur)} />
        </div>
      </div>

      {/* Plain English */}
      <Card>
        <h3 className="text-body-sm font-semibold text-ink">In plain English</h3>
        <p className="mt-xs text-body-sm text-ink-muted">{explainDeal(dw.facts, model, cur)}</p>
      </Card>

      {model.dataCompleteness < 0.6 && (
        <p className="text-caption text-ink-tertiary">
          Based on limited financial data ({Math.round(model.dataCompleteness * 100)}% complete) —
          treat as indicative.
        </p>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  score,
  meta,
  verdict,
}: {
  rec: ReturnType<typeof dealRecommendation>;
  score: number;
  meta: ReturnType<typeof scoreMeta>;
  verdict: Model["verdict"];
}) {
  const style =
    rec.decision === "go"
      ? { border: "border-[#1d5230]", bg: "bg-[#10301a]", text: "text-[#5fd47e]", label: "GO" }
      : rec.decision === "no-go"
        ? { border: "border-[#5a2a2a]", bg: "bg-[#311515]", text: "text-[#e88c8c]", label: "NO-GO" }
        : { border: "border-[#4a4220]", bg: "bg-[#2c2710]", text: "text-warning", label: "CAUTION" };

  return (
    <div className={`edge-highlight rounded-xl border ${style.border} ${style.bg} p-lg`}>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <p className={`font-mono text-caption font-semibold tracking-wide ${style.text}`}>
            {style.label}
          </p>
          <h3 className="mt-1 text-headline text-ink">{rec.headline}</h3>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span
              className={`font-mono text-display-md font-semibold tabular-nums ${
                meta.tone === "bull" ? "text-bull" : meta.tone === "bear" ? "text-bear" : "text-ink"
              }`}
            >
              {score}
            </span>
            <span className="text-caption text-ink-tertiary">/100</span>
          </div>
          <p className="mt-[2px] text-caption text-ink-subtle">Deal score · {meta.label}</p>
          <div className="mt-xs flex justify-end">
            <VerdictPill verdict={verdict} />
          </div>
        </div>
      </div>

      <ul className="mt-md space-y-xs border-t border-white/10 pt-md">
        {rec.reasons.map((r, i) => (
          <li key={i} className="flex gap-xs text-body-sm text-ink-muted">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-tertiary" />
            {r}
          </li>
        ))}
      </ul>

      <p className="mt-md text-caption text-ink-tertiary">
        Model estimate from public data + your terms — not investment advice.
      </p>
    </div>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  fmt,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-body-sm text-ink-muted">{label}</label>
        <span className="font-mono text-body-sm text-ink tabular-nums">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-xs w-full accent-primary"
      />
      {hint && <p className="mt-1 text-caption text-ink-tertiary">{hint}</p>}
    </div>
  );
}
