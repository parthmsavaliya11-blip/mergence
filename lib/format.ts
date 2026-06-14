// Formatting helpers shared across the UI.

export function fmtCurrencyCompact(n: number | undefined | null, currency = "USD"): string {
  if (n == null || !isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const sym = currencySymbol(currency);
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${sym}${abs.toFixed(2)}`;
}

export function fmtPrice(n: number | undefined | null, currency = "USD"): string {
  if (n == null || !isFinite(n)) return "—";
  return `${currencySymbol(currency)}${n.toFixed(2)}`;
}

export function fmtPct(n: number | undefined | null, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(digits)}%`;
}

export function fmtPctRaw(n: number | undefined | null, digits = 1): string {
  if (n == null || !isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtNumber(n: number | undefined | null): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function fmtDate(s: string | undefined | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function currencySymbol(currency: string): string {
  switch (currency?.toUpperCase()) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    case "INR":
      return "₹";
    default:
      return "$";
  }
}
