// Faux product-UI panels rendered as JSX (no external images). These play the
// role of Linear's "product screenshots" — the protagonist of each section.

import { Badge } from "@/components/ui";

export function DealDashboardMock() {
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      {/* Faux window chrome */}
      <div className="flex items-center gap-xs border-b border-hairline pb-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-[#34373d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#34373d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#34373d]" />
        <span className="ml-sm text-ink-tertiary">mergence / deal / cof-dfs</span>
      </div>

      <div className="mt-md flex items-center justify-between">
        <div>
          <p className="text-[15px] text-ink">Capital One → Discover</p>
          <p className="text-ink-tertiary">Announced · Financial Services · US</p>
        </div>
        <Badge tone="bull">▲ Bullish</Badge>
      </div>

      <div className="mt-md grid grid-cols-3 gap-xs">
        <Cell k="Offer value" v="$35.3B" />
        <Cell k="Premium" v="27%" />
        <Cell k="Exch. ratio" v="1.0192" />
        <Cell k="Accr./Dil." v="+12.4%" tone="bull" />
        <Cell k="Pro-forma EPS" v="$14.62" />
        <Cell k="Synergies" v="$2.7B" tone="bull" />
      </div>

      <div className="mt-md rounded-md border border-hairline-tertiary bg-surface-2 p-sm">
        <p className="text-ink-subtle">why bullish</p>
        <p className="mt-1 text-ink-muted">
          EPS accretive · synergies above break-even · digestible premium
        </p>
      </div>
    </div>
  );
}

export function ScreenerMock() {
  const rows = [
    { name: "Juniper Networks", cap: "$11.9B", fit: 88 },
    { name: "Informatica", cap: "$10.4B", fit: 81 },
    { name: "Ansys", cap: "$29.0B", fit: 74 },
    { name: "Seagen", cap: "$43.0B", fit: 62 },
  ];
  return (
    <div className="font-mono text-[12px]">
      <div className="flex items-center gap-xs border-b border-hairline pb-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-[#34373d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#34373d]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#34373d]" />
        <span className="ml-sm text-ink-tertiary">mergence / screener</span>
      </div>
      <div className="mt-md flex flex-wrap gap-xs text-[11px]">
        <Badge tone="primary">Sector: Technology</Badge>
        <Badge tone="neutral">Region: US</Badge>
        <Badge tone="neutral">$2B–$50B</Badge>
        <Badge tone="neutral">Tech development</Badge>
      </div>
      <div className="mt-md space-y-xs">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-md border border-hairline-tertiary bg-surface-2 px-sm py-xs"
          >
            <span className="text-ink-muted">{r.name}</span>
            <span className="flex items-center gap-sm">
              <span className="text-ink-tertiary">{r.cap}</span>
              <span className={r.fit >= 75 ? "text-bull" : "text-primary"}>{r.fit} fit</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ k, v, tone }: { k: string; v: string; tone?: "bull" | "bear" }) {
  const t = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-ink";
  return (
    <div className="rounded-md border border-hairline-tertiary bg-surface-2 p-sm">
      <p className="text-[10px] text-ink-tertiary">{k}</p>
      <p className={`mt-1 text-[14px] ${t}`}>{v}</p>
    </div>
  );
}
