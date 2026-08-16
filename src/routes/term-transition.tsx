import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/term-transition")({
  head: () => ({
    meta: [
      { title: "Close the Term — SmartCanteen" },
      {
        name: "description",
        content:
          "Close out the term, see real profit, and carry your cash and shelf stock into the new term as opening capital.",
      },
      { property: "og:title", content: "Close the Term — SmartCanteen" },
      {
        property: "og:description",
        content: "Nothing is lost between terms: cash at hand and shelf value roll forward automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermTransition;
});

function TermTransition() {
  const { state, cashAtHand, totals, setCapital } = useStore();
  const navigate = useNavigate();

  const shelfValue = state.items.reduce((sum, i) => sum + (i.qty ? (i.buy / i.qty) * i.stock : 0), 0);
  const outstanding = state.debtors.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);
  const profit = totals.sales - totals.expenses - totals.stock;

  const [newTerm, setNewTerm] = useState("Next term");
  const [carryStock, setCarryStock] = useState(true);
  const [goal, setGoal] = useState(String(state.savingsGoal));

  const opening = Math.round(cashAtHand + (carryStock ? shelfValue : 0));

  return (
    <AppLayout title="Term Transition" back>
      <Card className="space-y-sm">
        <p className="label-bold text-on-surface-variant">{state.termName} — closing position</p>
        <p className="price-display text-primary">UGX {ugx(cashAtHand)}</p>
        <p className="text-sm text-on-surface-variant">Cash at hand right now</p>
      </Card>

      <SectionTitle>What the term produced</SectionTitle>
      <Card className="space-y-2 text-sm">
        <Row label="Total sales" value={totals.sales} />
        <Row label="Stock bought" value={-totals.stock} />
        <Row label="Expenses" value={-totals.expenses} />
        <div className="border-t border-outline-variant pt-2">
          <Row label="Real profit" value={profit} bold />
        </div>
        <Row label="Stock still on the shelf (at cost)" value={shelfValue} />
        <Row label="Money still owed by students" value={outstanding} />
      </Card>

      <SectionTitle>Open the new term</SectionTitle>
      <Card className="space-y-sm">
        <Field label="New term name" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} />
        <Field
          label="Savings goal for the new term (UGX)"
          inputMode="numeric"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setCarryStock((c) => !c)}
          className="flex w-full items-center justify-between rounded-md border-2 border-outline-variant p-3 text-left"
        >
          <span className="text-sm font-semibold text-on-surface">
            Carry shelf stock forward as capital
            <span className="block text-xs font-normal text-on-surface-variant">
              Adds UGX {ugx(shelfValue)} of unsold stock to the opening balance
            </span>
          </span>
          <Icon name={carryStock ? "toggle_on" : "toggle_off"} className={carryStock ? "text-primary" : "text-outline"} />
        </button>
      </Card>

      <Card className="space-y-1">
        <p className="label-bold text-on-surface-variant">New opening capital</p>
        <p className="price-display text-primary">UGX {ugx(opening)}</p>
      </Card>

      <div className="rounded-lg border border-secondary-container bg-secondary-fixed/50 p-sm text-sm text-on-secondary-container">
        Unpaid student credit stays on the debtors list and follows the student into the new term.
      </div>

      <PrimaryButton
        tone="cta"
        onClick={() => {
          setCapital(opening, newTerm, Number(goal) || 0);
          navigate({ to: "/" });
        }}
      >
        Close term & open {newTerm} <Icon name="event_repeat" />
      </PrimaryButton>
    </AppLayout>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-bold text-on-surface" : "text-on-surface-variant"}>{label}</span>
      <span className={`${bold ? "font-bold" : "font-semibold"} ${value < 0 ? "text-tertiary" : "text-on-surface"}`}>
        UGX {ugx(Math.abs(value))}
      </span>
    </div>
  );
}
