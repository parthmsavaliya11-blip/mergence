"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

const KEY = "mergence_watchlist";

export type SavedDeal = {
  id: string;
  acquirer: string;
  target: string;
  status: string;
};

export function readWatchlist(): SavedDeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedDeal[]) : [];
  } catch {
    return [];
  }
}

function writeWatchlist(list: SavedDeal[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  // Let other components on the page (e.g. the /saved list) react.
  window.dispatchEvent(new Event("mergence:watchlist"));
}

/** Toggle a deal in the browser-local watchlist. */
export function SaveDealButton({ deal }: { deal: SavedDeal }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readWatchlist().some((d) => d.id === deal.id));
  }, [deal.id]);

  function toggle() {
    const list = readWatchlist();
    const idx = list.findIndex((d) => d.id === deal.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(deal);
    writeWatchlist(list);
    setSaved(idx < 0);
  }

  return (
    <Button variant="secondary" onClick={toggle} aria-pressed={saved}>
      {saved ? "★ Saved" : "☆ Save"}
    </Button>
  );
}
