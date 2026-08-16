import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Operator Overview — SmartCanteen Admin" },
      {
        name: "description",
        content:
          "Portfolio view for school administrators: cash at hand, term profit and close-out discipline across every canteen operator.",
      },
      { property: "og:title", content: "Operator Overview — SmartCanteen Admin" },
      {
        property: "og:description",
        content: "One screen to see which canteens are healthy and which need attention.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

type Operator = {
  name: string;
  school: string;
  cash: number;
  profit: number;
  closedYesterday: boolean;
};

const others: Operator[] = [
  { name: "Grace Nabirye", school: "St. Mary's SS", cash: 612000, profit: 184000, closedYesterday: true },
  { name: "Peter Wanyama", school: "Kololo High", cash: 288000, profit: -22000, closedYesterday: false },
  { name: "Joan Akello", school: "Gayaza Junior", cash: 455000, profit: 96000, closedYesterday: true },
];

function Admin() {
  const { state, cashAtHand, totals } = useStore();

  const me: Operator = {
    name: "You",
    school: state.termName,
    cash: cashAtHand,
    profit: totals.sales - totals.expenses - totals.stock,
    closedYesterday: true,
  };
  const operators = [me, ...others];

  const totalCash = operators.reduce((s, o) => s + o.cash, 0);
  const totalProfit = operators.reduce((s, o) => s + o.profit, 0);
  const notClosed = operators.filter((o) => !o.closedYesterday).length;

  return (
    <AppLayout title="Admin Overview" back>
      <div className="grid grid-cols-2 gap-sm">
        <Card className="space-y-1">
          <p className="label-bold text-on-surface-variant">Cash across shops</p>
          <p className="text-xl font-bold text-primary">UGX {ugx(totalCash)}</p>
        </Card>
        <Card className="space-y-1">
          <p className="label-bold text-on-surface-variant">Term profit</p>
          <p className={`text-xl font-bold ${totalProfit < 0 ? "text-tertiary" : "text-primary"}`}>
            UGX {ugx(totalProfit)}
          </p>
        </Card>
      </div>

      {notClosed > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-tertiary bg-tertiary-container/40 p-sm text-sm text-on-tertiary-container">
          <Icon name="warning" />
          {notClosed} operator{notClosed > 1 ? "s" : ""} did not close out yesterday.
        </div>
      )}

      <SectionTitle>Operators</SectionTitle>
      <div className="space-y-sm">
        {operators.map((o) => (
          <Card key={o.name} className="flex items-center justify-between">
            <div>
              <p className="font-bold text-on-surface">{o.name}</p>
              <p className="text-xs text-on-surface-variant">{o.school}</p>
              <p
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  o.closedYesterday
                    ? "bg-secondary-fixed text-on-secondary-container"
                    : "bg-tertiary-container text-on-tertiary-container"
                }`}
              >
                <Icon name={o.closedYesterday ? "task_alt" : "pending"} className="text-sm" />
                {o.closedYesterday ? "Closed out" : "Not closed"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-on-surface">UGX {ugx(o.cash)}</p>
              <p className={`text-xs font-semibold ${o.profit < 0 ? "text-tertiary" : "text-on-surface-variant"}`}>
                {o.profit < 0 ? "-" : "+"}UGX {ugx(Math.abs(o.profit))} profit
              </p>
            </div>
          </Card>
        ))}
      </div>

      <p className="pb-4 text-xs text-outline">
        Administrators see totals and close-out discipline only — never a student's individual credit record.
      </p>
    </AppLayout>
  );
}
