"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eyebrow, Section } from "@/components/ui";
import { StatusBadge } from "@/components/verdict-pill";
import { readWatchlist, type SavedDeal } from "@/components/save-deal-button";

export default function SavedPage() {
  const [deals, setDeals] = useState<SavedDeal[]>([]);

  useEffect(() => {
    const sync = () => setDeals(readWatchlist());
    sync();
    window.addEventListener("mergence:watchlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mergence:watchlist", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Section className="page-enter py-xxl">
      <Eyebrow>Your watchlist</Eyebrow>
      <h1 className="mt-sm text-display-md text-ink">Saved deals</h1>
      <p className="mt-md max-w-[680px] text-body-lg text-ink-muted">
        Deals you&apos;ve saved are kept in this browser. Open any to re-run the model.
      </p>

      {deals.length === 0 ? (
        <div className="mt-xl rounded-lg border border-hairline bg-surface-1 p-xl text-center">
          <p className="text-body text-ink-subtle">
            No saved deals yet. Open a deal and tap <span className="text-ink">☆ Save</span> to add it
            here.
          </p>
          <Link
            href="/deals/announced"
            className="mt-md inline-block text-body-sm font-medium text-primary hover:text-primary-hover"
          >
            Browse announced deals →
          </Link>
        </div>
      ) : (
        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d) => (
            <Link
              key={d.id}
              href={`/deal/${d.id}`}
              className="focus-ring lift group block rounded-lg border border-hairline bg-surface-1 p-lg hover:bg-surface-2"
            >
              <StatusBadge status={d.status} />
              <h3 className="mt-md text-card-title text-ink">
                {d.acquirer}
                <span className="text-ink-tertiary"> → </span>
                {d.target}
              </h3>
              <p className="mt-md text-body-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open model →
              </p>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
