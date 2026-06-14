"use client";

import Link from "next/link";
import { useState } from "react";
import type { DealWithModel } from "@/lib/deals-service";
import type { ModelAssumptions } from "@/lib/types";
import { Badge, Button, Card, Stat } from "@/components/ui";
import { StatusBadge, VerdictPill } from "@/components/verdict-pill";
import {
  fmtCurrencyCompact,
  fmtDate,
  fmtNumber,
  fmtPct,
  fmtPctRaw,
  fmtPrice,
} from "@/lib/format";

type Model = NonNullable<DealWithModel["model"]>;

export function DealDetail({ initial }: { initial: DealWithModel }) {
  const { facts } = initial;
  // The base case never changes — it's the model Mergence computed from the
  // disclosed deal structure + default assumptions. Financials (acquirer/target)
  // don't depend on assumptions either, so they're constant too.
  const baseline = initial.model;
  const acquirer = initial.acquirer;
  const target = initial.target;
  const cur = facts.currency ?? "USD";

  // The "Your scenario" model is computed on demand when the user hits Create.
  const [assumptions, setAssumptions] = useState<ModelAssumptions>(initial.assumptions);
  const [scenario, setScenario] = useState<Model | null>(null);
  const [committed, setCommitted] = useState<ModelAssumptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assumptions tuning + the two-model comparison are only meaningful for
  // in-process deals; completed deals already have a real outcome.
  const isSpeculative = facts.status === "rumored";
  const allowScenario = facts.status === "announced" || facts.status === "rumored";
  const showAssumptions = allowScenario && !!baseline;

  const dirty =
    committed != null && JSON.stringify(assumptions) !== JSON.stringify(committed);

  const update = (patch: Partial<ModelAssumptions>) =>
    setAssumptions((a) => ({ ...a, ...patch }));

  async function createScenario() {
    const used = assumptions;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: facts.id, assumptions: used }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error("model request failed");
      const data = (await res.json()) as DealWithModel;
      if (!data.model) throw new Error("no model returned");
      setScenario(data.model);
      setCommitted(used);
    } catch (err) {
      console.error("[deal-detail] scenario model request failed:", err);
      setError("Couldn't compute that scenario. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetScenario() {
    setScenario(null);
    setCommitted(null);
    setAssumptions(initial.assumptions);
    setError(null);
  }

  return (
    <div className="mt-md">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-xs">
        <StatusBadge status={facts.status} />
        {facts.confidence && <Badge tone="neutral">{facts.confidence} confidence</Badge>}
        {facts.sector && <Badge tone="neutral">{facts.sector}</Badge>}
        {facts.region && <Badge tone="neutral">{facts.region}</Badge>}
      </div>
      <h1 className="mt-md text-display-md text-ink">
        {facts.acquirer}
        <span className="text-ink-tertiary"> → </span>
        {facts.target}
      </h1>

      <div className="mt-md flex flex-wrap items-center gap-md">
        {baseline && <VerdictPill verdict={baseline.verdict} />}
        <span className="text-caption text-ink-tertiary">
          {facts.status === "completed"
            ? `Closed ${fmtDate(facts.closedDate)}`
            : `Announced ${fmtDate(facts.announcedDate)}`}
        </span>
      </div>

      {isSpeculative && (
        <div className="mt-md rounded-md border border-[#4a4220] bg-[#2c2710] px-sm py-xs text-caption text-warning">
          Speculative / unconfirmed. These numbers assume the rumored deal proceeds on the
          assumptions below.
        </div>
      )}

      <div
        className={`mt-lg grid grid-cols-1 gap-lg ${
          showAssumptions ? "lg:grid-cols-[1fr_360px]" : ""
        }`}
      >
        {/* ---------------------------------------------------------- Main column */}
        <div className="space-y-lg">
          {/* Model estimate note */}
          <p className="text-caption text-ink-tertiary">
            All figures below are <span className="text-ink-muted">model estimates</span> from public
            facts + assumptions. Not investment advice.
          </p>

          {/* Base case */}
          {baseline ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <h2 className="text-card-title text-ink">Base case</h2>
                  <p className="text-caption text-ink-tertiary">
                    Mergence&apos;s default assumptions
                  </p>
                </div>
                <VerdictPill verdict={baseline.verdict} />
              </div>
              <div className="mt-md">
                <MetricsGrid model={baseline} acquirerPrice={acquirer?.price} cur={cur} />
              </div>
            </section>
          ) : (
            <Card>
              <p className="text-body text-ink-subtle">
                Not enough financial data to model this deal yet. Add an API key or a target
                ticker to enable the full analysis.
              </p>
            </Card>
          )}

          {/* Your scenario (only after the user creates one) */}
          {scenario && (
            <section className="rounded-lg border border-[#2c3170] bg-surface-1 p-lg edge-highlight">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <Badge tone="primary">Your scenario</Badge>
                  <p className="mt-xs text-caption text-ink-subtle">
                    Recomputed from the assumptions you set
                    {dirty ? " — edit and recalculate to update" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-sm">
                  <VerdictPill verdict={scenario.verdict} />
                  <button
                    onClick={resetScenario}
                    className="focus-ring rounded-md px-xs py-[2px] text-caption text-ink-subtle transition-colors hover:text-ink"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-md">
                <MetricsGrid
                  model={scenario}
                  base={baseline}
                  acquirerPrice={acquirer?.price}
                  cur={cur}
                />
              </div>
              {scenario.drivers.length > 0 && (
                <ul className="mt-md space-y-xs border-t border-hairline-tertiary pt-md">
                  {scenario.drivers.map((d, i) => (
                    <li key={i} className="flex gap-xs text-body-sm text-ink-muted">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Verdict drivers (base case) */}
          {baseline && baseline.drivers.length > 0 && (
            <Card>
              <h2 className="text-card-title text-ink">Why {baseline.verdict} (base case)</h2>
              <ul className="mt-md space-y-xs">
                {baseline.drivers.map((d, i) => (
                  <li key={i} className="flex gap-xs text-body-sm text-ink-muted">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {d}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Rationale */}
          {facts.rationale && (
            <Card>
              <h2 className="text-card-title text-ink">Deal rationale</h2>
              <p className="mt-sm text-body text-ink-muted">{facts.rationale}</p>
            </Card>
          )}

          {/* Post-deal effect (completed) */}
          {facts.postDealEffect && (
            <Card>
              <h2 className="text-card-title text-ink">Post-deal effect</h2>
              <p className="mt-sm text-body text-ink-muted">{facts.postDealEffect}</p>
            </Card>
          )}

          {/* Company snapshots */}
          <div>
            <h2 className="mb-md text-card-title text-ink">The companies</h2>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <CompanyCard label="Acquirer" c={acquirer} cur={cur} />
              <CompanyCard label="Target" c={target} cur={cur} />
            </div>
          </div>

          {/* Warnings + completeness (base case) */}
          {baseline && (
            <div className="rounded-md border border-hairline bg-surface-1 p-md">
              <div className="flex items-center justify-between">
                <span className="text-caption text-ink-subtle">Data completeness</span>
                <span className="font-mono text-caption text-ink-muted">
                  {Math.round(baseline.dataCompleteness * 100)}%
                </span>
              </div>
              <div className="mt-xs h-1.5 overflow-hidden rounded-pill bg-surface-3">
                <div
                  className="h-full rounded-pill bg-primary"
                  style={{ width: `${Math.round(baseline.dataCompleteness * 100)}%` }}
                />
              </div>
              {baseline.warnings.length > 0 && (
                <ul className="mt-sm space-y-1">
                  {baseline.warnings.map((w, i) => (
                    <li key={i} className="text-caption text-ink-tertiary">
                      • {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Sources */}
          <div className="flex flex-wrap gap-sm text-caption">
            {facts.sourceUrl && (
              <a
                href={facts.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary-hover"
              >
                {facts.sourceName ?? "Source"} ↗
              </a>
            )}
            {initial.edgarUrl && (
              <a
                href={initial.edgarUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary-hover"
              >
                SEC EDGAR filings ↗
              </a>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------- Assumptions */}
        {showAssumptions && (
          <aside className="lg:sticky lg:top-[72px] lg:self-start">
            <Card>
              <h2 className="text-card-title text-ink">Your assumptions</h2>
              <p className="mt-1 text-caption text-ink-subtle">
                Tune the inputs, then create a scenario — your result appears next to the base
                case. Nothing recomputes until you do.
              </p>

              <div className="mt-md space-y-md">
                <Slider
                  label="Synergy run-rate"
                  value={assumptions.synergyRunRatePct}
                  min={0}
                  max={0.15}
                  step={0.005}
                  fmt={(v) => fmtPctRaw(v, 1)}
                  hint="% of combined net income (if no figure disclosed)"
                  onChange={(v) => update({ synergyRunRatePct: v })}
                />
                <Slider
                  label="Control premium"
                  value={assumptions.premiumPct}
                  min={0}
                  max={0.8}
                  step={0.01}
                  fmt={(v) => fmtPctRaw(v, 0)}
                  onChange={(v) => update({ premiumPct: v })}
                />
                <FinancingMix assumptions={assumptions} onChange={update} />
                <Slider
                  label="Assumed P/E (for target price)"
                  value={assumptions.assumedPE}
                  min={5}
                  max={40}
                  step={0.5}
                  fmt={(v) => `${v.toFixed(1)}×`}
                  onChange={(v) => update({ assumedPE: v })}
                />
                <Slider
                  label="Tax rate"
                  value={assumptions.taxRate}
                  min={0}
                  max={0.4}
                  step={0.01}
                  fmt={(v) => fmtPctRaw(v, 0)}
                  onChange={(v) => update({ taxRate: v })}
                />
                <Slider
                  label="Cost of new debt"
                  value={assumptions.costOfDebtPct}
                  min={0}
                  max={0.15}
                  step={0.0025}
                  fmt={(v) => fmtPctRaw(v, 2)}
                  onChange={(v) => update({ costOfDebtPct: v })}
                />
                <NumberRow
                  label="Integration cost (one-time)"
                  value={assumptions.integrationCost}
                  onChange={(v) => update({ integrationCost: v })}
                  cur={cur}
                />
              </div>

              {error && <p className="mt-md text-caption text-bear">{error}</p>}

              <div className="mt-md flex items-center gap-xs">
                <Button
                  variant="primary"
                  onClick={createScenario}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading
                    ? "Calculating…"
                    : scenario
                      ? "Recalculate scenario"
                      : "Create scenario"}
                </Button>
                {scenario && (
                  <Button variant="secondary" onClick={resetScenario} disabled={loading}>
                    Reset
                  </Button>
                )}
              </div>
              {scenario && dirty && (
                <p className="mt-xs text-caption text-warning">
                  Assumptions changed — recalculate to update your scenario.
                </p>
              )}
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

function MetricsGrid({
  model,
  base,
  acquirerPrice,
  cur,
}: {
  model: Model;
  base?: Model | null;
  acquirerPrice?: number;
  cur: string;
}) {
  // When `base` is supplied (the "Your scenario" grid), each stat shows the base
  // value as a hint so the user can read the effect of their change at a glance.
  const baseHint = (s: string) => (base ? `base ${s}` : undefined);
  return (
    <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
      <Stat
        label="Offer value"
        value={fmtCurrencyCompact(model.offerValue, cur)}
        hint={base ? baseHint(fmtCurrencyCompact(base.offerValue, cur)) : undefined}
      />
      <Stat
        label="Premium"
        value={fmtPctRaw(model.premiumPct, 0)}
        hint={base ? baseHint(fmtPctRaw(base.premiumPct, 0)) : undefined}
      />
      <Stat
        label="Exchange ratio"
        value={model.exchangeRatio != null ? model.exchangeRatio.toFixed(4) : "—"}
        hint={
          base
            ? baseHint(base.exchangeRatio != null ? base.exchangeRatio.toFixed(4) : "—")
            : "acquirer sh / target sh"
        }
      />
      <Stat
        label="Accretion / dilution"
        value={fmtPct(model.accretionDilutionPct)}
        tone={model.isAccretive ? "bull" : "bear"}
        hint={base ? baseHint(fmtPct(base.accretionDilutionPct)) : "to acquirer EPS"}
      />
      <Stat
        label="Pro-forma EPS"
        value={fmtPrice(model.proFormaEPS, cur)}
        hint={
          base
            ? baseHint(fmtPrice(base.proFormaEPS, cur))
            : `standalone ${fmtPrice(model.acquirerStandaloneEPS, cur)}`
        }
      />
      <Stat
        label="New shares issued"
        value={fmtNumber(model.newSharesIssued)}
        hint={base ? baseHint(fmtNumber(base.newSharesIssued)) : undefined}
      />
      <Stat
        label="Net synergies (annual)"
        value={fmtCurrencyCompact(model.netSynergies, cur)}
        tone={model.netSynergies > 0 ? "bull" : "neutral"}
        hint={base ? baseHint(fmtCurrencyCompact(base.netSynergies, cur)) : undefined}
      />
      <Stat
        label="Break-even synergies"
        value={fmtCurrencyCompact(model.breakevenSynergies, cur)}
        hint={
          base ? baseHint(fmtCurrencyCompact(base.breakevenSynergies, cur)) : "for EPS neutrality"
        }
      />
      <Stat
        label="Expected acquirer price"
        value={fmtPrice(model.expectedAcquirerPrice, cur)}
        hint={
          base
            ? baseHint(fmtPrice(base.expectedAcquirerPrice, cur))
            : acquirerPrice
              ? `now ${fmtPrice(acquirerPrice, cur)}`
              : undefined
        }
        tone={
          acquirerPrice
            ? model.expectedAcquirerPrice > acquirerPrice
              ? "bull"
              : "bear"
            : "neutral"
        }
      />
    </div>
  );
}

function CompanyCard({
  label,
  c,
  cur,
}: {
  label: string;
  c: DealWithModel["acquirer"];
  cur: string;
}) {
  const hasSymbol = !!c?.symbol && c.symbol !== "—";
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-md">
      <div className="flex items-center justify-between">
        <span className="text-caption text-ink-subtle">{label}</span>
        {hasSymbol && (
          <span className="font-mono text-caption text-ink-tertiary">{c!.symbol}</span>
        )}
      </div>
      <p className="mt-1 text-body font-medium text-ink">{c?.name ?? "—"}</p>
      {(c?.sector || c?.industry) && (
        <p className="mt-[2px] text-caption text-ink-tertiary">
          {c?.industry ?? c?.sector}
        </p>
      )}

      {c?.description && (
        <p className="mt-sm line-clamp-4 text-body-sm text-ink-subtle">{c.description}</p>
      )}

      <dl className="mt-sm grid grid-cols-2 gap-x-md gap-y-xs text-body-sm">
        <Row k="Price" v={c && c.price > 0 ? fmtPrice(c.price, cur) : "—"} />
        <Row k="Market cap" v={fmtCurrencyCompact(c?.marketCap, cur)} />
        <Row k="Net income" v={fmtCurrencyCompact(c?.netIncome, cur)} />
        <Row k="Shares" v={c && c.sharesOutstanding > 0 ? fmtNumber(c.sharesOutstanding) : "—"} />
      </dl>

      {hasSymbol && (
        <Link
          href={`/company/${encodeURIComponent(c!.symbol)}`}
          className="mt-md inline-block text-body-sm font-medium text-primary hover:text-primary-hover"
        >
          Full company overview →
        </Link>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-sm">
      <dt className="text-ink-tertiary">{k}</dt>
      <dd className="font-mono text-ink-muted tabular-nums">{v}</dd>
    </div>
  );
}

function Slider({
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

function NumberRow({
  label,
  value,
  onChange,
  cur,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  cur: string;
}) {
  return (
    <div>
      <label className="text-body-sm text-ink-muted">{label}</label>
      <input
        type="number"
        value={value}
        min={0}
        step={1_000_000}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="focus-ring mt-xs w-full rounded-md border border-hairline bg-surface-1 px-sm py-xs font-mono text-body-sm text-ink"
      />
      <p className="mt-1 text-caption text-ink-tertiary">
        Currently {fmtCurrencyCompact(value, cur)}
      </p>
    </div>
  );
}

function FinancingMix({
  assumptions,
  onChange,
}: {
  assumptions: ModelAssumptions;
  onChange: (patch: Partial<ModelAssumptions>) => void;
}) {
  const total =
    assumptions.cashPortionPct + assumptions.stockPortionPct + assumptions.debtPortionPct || 1;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div>
      <label className="text-body-sm text-ink-muted">Financing mix</label>
      <p className="mt-1 text-caption text-ink-tertiary">
        Cash {pct(assumptions.cashPortionPct)}% · Stock {pct(assumptions.stockPortionPct)}% · Debt{" "}
        {pct(assumptions.debtPortionPct)}%
      </p>
      <div className="mt-xs space-y-xs">
        <MiniSlider
          label="Cash"
          value={assumptions.cashPortionPct}
          onChange={(v) => onChange({ cashPortionPct: v })}
        />
        <MiniSlider
          label="Stock"
          value={assumptions.stockPortionPct}
          onChange={(v) => onChange({ stockPortionPct: v })}
        />
        <MiniSlider
          label="Debt"
          value={assumptions.debtPortionPct}
          onChange={(v) => onChange({ debtPortionPct: v })}
        />
      </div>
    </div>
  );
}

function MiniSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-sm">
      <span className="w-10 text-caption text-ink-tertiary">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
