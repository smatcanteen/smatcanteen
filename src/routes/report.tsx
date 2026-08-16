import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Balance Sheet & Term Report Card — SmartCanteen" },
      { name: "description", content: "Opening balance, sales, stock, expenses and closing balance — plus a shareable term report card." },
      { property: "og:title", content: "Balance Sheet & Term Report — SmartCanteen" },
      { property: "og:description", content: "Expected profit next to actual net change, for any day, week or term." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Report,
});

const ranges = { Today: 1, Week: 7, Term: 3650 } as const;

function Report() {
  const { state, cashAtHand, totals } = useStore();
  const [range, setRange] = useState<keyof typeof ranges>("Term");
  const since = Date.now() - ranges[range] * 86400000;
  const inRange = state.txs.filter((t) => t.ts >= since && t.type !== "capital");

  const sum = (type: string) =>
    inRange.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);
  const sales = sum("sale");
  const stock = sum("stock");
  const expenses = sum("expense");
  const closing = cashAtHand;
  const opening = closing - sales + stock + expenses;
  const expectedProfit = state.items.reduce((a, i) => a + (i.sell * i.qty - i.buy), 0);
  const outstanding = state.debtors.filter((d) => !d.paid).reduce((a, d) => a + d.amount, 0);

  const byCategory = Object.entries(
    inRange
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        const k = t.category ?? "Other";
        acc[k] = (acc[k] ?? 0) + t.amount;
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <AppLayout title="Reports">
      <div className="flex gap-2">
        {(Object.keys(ranges) as (keyof typeof ranges)[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`h-10 flex-1 rounded-full text-sm font-bold ${
              range === r ? "bg-primary text-on-primary" : "bg-surface-high text-on-surface-variant"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Card className="space-y-2">
        <SectionTitle>Balance sheet · {range}</SectionTitle>
        <Line label="Opening balance" value={opening} />
        <Line label="Plus sales" value={sales} sign="+" tone="primary" />
        <Line label="Less stock purchases" value={stock} sign="-" tone="tertiary" />
        <Line label="Less other expenses" value={expenses} sign="-" tone="tertiary" />
        <div className="mt-2 flex justify-between border-t border-outline-variant pt-2">
          <span className="font-bold text-on-surface">Closing balance</span>
          <span className="font-bold text-primary">UGX {ugx(closing)}</span>
        </div>
        <p className="text-xs text-outline">Matches Cash at Hand exactly.</p>
      </Card>

      <div className="grid gap-sm sm:grid-cols-2">
        <Card>
          <p className="label-bold text-on-surface-variant">Expected profit (from stockings)</p>
          <p className="price-display text-secondary">UGX {ugx(expectedProfit)}</p>
        </Card>
        <Card>
          <p className="label-bold text-on-surface-variant">Actual net change</p>
          <p className="price-display text-primary">UGX {ugx(totals.sales - totals.expenses - totals.stock)}</p>
        </Card>
      </div>

      <Card className="space-y-2">
        <SectionTitle>Where the money went</SectionTitle>
        {byCategory.length === 0 && <p className="text-sm text-outline">No expenses in this range.</p>}
        {byCategory.map(([cat, amt]) => (
          <div key={cat}>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface">{cat}</span>
              <span className="font-bold text-tertiary">UGX {ugx(amt)}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-highest">
              <div
                className="h-full rounded-full bg-tertiary"
                style={{ width: `${expenses ? (amt / expenses) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-sm bg-surface-low">
        <SectionTitle>Term report card · {state.termName}</SectionTitle>
        <div className="grid grid-cols-2 gap-sm">
          <Mini label="Total sales" value={totals.sales} />
          <Mini label="Total expenses" value={totals.expenses + totals.stock} />
          <Mini label="Net profit" value={totals.sales - totals.expenses - totals.stock} />
          <Mini label="Outstanding credit" value={outstanding} />
        </div>
        <div className="flex flex-wrap gap-sm">
          <button
            onClick={() => window.print()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-primary font-bold text-on-primary"
          >
            <Icon name="picture_as_pdf" /> Export PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-secondary-container font-bold text-on-secondary-container"
          >
            <Icon name="table_view" /> Export Excel
          </button>
        </div>
      </Card>
    </AppLayout>
  );
}

function Line({
  label,
  value,
  sign = "",
  tone,
}: {
  label: string;
  value: number;
  sign?: string;
  tone?: "primary" | "tertiary";
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span
        className={`font-semibold ${tone === "primary" ? "text-primary" : tone === "tertiary" ? "text-tertiary" : "text-on-surface"}`}
      >
        {sign}UGX {ugx(value)}
      </span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-surface-lowest p-sm">
      <p className="text-xs uppercase tracking-wide text-outline">{label}</p>
      <p className="font-bold text-on-surface">UGX {ugx(value)}</p>
    </div>
  );
}
