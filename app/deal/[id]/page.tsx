import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeal, modelDeal } from "@/lib/deals-service";
import { DealDetail } from "@/components/deal-detail";
import { Section } from "@/components/ui";
import { fmtPctRaw } from "@/lib/format";

export const dynamic = "force-dynamic";

/** A one-line "what-if" sensitivity note: does a ±10pp premium flip the verdict? */
async function premiumSensitivity(
  facts: Awaited<ReturnType<typeof findDeal>>,
  basePremium: number,
  baseAccretive: boolean,
): Promise<string | null> {
  if (!facts) return null;
  const hi = await modelDeal(facts, { premiumPct: Math.min(basePremium + 0.1, 5) });
  const lo = await modelDeal(facts, { premiumPct: Math.max(basePremium - 0.1, -0.5) });
  if (baseAccretive && hi.model && !hi.model.isAccretive) {
    return `Price-sensitive: paying ~10 points more (a ${fmtPctRaw(basePremium + 0.1, 0)} premium) would flip this deal to dilutive.`;
  }
  if (!baseAccretive && lo.model && lo.model.isAccretive) {
    return `Paying ~10 points less (a ${fmtPctRaw(Math.max(basePremium - 0.1, 0), 0)} premium) would make this deal accretive.`;
  }
  if (baseAccretive) {
    return `Robust: even a 10-point higher premium keeps the deal accretive to EPS.`;
  }
  return null;
}

export default async function DealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const facts = await findDeal(params.id);
  if (!facts) notFound();
  const initial = await modelDeal(facts);

  let sensitivity: string | null = null;
  if (initial.model && (facts.status === "announced" || facts.status === "rumored")) {
    sensitivity = await premiumSensitivity(
      facts,
      initial.assumptions.premiumPct,
      initial.model.isAccretive,
    );
  }

  return (
    <Section className="py-xl">
      <Link
        href={`/deals/${facts.status}`}
        className="text-body-sm text-ink-subtle transition-colors hover:text-ink"
      >
        ← Back to {facts.status} deals
      </Link>
      <DealDetail initial={initial} sensitivity={sensitivity} />
    </Section>
  );
}
