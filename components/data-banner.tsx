import { Badge } from "@/components/ui";
import type { DataSourceInfo } from "@/lib/deals-service";

/** Shows whether the page is running on live API data or the curated fallback. */
export function DataBanner({ sources }: { sources: DataSourceInfo }) {
  const live = sources.fmp;
  if (live) {
    return (
      <div className="flex items-center gap-xs text-caption text-ink-subtle">
        <Badge tone="success">Live</Badge>
        Live data via Financial Modeling Prep{sources.news ? " + Marketaux news" : ""}.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-xs rounded-md border border-hairline bg-surface-1 px-sm py-xs text-caption text-ink-subtle">
      <Badge tone="warning">Sample data</Badge>
      <span>
        Showing curated example deals. Add <code className="font-mono text-ink-muted">FMP_API_KEY</code> to{" "}
        <code className="font-mono text-ink-muted">.env</code> for live data — see the README.
      </span>
    </div>
  );
}
