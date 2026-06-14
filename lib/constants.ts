// Shared option lists for the screener form.

export const SECTORS = [
  "Technology",
  "Communication Services",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Industrials",
  "Energy",
  "Utilities",
  "Basic Materials",
  "Real Estate",
];

export const REGIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "CA", label: "Canada" },
  { code: "JP", label: "Japan" },
  { code: "IN", label: "India" },
  { code: "CN", label: "China" },
  { code: "AU", label: "Australia" },
  { code: "BR", label: "Brazil" },
];

export const RATIONALES = [
  "Global expansion / new markets",
  "Technological development",
  "Vertical integration",
  "Horizontal scale / market share",
  "Diversification",
  "Talent / acqui-hire",
  "Cost synergies",
  "Defensive / competitive response",
];

// Valuation bands in USD for the market-cap filter.
export const CAP_BANDS = [
  { label: "Any", min: undefined, max: undefined },
  { label: "Micro (< $300M)", min: undefined, max: 300_000_000 },
  { label: "Small ($300M–$2B)", min: 300_000_000, max: 2_000_000_000 },
  { label: "Mid ($2B–$10B)", min: 2_000_000_000, max: 10_000_000_000 },
  { label: "Large ($10B–$100B)", min: 10_000_000_000, max: 100_000_000_000 },
  { label: "Mega (> $100B)", min: 100_000_000_000, max: undefined },
];
