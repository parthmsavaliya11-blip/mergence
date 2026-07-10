import { ButtonLink, Card, Eyebrow, ScreenshotPanel, Section } from "@/components/ui";
import { DealDashboardMock, ScreenerMock } from "@/components/product-mock";
import { Badge } from "@/components/ui";

export default function Home() {
  return (
    <>
      {/* ----------------------------------------------------------------- Hero */}
      <Section className="relative pt-section pb-xxl">
        <div className="dot-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto max-w-[820px] text-center">
          <Badge tone="primary">M&amp;A screener &amp; deal intelligence</Badge>
          <h1 className="mt-lg text-[clamp(40px,7vw,80px)] font-semibold leading-[1.05] tracking-[-3px] text-ink">
            Find the target.
            <br />
            Model the deal.
          </h1>
          <p className="mx-auto mt-lg max-w-[620px] text-body-lg text-ink-muted">
            Screen acquisition targets by sector, valuation and rationale — then run any deal
            through an accretion/dilution model to see synergies, exchange ratios, expected post-deal
            price, and a bull/bear read before close.
          </p>
          <div className="mt-xl flex flex-wrap items-center justify-center gap-sm">
            <ButtonLink href="/evaluate" variant="primary">
              Evaluate a deal
            </ButtonLink>
            <ButtonLink href="/screener" variant="secondary">
              Start screening
            </ButtonLink>
            <ButtonLink href="/deals/announced" variant="secondary">
              Explore live deals
            </ButtonLink>
          </div>
        </div>

        {/* Hero product panel */}
        <div className="mx-auto mt-xxl max-w-[960px]">
          <ScreenshotPanel>
            <DealDashboardMock />
          </ScreenshotPanel>
        </div>
      </Section>

      {/* --------------------------------------------------------------- Screener */}
      <Section className="py-section">
        <div className="grid grid-cols-1 items-center gap-xl lg:grid-cols-2">
          <div>
            <Eyebrow>Screener</Eyebrow>
            <h2 className="mt-sm text-display-md text-ink">Targets ranked by strategic fit</h2>
            <p className="mt-md text-body-lg text-ink-muted">
              Describe your company — valuation, sector, region — and what you&apos;re looking for.
              We screen the universe and score every candidate on sector match, digestible size, and
              your stated reason for the deal.
            </p>
            <ul className="mt-lg space-y-sm text-body text-ink-muted">
              <Bullet>Filter by sector, region and valuation band</Bullet>
              <Bullet>Relative-size sanity vs your own market cap</Bullet>
              <Bullet>Rationale-aware ranking (expansion, tech, integration…)</Bullet>
            </ul>
          </div>
          <ScreenshotPanel>
            <ScreenerMock />
          </ScreenshotPanel>
        </div>
      </Section>

      {/* ------------------------------------------------------------ Three parts */}
      <Section className="py-section">
        <div className="max-w-[680px]">
          <Eyebrow>Deal intelligence</Eyebrow>
          <h2 className="mt-sm text-display-md text-ink">Three views of every deal</h2>
          <p className="mt-md text-body-lg text-ink-muted">
            Completed deals with full facts, announced deals with live modeling, and rumored deals
            flagged with confidence — all in one place.
          </p>
        </div>

        <div className="mt-xl grid grid-cols-1 gap-md md:grid-cols-3">
          <FeatureCard
            tone="success"
            tag="Completed"
            title="What closed, and what it did"
            body="Terms, rationale, disclosed synergies and the real post-deal effect on each company."
            href="/deals/completed"
          />
          <FeatureCard
            tone="primary"
            tag="Announced"
            title="Model it before it closes"
            body="Accretion/dilution, exchange ratio, implied synergies and expected post-deal price — with assumptions you can tune."
            href="/deals/announced"
          />
          <FeatureCard
            tone="warning"
            tag="Rumored"
            title="Position ahead of the news"
            body="Speculative deals sourced from news, run through the same model and flagged with a confidence level."
            href="/deals/rumored"
          />
        </div>
      </Section>

      {/* ----------------------------------------------------------------- CTA */}
      <Section className="pb-section">
        <Card className="rounded-lg p-xxl text-center">
          <h2 className="text-headline text-ink">Screen a target or model a deal in minutes.</h2>
          <p className="mx-auto mt-sm max-w-[520px] text-body text-ink-subtle">
            Connect a free Financial Modeling Prep key for live global data, or explore with the
            built-in sample deals first.
          </p>
          <div className="mt-lg flex flex-wrap justify-center gap-sm">
            <ButtonLink href="/screener" variant="primary">
              Open the screener
            </ButtonLink>
            <ButtonLink href="/deals/announced" variant="secondary">
              View announced deals
            </ButtonLink>
          </div>
        </Card>
      </Section>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-sm">
      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      {children}
    </li>
  );
}

function FeatureCard({
  tone,
  tag,
  title,
  body,
  href,
}: {
  tone: "success" | "primary" | "warning";
  tag: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="focus-ring edge-highlight group block rounded-lg border border-hairline bg-surface-1 p-lg transition-colors hover:bg-surface-2"
    >
      <Badge tone={tone}>{tag}</Badge>
      <h3 className="mt-md text-card-title text-ink">{title}</h3>
      <p className="mt-xs text-body-sm text-ink-subtle">{body}</p>
      <p className="mt-md text-body-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Open →
      </p>
    </a>
  );
}
