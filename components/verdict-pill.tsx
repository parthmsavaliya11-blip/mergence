import { Badge } from "@/components/ui";
import type { Verdict } from "@/lib/types";

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  if (verdict === "bullish")
    return (
      <Badge tone="bull">
        <Arrow up /> Bullish
      </Badge>
    );
  if (verdict === "bearish")
    return (
      <Badge tone="bear">
        <Arrow /> Bearish
      </Badge>
    );
  return <Badge tone="neutral">— Neutral</Badge>;
}

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d={up ? "M5 1.5L8.5 6H1.5L5 1.5Z" : "M5 8.5L1.5 4H8.5L5 8.5Z"}
        fill="currentColor"
      />
    </svg>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed" ? "success" : status === "announced" ? "primary" : "warning";
  const label =
    status === "completed" ? "Completed" : status === "announced" ? "Announced" : "Rumored";
  return <Badge tone={tone as never}>{label}</Badge>;
}
