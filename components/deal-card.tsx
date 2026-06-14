import Link from "next/link";
import { Badge } from "@/components/ui";
import { StatusBadge } from "@/components/verdict-pill";
import { fmtCurrencyCompact, fmtDate, fmtPctRaw } from "@/lib/format";
import type { DealFacts } from "@/lib/types";

export function DealCard({ deal }: { deal: DealFacts }) {
  return (
    <Link
      href={`/deal/${deal.id}`}
      className="focus-ring lift group block rounded-lg border border-hairline bg-surface-1 p-lg hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-sm">
        <StatusBadge status={deal.status} />
        {deal.confidence && (
          <Badge tone="neutral">{deal.confidence} confidence</Badge>
        )}
      </div>

      <h3 className="mt-md text-card-title text-ink">
        {deal.acquirer}
        <span className="text-ink-tertiary"> → </span>
        {deal.target}
      </h3>

      {deal.rationale && (
        <p className="mt-xs line-clamp-2 text-body-sm text-ink-subtle">{deal.rationale}</p>
      )}

      <dl className="mt-md grid grid-cols-3 gap-sm">
        <Field label="Value" value={fmtCurrencyCompact(deal.dealValue, deal.currency)} />
        <Field
          label="Structure"
          value={deal.structure === "unknown" ? "—" : capitalize(deal.structure)}
        />
        <Field
          label={deal.status === "completed" ? "Closed" : "Announced"}
          value={fmtDate(deal.status === "completed" ? deal.closedDate : deal.announcedDate)}
        />
      </dl>

      {(deal.premiumPct != null || deal.disclosedSynergies != null) && (
        <div className="mt-md flex flex-wrap gap-xs border-t border-hairline-tertiary pt-md">
          {deal.premiumPct != null && (
            <Badge tone="neutral">Premium {fmtPctRaw(deal.premiumPct, 0)}</Badge>
          )}
          {deal.disclosedSynergies != null && deal.disclosedSynergies > 0 && (
            <Badge tone="neutral">
              Synergies {fmtCurrencyCompact(deal.disclosedSynergies, deal.currency)}
            </Badge>
          )}
          {deal.sector && <Badge tone="neutral">{deal.sector}</Badge>}
        </div>
      )}

      <p className="mt-md text-body-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {deal.status === "completed" ? "View deal & effects →" : "Open model →"}
      </p>
    </Link>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-caption text-ink-tertiary">{label}</dt>
      <dd className="mt-[2px] font-mono text-body-sm text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
