# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Mergence** — a Next.js 14 (App Router) M&A platform with two pillars: an acquisition **screener** and **deal intelligence** across completed / announced / rumored deals, including a computed accretion/dilution model. Dark, Linear-styled marketing-grade UI.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm test         # run model-engine unit tests (vitest)
npm run lint     # next lint
```

Run a single test file / test:
```bash
npx vitest run lib/mna-model.test.ts
npx vitest run -t "is accretive"        # by test name
npx vitest                              # watch mode
```

### Keep CLAUDE.md current (automated)

A `PostToolUse:Bash` hook in `.claude/settings.json` fires whenever a test command runs and reminds you to update this file **if a new feature was implemented and its tests passed** (skip for bugfixes/refactors). When you add a feature and tests go green, update the relevant section below (commands, routes, architecture).

### Review subagents

Two project subagents live in `.claude/agents/` (read-only — they report, they don't edit):

- **`code-reviewer`** — reviews changes/working tree for correctness bugs and quality issues (logic, edge cases, error handling, dead code, duplication, project conventions). Invoke after a feature or before committing.
- **`security-reviewer`** — audits for security problems tuned to this stack: API-key leakage (FMP/Finnhub/Marketaux must stay server-side, never `NEXT_PUBLIC_`), injection, SSRF on outbound `fetch` URLs, API-route input validation, XSS, and server/client boundary mistakes. Invoke before deploying/pushing.

Trigger by asking, e.g. "use the code-reviewer agent on my changes" or "run the security-reviewer".

### Environment / network note

`npm install` on this machine times out on IPv6. If installs hang with repeated `ETIMEDOUT`, force IPv4:
```bash
NODE_OPTIONS=--dns-result-order=ipv4first npm install
```
(On Windows PowerShell: `$env:NODE_OPTIONS="--dns-result-order=ipv4first"; npm install`.) If npmjs.org keeps timing out, a registry mirror is far faster here: `npm install --registry=https://registry.npmmirror.com`.

The project lives on a OneDrive path with a space and `&` in it. cmd.exe treats `&` as a command separator, which breaks `npm test` / `npm run dev` / `npm run build`. A project `.npmrc` sets `script-shell` to Git Bash so npm scripts run correctly — keep that file. Always quote paths in shell commands.

**`.next` corruption gotcha:** don't run `npm run build` while `npm run dev` is live — the dev server overwrites `.next` with dev artifacts and `npm run start` then fails with `Cannot find module './<chunk>.js'`. Stop the dev server first (`Get-NetTCPConnection -LocalPort 3000` → `Stop-Process`), `rm -rf .next`, then build. Also watch for a zombie `npm start` holding port 3000 (`EADDRINUSE`).

API keys are optional — see README. With no `.env`, the app serves curated **sample data** and is fully functional.

**Secrets / config hygiene:** `.env` and `.claude/settings.local.json` are git-ignored (the latter can hold machine-specific allow-rules). Never hardcode a real key in source or a settings allow-rule, and never `NEXT_PUBLIC_` a provider key. `next.config.mjs` ships baseline security headers (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).

## Architecture

### Data flow (the key thing to understand)

The app **fetches facts, then computes analytics** — no external API predicts deal outcomes. The pipeline:

```
provider clients (lib/fmp.ts, finnhub.ts, news.ts, sec.ts)
        ↓  (all cached + fail-soft to sample-data.ts)
orchestration (lib/deals-service.ts, screener-service.ts)
        ↓
model engine (lib/mna-model.ts)  ← pure, deterministic, the core value
        ↓
API routes (app/api/*) ←→ pages / client components
```

**Free-tier data strategy (important):** FMP's free tier gives the M&A deal feed +
company profile (price, market cap) but gates `income-statement`/`quote`/`company-screener`
behind paid plans. So earnings come from **`lib/finnhub.ts`** (free Basic Financials:
EPS × shares → net income), merged in `resolveFinancials()` only when FMP's net income is
0. The M&A feed lists filing-specific tickers (warrants `SOUNW`, preferred `GNL-PA`);
`getCompanyFinancials` resolves these to common stock via `commonStockCandidates()`.
The live screener is paid-only, so `runScreener` falls back to the curated universe.

- **`lib/mna-model.ts`** is the heart: `runModel(input)` computes offer value, premium, exchange ratio, pro-forma EPS, **accretion/dilution**, break-even synergies, expected post-deal prices, and a bull/bear `verdict`. It is pure (no I/O), robust to missing data (tracks `dataCompleteness` + `warnings`), and is the only file with unit tests. `assumptionsFromFacts()` seeds defaults from a deal's disclosed structure (including `premiumPct` from the disclosed premium). **Premium is assumption-driven:** the offer is repriced from `a.premiumPct`, not pinned to the disclosed deal value — when a deal discloses both an offer price and a premium, the model backs out the undisturbed (pre-announcement) reference price (`disclosedOffer / (1 + disclosedPremium)`) and re-applies the *assumed* premium, so the premium slider moves offer value / shares / accretion while the base case (seeded to the disclosed premium) still reproduces the real deal exactly. Don't revert this to reading `facts.dealValue`/`facts.premiumPct` directly — that silently freezes the premium control.

- **`lib/deals-service.ts`** orchestrates everything deal-related: `listDeals(status)`, `findDeal(id)`, and `modelDeal(facts, overrides?)` (resolves both companies' financials, then runs the model). It exports the `DealWithModel` type that client components import via `import type`. The live FMP/news feeds are **merged with** the curated `sample-data.ts` deals, not replaced.

- **Graceful degradation is structural, not incidental.** Every provider client checks `hasFmpKey()` / `hasNewsKey()` and falls back to `lib/sample-data.ts` (real, hand-curated deals + approximate financials). The UI shows a `DataBanner` ("Live" vs "Sample data"). When adding a data source, follow this same fail-soft pattern.

- **Caching:** all provider calls go through `cached(key, ttl, loader)` in `lib/cache.ts` (in-memory TTL) to stay under FMP's ~250 req/day free tier. Don't call providers without it. `cached` also does **single-flight** — concurrent callers for the same key share one in-flight load — so resolving the same symbol for acquirer + target doesn't double-spend the quota.

- **Outbound-fetch convention (security + resilience):** every provider `fetch` must pass `signal: AbortSignal.timeout(8000)` (a stalled upstream can't hang a handler) **and** `cache: "no-store"`. The `no-store` is non-negotiable: API keys ride in the query string (`?apikey=`/`?token=`), and without it Next persists the full key-bearing URL to `.next/cache/fetch-cache` in plaintext. Our own `lib/cache.ts` does the rate-limit caching instead.

- **Input validation:** API routes accept untrusted JSON. Model assumptions are clamped by `clampAssumptions()` (`lib/mna-model.ts`) before `runModel`; screener queries are coerced/bounded by `sanitizeQuery()` (`lib/screener-service.ts`, `limit` capped at 100). API routes return **generic** error messages and `console.error` server-side — never echo `String(err)` (it can leak internals). Keep both patterns when adding inputs.

- **Stable deal IDs:** `normalizeMA` (`lib/fmp.ts`) derives live-feed deal ids from symbols/names + filing date (`ma-…`), never the feed array index — index-based ids break `/api/model` lookups when feed order shifts. `findDeal` narrows by id prefix (`ma-`/`rumor-`) and resolves curated ids first. Ticker resolution tries the **literal symbol before** warrant/preferred candidates (`commonStockCandidates`) so a real ticker isn't shadowed by a stripped one.

### Routing

- `app/deals/[status]/` — sections; `[status]` ∈ `completed|announced|rumored` (validated, else `notFound()`). Server component calls `listDeals` directly (no fetch to own API).
- `app/deal/[id]/` — detail page (note: **singular** `deal`, separate route from `deals/[status]` to avoid collision). Server-renders the **base case** model, then hands off to the `DealDetail` **client** component. The base case never changes. For **announced/rumored only** (`allowScenario`), an assumptions panel offers a **"Create scenario"** button: nothing recomputes until clicked, then it POSTs to `/api/model` and renders a **second "Your scenario" model** beside the base case, each stat hinting `base …` for comparison (two models, shown only after the user creates one; "Reset" clears it). Completed deals show the base case only (no panel). `MetricsGrid` (with optional `base` prop) renders both grids. **Gotcha:** the page is wrapped in `<Section>` which is itself a `<section>` — when querying for the inner "Base case"/"Your scenario" sections, exclude the wrapper (it contains both).
- `app/company/[symbol]/` — company overview page (what the company does + financial data: price, market cap, net income, EPS, P/E, beta, employees, CEO). Server component calls `getCompany()` from **`lib/company-service.ts`** (FMP profile + Finnhub earnings backfill + curated `sample-data` overview fallback). Screener result cards link here, and the acquirer/target snapshots on the deal detail link here too.
- `app/learn/` — guided **"M&A basics"** primer for newcomers (no data, pure teaching). Thin server page renders the `LearnGuide` **client** component (`components/learn-guide.tsx`): a 9-topic paginated walkthrough (What is M&A → rationale → financing → premium → exchange ratio → synergies → accretion/dilution → post-deal price → bull/bear verdict) with Skip (→ home), Previous/Next, clickable step dots, ←/→/Esc keyboard nav, and a "Finish" + product CTAs on the last slide. The slide card has a fixed `min-h` and the nav buttons a fixed `min-w` so **Previous (far-left) and Next (far-right) stay pixel-stable across slides** — don't revert to content-driven sizing. Entered from the intro splash's "Are you new to M&A?" question (see Design system).
- `app/api/{screener,deals,deals/[id],model}/route.ts` — all `force-dynamic`.

### Design system

All Linear design tokens live in **`tailwind.config.ts`** (colors, the four-step `surface-1..4` ladder, `hairline*` borders, radius `xs..xxl`, spacing, and the `display-xl`/`card-title`/`eyebrow` etc. font-size tokens with baked-in letter-spacing). Use these tokens — don't hardcode hex/px.

Rules that aren't obvious from the tokens:
- Canvas is `#010102` (never `#000`). Lavender `primary` (#5e6ad2) is **scarce** — brand mark, primary CTA, focus ring, link emphasis only. No second chromatic accent in marketing chrome.
- **bull/bear red-green is a deliberate exception** confined to *data surfaces* (deal cards, model stats, verdict pills) — marketing chrome stays single-accent. See `components/verdict-pill.tsx` and the `Stat` `tone` prop.
- Fonts load via a non-blocking `@import` in `app/globals.css` (NOT `next/font/google`, which fetches at build time and hangs on this network). `--font-inter` / `--font-mono` CSS vars feed the Tailwind stack, falling back to system fonts offline.
- UI primitives are in `components/ui.tsx` (`Button`, `Card`, `Badge`, `TextInput`, `Stat`, `Section`, etc.). Reuse these rather than restyling.
- **Motion** lives as CSS keyframes/utility classes in `app/globals.css` (not a JS animation lib): `.page-enter` (content fade-up settle), `.lift` (card hover lift), and the `.splash-*` intro classes. `components/intro-splash.tsx` is an Apple-boot-style splash (logo + wordmark) mounted once in the root layout; it shows **once per session** via `sessionStorage`. Under `prefers-reduced-motion` the boot choreography is skipped but the question is still offered (no animation) — every animation has a reduced-motion off switch; preserve that when adding more.
- **Intro splash is two-phase:** after the boot animation (~1.9s) it transitions to an `"ask"` phase — a *"Are you new to M&A?"* dialog. **Yes** → `router.push("/learn")`; **No** → `dismiss("/")` (home). **StrictMode gotcha (important):** the splash writes its `sessionStorage` "seen" flag on first mount, so React's dev double-mount would read it back and bail (and the cleanup would cancel the boot→ask timer). A **module-level `initializedThisLoad` guard** distinguishes StrictMode's remount (re-schedule the timer, don't bail) from a genuine prior page load (skip the splash). The guard resets on real page loads because the module re-evaluates. Don't "simplify" this away — it's why the splash works in dev.

### Types

`lib/types.ts` is the single source of domain types — `DealFacts` (raw facts), `ModelAssumptions` (user-tunable), `ModelResult` (computed), `ScreenerQuery`/`ScreenerMatch`. `CompanyFinancials` also carries optional **profile** fields (`description`, `website`, `industry`, `ceo`, `employees`, `exchange`, `beta`) populated from FMP's profile (with Finnhub/`sample-data` fallback) — these feed the company overview page and deal company snapshots. Client components import server-module types with `import type` to avoid bundling server code.
