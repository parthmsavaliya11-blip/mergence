"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select } from "@/components/ui";

export type CompareOption = { id: string; label: string };

export function ComparePicker({
  options,
  initialA,
  initialB,
}: {
  options: CompareOption[];
  initialA?: string;
  initialB?: string;
}) {
  const router = useRouter();
  const [a, setA] = useState(initialA ?? options[0]?.id ?? "");
  const [b, setB] = useState(initialB ?? options[1]?.id ?? "");

  function compare() {
    if (!a || !b) return;
    router.push(`/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
  }

  return (
    <div className="grid grid-cols-1 items-end gap-sm sm:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="mb-xs block text-body-sm text-ink-muted">First deal</label>
        <Select value={a} onChange={(e) => setA(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-xs block text-body-sm text-ink-muted">Second deal</label>
        <Select value={b} onChange={(e) => setB(e.target.value)}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="primary" onClick={compare} disabled={!a || !b || a === b}>
        Compare →
      </Button>
    </div>
  );
}
