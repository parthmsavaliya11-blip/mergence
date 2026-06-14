import Link from "next/link";
import { BrandMark } from "@/components/top-nav";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/screener", label: "Screener" },
      { href: "/deals/announced", label: "Announced deals" },
      { href: "/deals/completed", label: "Completed deals" },
      { href: "/deals/rumored", label: "Rumored deals" },
    ],
  },
  {
    title: "Data",
    links: [
      { href: "https://site.financialmodelingprep.com", label: "Financial Modeling Prep" },
      { href: "https://www.sec.gov/edgar", label: "SEC EDGAR" },
      { href: "https://www.marketaux.com", label: "Marketaux News" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-xl px-xl py-[64px] sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-xs">
            <BrandMark />
            <span className="text-body font-semibold text-ink">Mergence</span>
          </div>
          <p className="mt-sm max-w-[260px] text-caption text-ink-subtle">
            M&amp;A screening and deal intelligence. Analytics are model estimates, not
            investment advice.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-caption font-medium text-ink-subtle">{col.title}</p>
            <ul className="mt-sm space-y-xs">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-caption text-ink-tertiary transition-colors hover:text-ink-muted"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-content px-xl pb-xl">
        <p className="text-caption text-ink-tertiary">
          © {new Date().getFullYear()} Mergence. For research and educational use only.
        </p>
      </div>
    </footer>
  );
}
