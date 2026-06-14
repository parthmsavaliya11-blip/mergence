// Curated fallback dataset — real, well-known M&A deals used when no API key is
// configured (so the UI is never blank). Financials are approximate, rounded
// public figures for illustration; live mode replaces all of this with API data.

import type { CompanyFinancials, DealFacts } from "./types";

export const SAMPLE_FINANCIALS: Record<string, CompanyFinancials> = {
  MSFT: { symbol: "MSFT", name: "Microsoft", price: 420, sharesOutstanding: 7_430_000_000, netIncome: 88_000_000_000, marketCap: 3_120_000_000_000, sector: "Technology", country: "US", industry: "Software — Infrastructure", website: "https://microsoft.com", employees: 221_000, description: "Microsoft develops and licenses software, cloud services, and devices worldwide. Its segments span Productivity & Business Processes (Office, LinkedIn, Dynamics), Intelligent Cloud (Azure, server products), and More Personal Computing (Windows, Xbox gaming, Surface, search advertising)." },
  ATVI: { symbol: "ATVI", name: "Activision Blizzard", price: 94.4, sharesOutstanding: 786_000_000, netIncome: 1_500_000_000, marketCap: 74_000_000_000, sector: "Communication Services", country: "US", industry: "Electronic Gaming & Multimedia", website: "https://activisionblizzard.com", employees: 13_000, description: "Activision Blizzard is a leading developer and publisher of interactive entertainment, home to blockbuster franchises including Call of Duty, World of Warcraft, Overwatch, and the King mobile studio behind Candy Crush." },
  AVGO: { symbol: "AVGO", name: "Broadcom", price: 1300, sharesOutstanding: 4_600_000_000, netIncome: 14_000_000_000, marketCap: 600_000_000_000, sector: "Technology", country: "US", industry: "Semiconductors", website: "https://broadcom.com", employees: 20_000, description: "Broadcom designs and supplies a broad range of semiconductor and infrastructure software products, spanning data-center networking, broadband, wireless, storage, and — following VMware — enterprise virtualization and cloud software." },
  VMW: { symbol: "VMW", name: "VMware", price: 142, sharesOutstanding: 430_000_000, netIncome: 1_300_000_000, marketCap: 61_000_000_000, sector: "Technology", country: "US", industry: "Software — Infrastructure", website: "https://vmware.com", employees: 38_000, description: "VMware pioneered virtualization and provides multi-cloud and enterprise infrastructure software — compute, networking, storage, and management — that lets organizations run and modernize applications across private and public clouds." },
  SNPS: { symbol: "SNPS", name: "Synopsys", price: 540, sharesOutstanding: 153_000_000, netIncome: 1_230_000_000, marketCap: 82_000_000_000, sector: "Technology", country: "US", industry: "Software — Application", website: "https://synopsys.com", employees: 20_000, description: "Synopsys is a leader in electronic design automation (EDA) and semiconductor IP, providing the software and verified building blocks chip designers use to design and test advanced systems-on-chip." },
  ANSS: { symbol: "ANSS", name: "Ansys", price: 330, sharesOutstanding: 87_000_000, netIncome: 500_000_000, marketCap: 29_000_000_000, sector: "Technology", country: "US", industry: "Software — Application", website: "https://ansys.com", employees: 6_000, description: "Ansys develops engineering simulation software used to predict how product designs will behave in real-world environments — structural, fluids, electronics, optics, and multiphysics analysis across virtually every industry." },
  COF: { symbol: "COF", name: "Capital One", price: 138, sharesOutstanding: 381_000_000, netIncome: 4_900_000_000, marketCap: 52_600_000_000, sector: "Financial Services", country: "US", industry: "Credit Services", website: "https://capitalone.com", employees: 52_000, description: "Capital One is a diversified bank best known for credit cards, along with auto loans, consumer and commercial banking. It is one of the largest U.S. card issuers and a digital-first financial services company." },
  DFS: { symbol: "DFS", name: "Discover Financial", price: 130, sharesOutstanding: 250_000_000, netIncome: 2_900_000_000, marketCap: 32_500_000_000, sector: "Financial Services", country: "US", industry: "Credit Services", website: "https://discover.com", employees: 21_000, description: "Discover Financial Services is a direct bank and payments company. It issues the Discover card and — critically — operates the Discover Global Network, one of the few alternatives to the Visa and Mastercard payment rails." },
  HPE: { symbol: "HPE", name: "Hewlett Packard Enterprise", price: 18, sharesOutstanding: 1_300_000_000, netIncome: 2_000_000_000, marketCap: 23_400_000_000, sector: "Technology", country: "US", industry: "Communication Equipment", website: "https://hpe.com", employees: 62_000, description: "Hewlett Packard Enterprise provides edge-to-cloud technology — servers, storage, networking (Aruba), and the GreenLake as-a-service platform — that helps enterprises capture, analyze, and act on their data." },
  JNPR: { symbol: "JNPR", name: "Juniper Networks", price: 37, sharesOutstanding: 322_000_000, netIncome: 310_000_000, marketCap: 11_900_000_000, sector: "Technology", country: "US", industry: "Communication Equipment", website: "https://juniper.net", employees: 11_000, description: "Juniper Networks designs networking products — routers, switches, and security — and is a leader in AI-driven enterprise networking through its Mist platform, which uses cloud and machine learning to automate network operations." },
  CRM: { symbol: "CRM", name: "Salesforce", price: 270, sharesOutstanding: 970_000_000, netIncome: 4_100_000_000, marketCap: 262_000_000_000, sector: "Technology", country: "US", industry: "Software — Application", website: "https://salesforce.com", employees: 72_000, description: "Salesforce is the leading customer relationship management (CRM) platform, providing cloud software for sales, service, marketing, commerce, and analytics, plus the Data Cloud and Einstein AI layer." },
  ADBE: { symbol: "ADBE", name: "Adobe", price: 480, sharesOutstanding: 450_000_000, netIncome: 5_400_000_000, marketCap: 216_000_000_000, sector: "Technology", country: "US", industry: "Software — Application", website: "https://adobe.com", employees: 30_000, description: "Adobe is a global software company behind Creative Cloud (Photoshop, Illustrator), Document Cloud (Acrobat/PDF), and Experience Cloud for digital marketing and analytics." },
  FIGMA: { symbol: "FIGMA", name: "Figma (private)", price: 0, sharesOutstanding: 0, netIncome: 0, marketCap: 20_000_000_000, sector: "Technology", country: "US", industry: "Software — Application", website: "https://figma.com", description: "Figma is a browser-based collaborative interface design platform widely used by product teams for UI design, prototyping, and real-time collaboration." },
  PFE: { symbol: "PFE", name: "Pfizer", price: 28, sharesOutstanding: 5_660_000_000, netIncome: 2_100_000_000, marketCap: 158_000_000_000, sector: "Healthcare", country: "US", industry: "Drug Manufacturers — General", website: "https://pfizer.com", employees: 88_000, description: "Pfizer is one of the world's largest biopharmaceutical companies, discovering, developing, and manufacturing medicines and vaccines across oncology, immunology, vaccines, and rare disease." },
  SGEN: { symbol: "SGEN", name: "Seagen", price: 229, sharesOutstanding: 187_000_000, netIncome: -600_000_000, marketCap: 43_000_000_000, sector: "Healthcare", country: "US", industry: "Biotechnology", website: "https://seagen.com", employees: 3_500, description: "Seagen is a biotechnology company pioneering antibody-drug conjugate (ADC) therapies for cancer, with several approved medicines and a research engine targeting hard-to-treat tumors." },
  SHEL: { symbol: "SHEL", name: "Shell", price: 67, sharesOutstanding: 6_300_000_000, netIncome: 19_000_000_000, marketCap: 422_000_000_000, sector: "Energy", country: "UK", industry: "Oil & Gas Integrated", website: "https://shell.com", employees: 103_000, description: "Shell is a global integrated energy company engaged in the exploration, production, refining, and marketing of oil and gas, alongside a growing portfolio of LNG, chemicals, and lower-carbon energy." },
  BP: { symbol: "BP", name: "BP", price: 35, sharesOutstanding: 2_700_000_000, netIncome: 8_000_000_000, marketCap: 94_000_000_000, sector: "Energy", country: "UK", industry: "Oil & Gas Integrated", website: "https://bp.com", employees: 79_000, description: "BP is a UK-based integrated energy major spanning oil and gas production, refining and marketing, trading, and a transition strategy investing in renewables, EV charging, and low-carbon energy." },
};

export const SAMPLE_DEALS: DealFacts[] = [
  // ---------------------------------------------------------------- Completed
  {
    id: "msft-atvi",
    status: "completed",
    acquirer: "Microsoft",
    acquirerSymbol: "MSFT",
    target: "Activision Blizzard",
    targetSymbol: "ATVI",
    announcedDate: "2022-01-18",
    closedDate: "2023-10-13",
    dealValue: 68_700_000_000,
    structure: "cash",
    offerPricePerShare: 95,
    premiumPct: 0.45,
    sector: "Communication Services",
    region: "US",
    rationale:
      "Scale Microsoft's gaming business (Xbox, Game Pass, cloud gaming) with blockbuster franchises (Call of Duty, Candy Crush) and accelerate mobile reach.",
    disclosedSynergies: 0,
    postDealEffect:
      "Added ~$2B+ quarterly gaming revenue; King mobile portfolio expanded Microsoft's mobile footprint. Regulatory approval (UK CMA, FTC) gated close by ~21 months.",
    sourceName: "SEC / Company press release",
    currency: "USD",
  },
  {
    id: "avgo-vmw",
    status: "completed",
    acquirer: "Broadcom",
    acquirerSymbol: "AVGO",
    target: "VMware",
    targetSymbol: "VMW",
    announcedDate: "2022-05-26",
    closedDate: "2023-11-22",
    dealValue: 69_000_000_000,
    structure: "mixed",
    premiumPct: 0.49,
    sector: "Technology",
    region: "US",
    rationale:
      "Diversify Broadcom into enterprise infrastructure software; cross-sell VMware's virtualization/cloud stack to Broadcom's customer base.",
    disclosedSynergies: 8_500_000_000,
    postDealEffect:
      "Broadcom restructured VMware pricing to subscription; software segment became a major revenue pillar. Targeted ~$8.5B run-rate EBITDA within 3 years.",
    sourceName: "SEC S-4 / Company",
    currency: "USD",
  },
  {
    id: "pfe-sgen",
    status: "completed",
    acquirer: "Pfizer",
    acquirerSymbol: "PFE",
    target: "Seagen",
    targetSymbol: "SGEN",
    announcedDate: "2023-03-13",
    closedDate: "2023-12-14",
    dealValue: 43_000_000_000,
    structure: "cash",
    offerPricePerShare: 229,
    premiumPct: 0.33,
    sector: "Healthcare",
    region: "US",
    rationale:
      "Bolster Pfizer's oncology pipeline with Seagen's antibody-drug conjugate (ADC) platform ahead of looming patent cliffs.",
    disclosedSynergies: 1_000_000_000,
    postDealEffect:
      "Added four approved cancer medicines and an ADC R&D engine; Pfizer projected >$10B Seagen revenue by 2030.",
    sourceName: "Company press release",
    currency: "USD",
  },

  // ---------------------------------------------------------------- Announced
  {
    id: "cof-dfs",
    status: "announced",
    acquirer: "Capital One",
    acquirerSymbol: "COF",
    target: "Discover Financial",
    targetSymbol: "DFS",
    announcedDate: "2024-02-19",
    dealValue: 35_300_000_000,
    structure: "stock",
    statedExchangeRatio: 1.0192,
    premiumPct: 0.27,
    sector: "Financial Services",
    region: "US",
    rationale:
      "Acquire Discover's payments network to reduce reliance on Visa/Mastercard rails and build a vertically integrated card + network franchise.",
    disclosedSynergies: 2_700_000_000,
    sourceName: "SEC / Joint press release",
    currency: "USD",
  },
  {
    id: "snps-anss",
    status: "announced",
    acquirer: "Synopsys",
    acquirerSymbol: "SNPS",
    target: "Ansys",
    targetSymbol: "ANSS",
    announcedDate: "2024-01-16",
    dealValue: 35_000_000_000,
    structure: "mixed",
    cashPerShare: 197,
    statedExchangeRatio: 0.345,
    premiumPct: 0.29,
    sector: "Technology",
    region: "US",
    rationale:
      "Combine Synopsys chip design (EDA) with Ansys simulation/analysis to lead 'silicon-to-systems' engineering as designs grow more multiphysics.",
    disclosedSynergies: 400_000_000,
    sourceName: "SEC / Company",
    currency: "USD",
  },
  {
    id: "hpe-jnpr",
    status: "announced",
    acquirer: "Hewlett Packard Enterprise",
    acquirerSymbol: "HPE",
    target: "Juniper Networks",
    targetSymbol: "JNPR",
    announcedDate: "2024-01-09",
    dealValue: 14_000_000_000,
    structure: "cash",
    offerPricePerShare: 40,
    premiumPct: 0.32,
    sector: "Technology",
    region: "US",
    rationale:
      "Double HPE's networking business and add Juniper's AI-driven Mist networking to compete with Cisco/Arista in enterprise and AI data-center networking.",
    disclosedSynergies: 450_000_000,
    sourceName: "SEC / Company",
    currency: "USD",
  },

  // ------------------------------------------------------------------ Rumored
  {
    id: "rumor-crm-x",
    status: "rumored",
    acquirer: "Salesforce",
    acquirerSymbol: "CRM",
    target: "Informatica",
    structure: "cash",
    premiumPct: 0.3,
    confidence: "medium",
    sector: "Technology",
    region: "US",
    rationale:
      "Speculation that Salesforce could acquire a data-management vendor to strengthen its Data Cloud / AI data layer. Illustrative — not confirmed.",
    sourceName: "Press speculation (illustrative)",
    currency: "USD",
  },
  {
    id: "rumor-shel-bp",
    status: "rumored",
    acquirer: "Shell",
    acquirerSymbol: "SHEL",
    target: "BP",
    targetSymbol: "BP",
    structure: "stock",
    premiumPct: 0.25,
    confidence: "low",
    sector: "Energy",
    region: "UK",
    rationale:
      "Recurring market chatter about UK oil-major consolidation to build scale against US supermajors. Highly speculative — not announced.",
    sourceName: "Press speculation (illustrative)",
    currency: "GBP",
  },
];

export function sampleDealsByStatus(status: DealFacts["status"]): DealFacts[] {
  return SAMPLE_DEALS.filter((d) => d.status === status);
}

export function sampleDealById(id: string): DealFacts | undefined {
  return SAMPLE_DEALS.find((d) => d.id === id);
}

export function sampleFinancials(symbol?: string): CompanyFinancials | undefined {
  if (!symbol) return undefined;
  return SAMPLE_FINANCIALS[symbol.toUpperCase()];
}
