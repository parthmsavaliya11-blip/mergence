// SEC EDGAR enrichment — FREE, no API key. We link out to EDGAR's full-text
// search so a user can open the primary-source merger filings (S-4 registration
// with exchange ratios, DEFM14A merger proxy with synergies, 8-K/425 deal
// announcements) for a US deal.
//
// NOTE: an earlier programmatic full-text-search client lived here but was
// removed — it built non-functional document URLs against a mis-specified
// endpoint and always failed soft to []. Until it's reimplemented against the
// real EDGAR FTS API (efts.sec.gov/LATEST/search-index) with correct
// Archives/edgar/data/{cik}/{accession}/{doc} link construction, we expose only
// the human-facing search URL below, which is what the deal detail page uses.

/** Human-facing EDGAR full-text search page for a target's merger filings. */
export function edgarUiSearchUrl(target: string): string {
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(
    target,
  )}&type=S-4&dateb=&owner=include&count=20`;
}
