import Link from "next/link";
import { notFound } from "next/navigation";
import { listDeals, dataSources } from "@/lib/deals-service";
import type { DealStatus } from "@/lib/types";
import { DealCard } from "@/components/deal-card";
import { DataBanner } from "@/components/data-banner";
import { Eyebrow, Section } from "@/components/ui";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const TABS: { status: DealStatus; label: string; blurb: string }[] = [
  {
    status: "completed",
    label: "Completed",
    blurb:
      "Closed deals with full facts — terms, rationale, disclosed synergies and the post-deal effect on each company.",
  },
  {
    status: "announced",
    label: "Announced",
    blurb:
      "Live, in-process deals. Each one is run through the model: accretion/dilution, exchange ratio, implied synergies, expected post-deal price and a bull/bear read for investing before close.",
  },
  {
    status: "rumored",
    label: "Rumored",
    blurb:
      "Speculative and unconfirmed deals sourced from news. Same model as announced, flagged with a confidence level and source.",
  },
];

export default async function DealsSection({
  params,
}: {
  params: { status: string };
}) {
  const tab = TABS.find((t) => t.status === params.status);
  if (!tab) notFound();

  const [deals, sources] = await Promise.all([
    listDeals(tab.status),
    Promise.resolve(dataSources()),
  ]);

  return (
    <Section className="page-enter py-xxl">
      <Eyebrow>Deal intelligence</Eyebrow>
      <h1 className="mt-sm text-display-md text-ink">{tab.label} deals</h1>
      <p className="mt-md max-w-[680px] text-body-lg text-ink-muted">{tab.blurb}</p>

      {/* Tabs */}
      <div className="mt-lg flex flex-wrap gap-xs">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/deals/${t.status}`}
            className={cn(
              "rounded-pill px-[14px] py-[6px] text-body-sm transition-colors",
              t.status === tab.status
                ? "bg-surface-2 text-ink"
                : "bg-canvas text-ink-subtle hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-lg">
        <DataBanner sources={sources} />
      </div>

      {deals.length === 0 ? (
        <p className="mt-xl text-body text-ink-subtle">
          No {tab.label.toLowerCase()} deals available right now.
        </p>
      ) : (
        <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {tab.status !== "completed" && (
        <p className="mt-xl max-w-[680px] text-caption text-ink-tertiary">
          Model outputs are estimates derived from public facts and adjustable assumptions — not
          investment advice. Open any deal to see and edit the assumptions behind the numbers.
        </p>
      )}
    </Section>
  );
}
