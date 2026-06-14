import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeal, modelDeal } from "@/lib/deals-service";
import { DealDetail } from "@/components/deal-detail";
import { Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const facts = await findDeal(params.id);
  if (!facts) notFound();
  const initial = await modelDeal(facts);

  return (
    <Section className="py-xl">
      <Link
        href={`/deals/${facts.status}`}
        className="text-body-sm text-ink-subtle transition-colors hover:text-ink"
      >
        ← Back to {facts.status} deals
      </Link>
      <DealDetail initial={initial} />
    </Section>
  );
}
