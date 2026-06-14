import { ScreenerForm } from "@/components/screener-form";
import { Eyebrow, Section } from "@/components/ui";

export const metadata = {
  title: "Screener — Mergence",
  description: "Screen acquisition and merger targets by sector, valuation, region and rationale.",
};

export default function ScreenerPage() {
  return (
    <Section className="page-enter py-xxl">
      <Eyebrow>Acquisition screener</Eyebrow>
      <h1 className="mt-sm text-display-md text-ink">Find your target</h1>
      <p className="mt-md max-w-[680px] text-body-lg text-ink-muted">
        Enter your company profile and the criteria of the business you want to acquire or merge
        with. We screen the company universe and rank candidates by strategic fit, relative size,
        and your stated rationale.
      </p>

      <div className="mt-xl">
        <ScreenerForm />
      </div>
    </Section>
  );
}
