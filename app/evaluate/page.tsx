import { DealEvaluator } from "@/components/deal-evaluator";
import { Eyebrow, Section } from "@/components/ui";

export const metadata = {
  title: "Evaluate a deal — Mergence",
  description:
    "Value a hypothetical acquisition between any two companies and get a clear go / no-go recommendation.",
};

export default function EvaluatePage() {
  return (
    <Section className="page-enter py-xxl">
      <Eyebrow>Deal evaluator</Eyebrow>
      <h1 className="mt-sm text-display-md text-ink">Should you do this deal?</h1>
      <p className="mt-md max-w-[680px] text-body-lg text-ink-muted">
        Enter an acquirer and a target, set your terms, and get a valuation plus a clear
        go / no-go read — the same accretion/dilution model used across Mergence, run on any
        two companies you choose.
      </p>

      <div className="mt-xl">
        <DealEvaluator />
      </div>
    </Section>
  );
}
