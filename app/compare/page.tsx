import Link from "next/link";
import { listDeals, modelDeal, findDeal, type DealWithModel } from "@/lib/deals-service";
import { Badge, Card, Eyebrow, Section, Stat } from "@/components/ui";
import { VerdictPill } from "@/components/verdict-pill";
import { ComparePicker, type CompareOption } from "@/components/compare-picker";
import { computeDealScore, scoreMeta } from "@/lib/deal-insights";
import { fmtCurrencyCompact, fmtPct, fmtPctRaw, fmtPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Compare deals — Mergence",
  description: "Put two M&A deals side by side and compare their model scores and economics.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string };
}) {
  const [announced, completed] = await Promise.all([
    listDeals("announced"),
    listDeals("completed"),
  ]);
  const options: CompareOption[] = [...announced, ...completed].map((d) => ({
    id: d.id,
    label: `${d.acquirer} → ${d.target}`,
  }));

  const a = searchParams.a;
  const b = searchParams.b;
  let left: DealWithModel | null = null;
  let right: DealWithModel | null = null;
  if (a && b) {
    const [fa, fb] = await Promise.all([findDeal(a), findDeal(b)]);
    [left, right] = await Promise.all([
      fa ? modelDeal(fa) : Promise.resolve(null),
      fb ? modelDeal(fb) : Promise.resolve(null),
    ]);
  }

  return (
    <Section className="page-enter py-xxl">
      <Eyebrow>Side by side</Eyebrow>
      <h1 className="mt-sm text-display-md text-ink">Compare two deals</h1>
      <p className="mt-md max-w-[680px] text-body-lg text-ink-muted">
        Pick two deals to see whose economics look stronger — deal score, accretion, premium and
        synergies, side by side.
      </p>

      <div className="mt-lg">
        <ComparePicker options={options} initialA={a} initialB={b} />
      </div>

      {left && right ? (
        <div className="mt-xl grid grid-cols-1 gap-md md:grid-cols-2">
          <CompareColumn dw={left} other={right} />
          <CompareColumn dw={right} other={left} />
        </div>
      ) : (
        <p className="mt-xl text-body text-ink-subtle">
          Choose two deals above and press <span className="text-ink">Compare</span>.
        </p>
      )}
    </Section>
  );
}

function CompareColumn({ dw, other }: { dw: DealWithModel; other: DealWithModel }) {
  const { facts, model } = dw;
  const cur = facts.currency ?? "USD";
  if (!model) {
    return (
      <Card>
        <h2 className="text-card-title text-ink">
          {facts.acquirer} → {facts.target}
        </h2>
        <p className="mt-sm text-body-sm text-ink-subtle">
          Not enough financial data to model this deal.
        </p>
      </Card>
    );
  }
  const score = computeDealScore(model);
  const otherScore = other.model ? computeDealScore(other.model) : -1;
  const meta = scoreMeta(score);
  const isHigher = score >= otherScore;

  return (
    <Card className={isHigher ? "border-[#2c3170]" : undefined}>
      <div className="flex items-center justify-between gap-sm">
        <Link
          href={`/deal/${facts.id}`}
          className="text-card-title text-ink hover:text-primary"
        >
          {facts.acquirer} <span className="text-ink-tertiary">→</span> {facts.target}
        </Link>
        {isHigher && <Badge tone="primary">Higher score</Badge>}
      </div>

      <div className="mt-md flex items-end gap-sm">
        <span
          className={`font-mono text-display-md tabular-nums ${
            meta.tone === "bull" ? "text-bull" : meta.tone === "bear" ? "text-bear" : "text-ink"
          }`}
        >
          {score}
        </span>
        <span className="mb-[6px] text-body-sm text-ink-subtle">/ 100 · {meta.label}</span>
        <span className="mb-[4px] ml-auto">
          <VerdictPill verdict={model.verdict} />
        </span>
      </div>

      <div className="mt-md grid grid-cols-2 gap-sm">
        <Stat
          label="Accretion / dilution"
          value={fmtPct(model.accretionDilutionPct)}
          tone={model.isAccretive ? "bull" : "bear"}
        />
        <Stat label="Premium" value={fmtPctRaw(model.premiumPct, 0)} />
        <Stat label="Offer value" value={fmtCurrencyCompact(model.offerValue, cur)} />
        <Stat label="Net synergies" value={fmtCurrencyCompact(model.netSynergies, cur)} />
        <Stat label="Pro-forma EPS" value={fmtPrice(model.proFormaEPS, cur)} />
        <Stat
          label="Exchange ratio"
          value={model.exchangeRatio != null ? model.exchangeRatio.toFixed(4) : "—"}
        />
      </div>
    </Card>
  );
}
