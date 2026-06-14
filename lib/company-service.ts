// Company overview service — powers the /company/[symbol] detail page.
// Resolves a single company's profile + financials, enriched the same way deals
// are (FMP profile + Finnhub earnings fallback + curated sample overview), so
// the screener results and deal snapshots can drill into a full company view.

import type { CompanyFinancials } from "./types";
import { getCompanyFinancials, hasFmpKey } from "./fmp";
import { getFinnhubFundamentals, hasFinnhubKey } from "./finnhub";
import { sampleFinancials, SAMPLE_FINANCIALS } from "./sample-data";

export interface CompanyView {
  company: CompanyFinancials;
  live: boolean;
}

/** Resolve a company's full overview + financials for the detail page. */
export async function getCompany(symbol: string): Promise<CompanyView | null> {
  if (!symbol) return null;
  const sym = symbol.toUpperCase();

  let company = await getCompanyFinancials(sym);
  const live = hasFmpKey() && !!company && company.price > 0;

  // Backfill earnings from Finnhub when FMP's free tier omitted them.
  if (company && company.netIncome === 0 && hasFinnhubKey()) {
    const f = await getFinnhubFundamentals(company.symbol);
    if (f) {
      company = {
        ...company,
        netIncome: f.netIncome || company.netIncome,
        sharesOutstanding: company.sharesOutstanding || f.sharesOutstanding,
        price: company.price || f.price || 0,
        marketCap: company.marketCap || f.marketCap || 0,
        industry: company.industry || f.sector,
      };
    }
  }

  // Borrow a curated overview if the live profile didn't include one.
  if (company && !company.description) {
    const s = sampleFinancials(sym);
    if (s) {
      company = {
        ...company,
        description: company.description || s.description,
        website: company.website || s.website,
        industry: company.industry || s.industry,
        employees: company.employees || s.employees,
      };
    }
  }

  if (!company) {
    const s = SAMPLE_FINANCIALS[sym];
    if (!s) return null;
    company = s;
  }

  return { company, live };
}
