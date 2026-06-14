"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ButtonLink, Card, Section } from "@/components/ui";
import { cn } from "@/lib/cn";

type Topic = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  callout: { label: string; text: string };
  /** Last slide shows direct CTAs into the product. */
  final?: boolean;
};

const TOPICS: Topic[] = [
  {
    eyebrow: "The basics",
    title: "What is M&A?",
    body: "Mergers & acquisitions (M&A) is how companies grow by combining with — or buying — other companies, instead of building everything from scratch. A merger blends two companies into one; an acquisition is one company buying another and absorbing it.",
    points: [
      "Acquirer — the company doing the buying.",
      "Target — the company being bought.",
      "The result is a single, larger “combined” company.",
    ],
    callout: {
      label: "Example",
      text: "When Capital One agreed to buy Discover, Capital One is the acquirer and Discover is the target.",
    },
  },
  {
    eyebrow: "Motivation",
    title: "Why companies do deals",
    body: "No company buys another without a reason. The “deal rationale” is the strategic logic behind it — and it's the very first thing worth judging.",
    points: [
      "Growth — enter new markets or regions faster than building from zero.",
      "Capability — buy technology, products, or talent outright.",
      "Scale — cut costs by combining overlapping operations.",
      "Defense — stop a rival from getting there first.",
    ],
    callout: {
      label: "Why it matters",
      text: "A clear, believable rationale is a green flag. Empire-building with no real fit is a red flag.",
    },
  },
  {
    eyebrow: "Deal structure",
    title: "How a deal is paid for",
    body: "An acquirer pays with cash, with its own stock, or a mix of both — often funded partly by taking on debt. How it's paid for changes the entire math.",
    points: [
      "Cash deal — target shareholders receive money; the acquirer may borrow to fund it.",
      "Stock deal — target shareholders receive newly issued acquirer shares.",
      "Mix — a blend of cash and stock.",
    ],
    callout: {
      label: "Key idea",
      text: "Stock deals create new shares, dividing future profit among more owners — this is central to the EPS math you'll see later.",
    },
  },
  {
    eyebrow: "Price",
    title: "The premium",
    body: "Acquirers almost always pay more than the target's current share price. That extra amount is the premium — the incentive for target shareholders to agree to sell.",
    points: [
      "Premium = how far the offer price sits above the pre-deal market price.",
      "Typical premiums run roughly 20–40%, but they vary widely.",
      "Pay too high a premium and you risk overpaying; too low and the deal may fail.",
    ],
    callout: {
      label: "Example",
      text: "If a stock trades at $100 and the offer is $130 per share, that's a 30% premium.",
    },
  },
  {
    eyebrow: "Stock deals",
    title: "The exchange ratio",
    body: "In a stock deal, target shareholders don't receive cash — they receive acquirer shares. The exchange ratio sets how many acquirer shares they get for each share they hold.",
    points: [
      "Exchange ratio = acquirer shares handed over per 1 target share.",
      "It's driven by the offer price relative to the acquirer's own share price.",
      "The more shares issued, the more existing acquirer owners are diluted.",
    ],
    callout: {
      label: "Example",
      text: "A 1.02 exchange ratio means each target share converts into 1.02 acquirer shares.",
    },
  },
  {
    eyebrow: "The upside",
    title: "Synergies",
    body: "Synergies are the extra value created by combining — the “1 + 1 = 3” argument. They're the main justification for paying a premium at all.",
    points: [
      "Cost synergies — savings from removing duplicate costs (offices, systems, staff).",
      "Revenue synergies — selling more by combining products and customers.",
      "Run-rate — the full annual synergy level, once integration is finished.",
      "Integration costs — the one-time, upfront price of merging the two.",
    ],
    callout: {
      label: "Reality check",
      text: "Synergies are estimates, not facts. Models test how large they'd need to be to make a deal worth it.",
    },
  },
  {
    eyebrow: "The core math",
    title: "EPS — accretion & dilution",
    body: "EPS (earnings per share) = profit ÷ number of shares. The big question for any deal: does combining the two companies raise or lower the acquirer's EPS?",
    points: [
      "Pro-forma EPS — the combined company's expected EPS after the deal.",
      "Accretive — the deal raises EPS (generally good for the acquirer).",
      "Dilutive — the deal lowers EPS (a warning sign).",
      "Stock deals add shares, so profits and synergies must outweigh that.",
    ],
    callout: {
      label: "This is the heart of it",
      text: "Mergence computes accretion/dilution for every deal — it's the single most-watched number.",
    },
  },
  {
    eyebrow: "Valuation",
    title: "The expected post-deal price",
    body: "Earnings get turned into a share price using a P/E multiple — the price investors are willing to pay for each $1 of earnings.",
    points: [
      "P/E ratio = share price ÷ EPS.",
      "Expected price ≈ pro-forma EPS × an assumed P/E.",
      "Higher EPS from a good deal supports a higher share price.",
    ],
    callout: {
      label: "How to use it",
      text: "If the model's expected price sits above today's price, the market may re-rate the acquirer upward after close.",
    },
  },
  {
    eyebrow: "Putting it together",
    title: "The bull / bear verdict",
    body: "Mergence weighs everything — premium, financing, synergies, accretion/dilution — into one plain read on whether a deal looks favorable.",
    points: [
      "Bullish — accretive, with a sensible premium and credible synergies.",
      "Bearish — dilutive, or overpaying with thin synergies.",
      "Every assumption is editable, so you can stress-test the verdict yourself.",
    ],
    callout: {
      label: "You're ready",
      text: "Find a target with the screener, or open an announced deal to see the full model in action.",
    },
    final: true,
  },
];

export function LearnGuide() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const total = TOPICS.length;
  const topic = TOPICS[i];
  const isFirst = i === 0;
  const isLast = i === total - 1;

  const finish = useCallback(() => router.push("/"), [router]);
  const next = useCallback(
    () => (isLast ? finish() : setI((n) => Math.min(n + 1, total - 1))),
    [isLast, finish, total],
  );
  const prev = useCallback(() => setI((n) => Math.max(n - 1, 0)), []);

  // Keyboard navigation: ← / → to move, Esc to skip to the site.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, finish]);

  return (
    <Section className="py-xl">
      {/* Top bar: title + progress + skip */}
      <div className="flex items-center justify-between gap-md">
        <div className="flex items-baseline gap-sm">
          <span className="text-eyebrow uppercase text-ink-subtle">M&amp;A basics</span>
          <span className="font-mono text-caption text-ink-tertiary tabular-nums">
            {i + 1} / {total}
          </span>
        </div>
        <button
          onClick={finish}
          className="focus-ring rounded-md px-sm py-[6px] text-body-sm text-ink-subtle transition-colors hover:text-ink"
        >
          Skip intro →
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-sm h-[3px] w-full overflow-hidden rounded-pill bg-surface-2">
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${((i + 1) / total) * 100}%` }}
        />
      </div>

      <div className="mx-auto mt-lg w-full max-w-[760px]">
        {/* Slide — fixed min-height so every page is the same size and the
            controls below never shift between slides. */}
        <Card key={i} className="page-enter flex min-h-[560px] flex-col p-xxl">
          <Badge tone="primary">{topic.eyebrow}</Badge>
          <h1 className="mt-md text-display-md text-ink">{topic.title}</h1>
          <p className="mt-md text-body-lg text-ink-muted">{topic.body}</p>

          <ul className="mt-lg space-y-sm">
            {topic.points.map((p) => (
              <li key={p} className="flex gap-sm text-body text-ink-muted">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          {/* Callout pinned to the bottom of the card for a consistent rhythm. */}
          <div className="mt-auto pt-lg">
            <div className="rounded-md border border-hairline-tertiary bg-surface-2 p-md">
              <p className="text-caption uppercase tracking-wide text-ink-subtle">
                {topic.callout.label}
              </p>
              <p className="mt-1 text-body-sm text-ink-muted">{topic.callout.text}</p>
            </div>

            {topic.final && (
              <div className="mt-md flex flex-wrap gap-sm">
                <ButtonLink href="/screener" variant="primary">
                  Start screening
                </ButtonLink>
                <ButtonLink href="/deals/announced" variant="secondary">
                  Explore live deals
                </ButtonLink>
              </div>
            )}
          </div>
        </Card>

        {/* Controls — Previous always far-left, Next always far-right, identical
            on every slide; dots centered between them. */}
        <div className="mt-lg flex items-center justify-between gap-md">
          <Button
            variant="secondary"
            onClick={prev}
            disabled={isFirst}
            className="min-w-[116px] justify-center"
          >
            ← Previous
          </Button>

          <div className="hidden items-center gap-2 sm:flex">
            {TOPICS.map((t, idx) => (
              <button
                key={t.title}
                onClick={() => setI(idx)}
                aria-label={`Go to step ${idx + 1}: ${t.title}`}
                aria-current={idx === i ? "step" : undefined}
                className={cn(
                  "h-1.5 rounded-pill transition-all",
                  idx === i ? "w-5 bg-primary" : "w-1.5 bg-surface-3 hover:bg-ink-tertiary",
                )}
              />
            ))}
          </div>

          <Button variant="primary" onClick={next} className="min-w-[116px] justify-center">
            {isLast ? "Finish →" : "Next →"}
          </Button>
        </div>
      </div>
    </Section>
  );
}
