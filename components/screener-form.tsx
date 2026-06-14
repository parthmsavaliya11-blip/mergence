"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Label, Select, TextInput, Badge } from "@/components/ui";
import { CAP_BANDS, RATIONALES, REGIONS, SECTORS } from "@/lib/constants";
import type { ScreenerMatch, ScreenerQuery } from "@/lib/types";
import { fmtCurrencyCompact, fmtPrice } from "@/lib/format";

export function ScreenerForm() {
  const [ownName, setOwnName] = useState("");
  const [ownCap, setOwnCap] = useState("");
  const [ownSector, setOwnSector] = useState("");
  const [ownRegion, setOwnRegion] = useState("");
  const [targetSector, setTargetSector] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [capBand, setCapBand] = useState("0");
  const [rationale, setRationale] = useState("");

  const [matches, setMatches] = useState<ScreenerMatch[] | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const band = CAP_BANDS[parseInt(capBand, 10)] ?? CAP_BANDS[0];
    const query: ScreenerQuery = {
      ownCompanyName: ownName || undefined,
      ownMarketCap: ownCap ? parseFloat(ownCap) * 1e9 : undefined,
      ownSector: ownSector || undefined,
      ownRegion: ownRegion || undefined,
      targetSector: targetSector || undefined,
      targetRegion: targetRegion || undefined,
      marketCapMin: band.min,
      marketCapMax: band.max,
      rationale: rationale || undefined,
      limit: 24,
    };
    try {
      const res = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { matches: ScreenerMatch[]; live: boolean };
      setMatches(data.matches);
      setLive(data.live);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-lg lg:grid-cols-[400px_1fr]">
      {/* Form */}
      <form onSubmit={submit} className="lg:sticky lg:top-[72px] lg:self-start">
        <Card>
          <h2 className="text-card-title text-ink">Your company</h2>
          <div className="mt-md space-y-md">
            <Field label="Company name">
              <TextInput
                value={ownName}
                onChange={(e) => setOwnName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </Field>
            <Field label="Valuation / market cap (USD billions)">
              <TextInput
                type="number"
                value={ownCap}
                onChange={(e) => setOwnCap(e.target.value)}
                placeholder="e.g. 12"
                min={0}
                step={0.1}
              />
            </Field>
            <div className="grid grid-cols-2 gap-sm">
              <Field label="Sector">
                <Select value={ownSector} onChange={(e) => setOwnSector(e.target.value)}>
                  <option value="">Any</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Region">
                <Select value={ownRegion} onChange={(e) => setOwnRegion(e.target.value)}>
                  <option value="">Any</option>
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <h2 className="mt-lg border-t border-hairline pt-lg text-card-title text-ink">
            Target criteria
          </h2>
          <div className="mt-md space-y-md">
            <div className="grid grid-cols-2 gap-sm">
              <Field label="Sector">
                <Select value={targetSector} onChange={(e) => setTargetSector(e.target.value)}>
                  <option value="">Any</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Region">
                <Select value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)}>
                  <option value="">Any</option>
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Valuation band">
              <Select value={capBand} onChange={(e) => setCapBand(e.target.value)}>
                {CAP_BANDS.map((b, i) => (
                  <option key={b.label} value={i}>
                    {b.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Reason for acquiring">
              <Select value={rationale} onChange={(e) => setRationale(e.target.value)}>
                <option value="">Select a rationale…</option>
                {RATIONALES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Button type="submit" className="mt-lg w-full" disabled={loading}>
            {loading ? "Screening…" : "Find targets"}
          </Button>
        </Card>
      </form>

      {/* Results */}
      <div>
        {error && (
          <div className="rounded-md border border-[#5a2a2a] bg-[#311515] px-sm py-xs text-body-sm text-bear">
            {error}
          </div>
        )}

        {matches == null ? (
          <Card className="flex min-h-[280px] items-center justify-center text-center">
            <div>
              <p className="text-body-lg text-ink-muted">Describe your company and what you want to acquire.</p>
              <p className="mt-xs text-body-sm text-ink-subtle">
                We screen the company universe and rank targets by fit.
              </p>
            </div>
          </Card>
        ) : matches.length === 0 ? (
          <Card>
            <p className="text-body text-ink-subtle">
              No targets matched. Try widening the sector, region, or valuation band.
            </p>
          </Card>
        ) : (
          <div>
            <div className="mb-md flex items-center justify-between">
              <p className="text-body-sm text-ink-subtle">{matches.length} ranked targets</p>
              {!live && <Badge tone="warning">Sample universe — add FMP_API_KEY for live</Badge>}
            </div>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              {matches.map((m) => (
                <MatchCard key={m.symbol} m={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MatchCard({ m }: { m: ScreenerMatch }) {
  return (
    <Link
      href={`/company/${encodeURIComponent(m.symbol)}`}
      className="focus-ring lift group block rounded-lg border border-hairline bg-surface-1 p-lg transition-colors hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-sm">
        <div>
          <p className="text-card-title text-ink">{m.name}</p>
          <p className="font-mono text-caption text-ink-tertiary">
            {m.symbol}
            {m.country ? ` · ${m.country}` : ""}
          </p>
        </div>
        <ScoreRing score={m.matchScore} />
      </div>

      <dl className="mt-md grid grid-cols-2 gap-x-md gap-y-xs text-body-sm">
        <div className="flex justify-between">
          <dt className="text-ink-tertiary">Market cap</dt>
          <dd className="font-mono text-ink-muted">{fmtCurrencyCompact(m.marketCap)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-tertiary">Price</dt>
          <dd className="font-mono text-ink-muted">{fmtPrice(m.price)}</dd>
        </div>
        {m.sector && (
          <div className="col-span-2 flex justify-between">
            <dt className="text-ink-tertiary">Sector</dt>
            <dd className="text-ink-muted">{m.sector}</dd>
          </div>
        )}
      </dl>

      <ul className="mt-md flex flex-wrap gap-xs">
        {m.matchReasons.slice(0, 3).map((r, i) => (
          <li key={i}>
            <Badge tone="neutral">{r}</Badge>
          </li>
        ))}
      </ul>

      <p className="mt-md text-body-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        View company overview →
      </p>
    </Link>
  );
}

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? "text-bull" : score >= 55 ? "text-primary" : "text-ink-subtle";
  return (
    <div className="flex flex-col items-center">
      <span className={`font-mono text-[20px] font-semibold tabular-nums ${tone}`}>{score}</span>
      <span className="text-caption text-ink-tertiary">fit</span>
    </div>
  );
}
