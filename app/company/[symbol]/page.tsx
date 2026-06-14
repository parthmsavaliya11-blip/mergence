import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/company-service";
import { Badge, ButtonLink, Card, Section, Stat } from "@/components/ui";
import { fmtCurrencyCompact, fmtNumber, fmtPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
}: {
  params: { symbol: string };
}) {
  const view = await getCompany(decodeURIComponent(params.symbol));
  if (!view) notFound();
  const { company: c, live } = view;
  const cur = c.currency ?? "USD";

  const eps =
    c.sharesOutstanding > 0 ? c.netIncome / c.sharesOutstanding : null;
  const pe = eps && eps > 0 && c.price > 0 ? c.price / eps : null;

  return (
    <Section className="py-xl">
      <Link
        href="/screener"
        className="text-body-sm text-ink-subtle transition-colors hover:text-ink"
      >
        ← Back to screener
      </Link>

      <div className="page-enter mt-md">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div>
            <div className="flex flex-wrap items-center gap-xs">
              {c.sector && <Badge tone="primary">{c.sector}</Badge>}
              {c.industry && <Badge tone="neutral">{c.industry}</Badge>}
              {c.country && <Badge tone="neutral">{c.country}</Badge>}
              {!live && <Badge tone="warning">Sample data</Badge>}
            </div>
            <h1 className="mt-md text-display-md text-ink">{c.name}</h1>
            <p className="mt-1 font-mono text-body-sm text-ink-tertiary">
              {c.symbol}
              {c.exchange ? ` · ${c.exchange}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-xs">
            {c.price > 0 && (
              <span className="font-mono text-headline text-ink tabular-nums">
                {fmtPrice(c.price, cur)}
              </span>
            )}
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm text-primary hover:text-primary-hover"
              >
                Visit website ↗
              </a>
            )}
          </div>
        </div>

        <div className="mt-lg grid grid-cols-1 gap-lg lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-lg">
            {/* Overview */}
            <Card>
              <h2 className="text-card-title text-ink">Overview</h2>
              <p className="mt-sm whitespace-pre-line text-body text-ink-muted">
                {c.description ??
                  "No company overview is available for this ticker. Add an FMP_API_KEY for full live profiles."}
              </p>
              {(c.ceo || c.employees) && (
                <dl className="mt-md grid grid-cols-2 gap-x-md gap-y-xs border-t border-hairline-tertiary pt-md text-body-sm sm:grid-cols-3">
                  {c.ceo && <Meta k="CEO" v={c.ceo} />}
                  {c.employees ? <Meta k="Employees" v={fmtNumber(c.employees)} /> : null}
                  {c.industry && <Meta k="Industry" v={c.industry} />}
                </dl>
              )}
            </Card>

            {/* Financials */}
            <div>
              <h2 className="mb-md text-card-title text-ink">Financial data</h2>
              <div className="grid grid-cols-2 gap-sm sm:grid-cols-3">
                <Stat label="Share price" value={c.price > 0 ? fmtPrice(c.price, cur) : "—"} />
                <Stat label="Market cap" value={fmtCurrencyCompact(c.marketCap, cur)} />
                <Stat
                  label="Net income (TTM)"
                  value={fmtCurrencyCompact(c.netIncome, cur)}
                  tone={c.netIncome > 0 ? "bull" : c.netIncome < 0 ? "bear" : "neutral"}
                />
                <Stat
                  label="Shares outstanding"
                  value={c.sharesOutstanding > 0 ? fmtNumber(c.sharesOutstanding) : "—"}
                />
                <Stat label="EPS (TTM)" value={eps != null ? fmtPrice(eps, cur) : "—"} />
                <Stat label="P/E ratio" value={pe != null ? `${pe.toFixed(1)}×` : "—"} />
                {c.beta != null && <Stat label="Beta" value={c.beta.toFixed(2)} />}
              </div>
              <p className="mt-sm text-caption text-ink-tertiary">
                {live
                  ? "Live figures via Financial Modeling Prep / Finnhub. EPS & P/E derived from net income and shares."
                  : "Approximate curated figures for illustration. Add an API key for live data."}
              </p>
            </div>
          </div>

          {/* Side rail */}
          <aside className="lg:sticky lg:top-[72px] lg:self-start">
            <Card>
              <h2 className="text-card-title text-ink">Model a deal</h2>
              <p className="mt-sm text-body-sm text-ink-subtle">
                Explore how an acquisition involving {c.name} could affect EPS, premium, and
                value — with editable assumptions.
              </p>
              <ButtonLink href="/deals/announced" variant="primary" className="mt-md w-full">
                Browse live deals
              </ButtonLink>
              <ButtonLink href="/screener" variant="secondary" className="mt-xs w-full">
                Screen more targets
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </div>
    </Section>
  );
}

function Meta({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-tertiary">{k}</dt>
      <dd className="mt-[2px] text-ink-muted">{v}</dd>
    </div>
  );
}
