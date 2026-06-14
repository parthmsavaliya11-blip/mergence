# Mergence — M&A Screener & Deal Intelligence

A dark, Linear-styled web app for mergers & acquisitions:

1. **Screener** — enter your company (valuation, sector, region) and target criteria; get ranked acquisition candidates.
2. **Deal intelligence** in three sections — **Completed**, **Announced**, and **Rumored** deals — with a live accretion/dilution model (synergies, exchange ratio, expected post-deal price, bull/bear).

> All analytics are **model estimates** from public facts + adjustable assumptions. Not investment advice.

---

## 1. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app works immediately on **curated sample deals** — no API key required.

Other scripts:

```bash
npm run build   # production build
npm test        # run the model-engine unit tests
```

---

## 2. Turn on live data (API keys)

The app reads keys from a `.env` file in the project root. Copy the template and fill it in:

```bash
cp .env.example .env
```

### Key 1 — Financial Modeling Prep (PRIMARY, free) → `FMP_API_KEY`

Powers the screener, company financials, and the M&A deal feed.

1. Go to **https://site.financialmodelingprep.com** and create a free account.
2. Open your **Dashboard** — your **API key** is shown there.
3. Paste it into `.env`:
   ```
   FMP_API_KEY=your_key_here
   ```
4. Restart `npm run dev`.

Free tier ≈ **250 requests/day** (we cache aggressively to stay under it).

**What the FMP free tier actually unlocks** (verified) — and why you may want to upgrade:

| Capability | Free (Basic) | Notes |
|---|---|---|
| Company **profile** (price, market cap) | ✅ | Powers live prices on deal pages |
| **M&A deal feed** (`mergers-acquisitions-latest`) | ✅ | Live announced deals — but `limit` is capped at 5, so we omit it and slice client-side |
| Company **screener** | ❌ premium | Screener falls back to the curated universe on free |
| **income-statement** / **quote** (net income, EPS, shares) | ❌ premium | The accretion/dilution model needs earnings; on free it degrades gracefully (shows premium, offer value, exchange ratio with a lower data-completeness score) |

So on **free**, live deals show real names, prices, market caps, premiums and exchange ratios, while the full **EPS-based accretion model** and the **live screener** need the paid **Starter** plan (~$22–30/mo). The curated sample deals always demonstrate the complete model.

### Key 2 — Marketaux (rumored deals, free) → `MARKETAUX_API_KEY`

Surfaces M&A rumors from finance news.

1. Go to **https://www.marketaux.com** and sign up (free ≈ 100 requests/day).
2. Copy your **API token** from the dashboard.
3. Add to `.env`:
   ```
   MARKETAUX_API_KEY=your_token_here
   ```

### SEC EDGAR (US deep data, no key)

Free. Used to link primary-source filings (S-4 exchange ratios, merger proxies) for US deals.
Just set a descriptive User-Agent so the SEC can identify the caller:

```
SEC_USER_AGENT=Your Name your-email@example.com
```

You'll know live data is on when the **"Sample data"** banner switches to **"Live"**.

---

## 3. How the model works

For announced & rumored deals the app computes (it does **not** fetch predictions):

- Offer value & premium, exchange ratio
- New shares issued and pro-forma combined EPS
- **Accretion/dilution** to the acquirer's EPS
- Net & break-even synergies
- Expected post-deal share price (acquirer & target)
- A **bull / bear / neutral** verdict with the drivers behind it

Open any deal and use the **Assumptions** panel (synergy %, premium, financing mix, P/E, tax,
cost of debt, integration cost) — everything recomputes live. See `lib/mna-model.ts`.

### Data coverage (global)

Structured deal *terms* are richest for **US** deals (SEC filings). For non-US deals the model runs
on whatever financials FMP returns for the tickers; each deal shows a **data-completeness** meter so
gaps are visible.

---

## 4. Project layout

```
app/                 Next.js App Router pages + API routes
  page.tsx           Landing
  screener/          Screener page
  deals/[status]/    Completed / Announced / Rumored sections
  deal/[id]/         Deal detail + assumptions editor
  api/               screener, deals, deals/[id], model
components/           UI primitives + feature components
lib/
  mna-model.ts       The accretion/dilution model engine (pure, tested)
  fmp.ts             Financial Modeling Prep client
  sec.ts             SEC EDGAR enrichment
  news.ts            Marketaux rumors
  deals-service.ts   Orchestration (providers + sample fallback + model)
  screener-service.ts
  sample-data.ts     Curated fallback deals
tailwind.config.ts   Linear design tokens
```

## 5. Deploy (Vercel)

Push to GitHub, import into **Vercel**, and add `FMP_API_KEY` / `MARKETAUX_API_KEY` /
`SEC_USER_AGENT` as Environment Variables. The free tier is sufficient to start.
