"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui";

const links = [
  { href: "/screener", label: "Screener" },
  { href: "/deals/announced", label: "Announced" },
  { href: "/deals/completed", label: "Completed" },
  { href: "/deals/rumored", label: "Rumored" },
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-[56px] border-b border-hairline bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-lg">
        <Link href="/" className="flex items-center gap-xs" onClick={() => setOpen(false)}>
          <BrandMark />
          <span className="text-body font-semibold tracking-[-0.3px] text-ink">Mergence</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-sm py-[6px] text-body-sm transition-colors",
                  active ? "text-ink" : "text-ink-subtle hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-xs md:flex">
          <ButtonLink href="/deals/announced" variant="secondary">
            View deals
          </ButtonLink>
          <ButtonLink href="/screener" variant="primary">
            Start screening
          </ButtonLink>
        </div>

        <button
          className="focus-ring rounded-md p-xs text-ink md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-b border-hairline bg-canvas px-lg py-md md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-sm py-xs text-body-sm text-ink-subtle hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <ButtonLink href="/screener" variant="primary" className="mt-xs" onClick={() => setOpen(false)}>
              Start screening
            </ButtonLink>
          </nav>
        </div>
      )}
    </header>
  );
}

export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-sm bg-primary"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 16 16" fill="none">
        <path
          d="M2 11.5L6 4.5L8 8L10 4.5L14 11.5"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
