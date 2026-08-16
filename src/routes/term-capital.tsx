import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/term-capital")({
  head: () => ({
    meta: [
      { title: "Set Term Capital — SmartCanteen" },
      { name: "description", content: "Declare the opening capital for the term and set a savings goal to track against net profit." },
      { property: "og:title", content: "Set Term Capital — SmartCanteen" },
      { property: "og:description", content: "One opening number that every sale, expense and stock purchase moves against." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermCapital,
});

function TermCapital() {
  const { state, setCapital, totals } = useStore();
  const navigate = useNavigate();
  const [term, setTerm] = useState(state.termName);
  const [amount, setAmount] = useState(String(state.capital));
  const [goal, setGoal] = useState(String(state.savingsGoal));

  return (
    <AppLayout title="Term Capital" back>
      <Card className="space-y-sm">
        <p className="label-bold text-on-surface-variant">Opening capital</p>
        <p className="price-display text-primary">UGX {ugx(Number(amount) || 0)}</p>
        <p className="text-sm text-on-surface-variant">
          This becomes the term's starting Cash at Hand. Every stock purchase, expense and sale
          moves against it.
        </p>
      </Card>

      <Card className="space-y-sm">
        <Field label="Term name" value={term} onChange={(e) => setTerm(e.target.value)} />
        <Field label="Opening capital (UGX)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Field
          label="Savings goal for the term (UGX)"
          inputMode="numeric"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          hint={`Progress is tracked from net profit — currently UGX ${ugx(totals.sales - totals.expenses)}`}
        />
      </Card>

      <div className="rounded-lg border border-secondary-container bg-secondary-fixed/50 p-sm text-sm text-on-secondary-container">
        Starting a new term resets the opening balance. Past entries stay in your reports.
      </div>

      <PrimaryButton
        onClick={() => {
          setCapital(Number(amount) || 0, term, Number(goal) || 0);
          navigate({ to: "/" });
        }}
      >
        <Icon name="check" /> Save term capital
      </PrimaryButton>
    </AppLayout>
  );
}
