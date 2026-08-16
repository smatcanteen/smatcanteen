import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { SectionTitle } from "@/components/ui-kit";
import { ugx, shortUgx, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartCanteen — Daily Cash Book for Canteen Operators" },
      {
        name: "description",
        content:
          "Track term capital, stock, sales and expenses in one place. SmartCanteen keeps your Cash at Hand always right.",
      },
      { property: "og:title", content: "SmartCanteen — Canteen Financial System" },
      {
        property: "og:description",
        content: "From opening capital to term-end profit: one connected cash book for canteen operators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const actions = [
  { to: "/stock-in", label: "Stock In", icon: "inventory_2", cls: "bg-primary text-on-primary hover:bg-primary-container" },
  { to: "/sale", label: "Cash Sale", icon: "point_of_sale", cls: "bg-secondary-container text-on-secondary-container hover:brightness-95" },
  { to: "/expense", label: "Expense", icon: "receipt_long", cls: "bg-tertiary text-on-tertiary hover:bg-tertiary-container" },
] as const;

function Home() {
  const { state, cashAtHand, today, totals } = useStore();
  const netProfit = totals.sales - totals.expenses;
  const goalPct = Math.max(0, Math.min(100, Math.round((netProfit / state.savingsGoal) * 100)));
  const recent = [...state.txs].sort((a, b) => b.ts - a.ts).slice(0, 6);

  return (
    <AppLayout title="SmartCanteen">
      <section>
        <div className="relative overflow-hidden rounded-xl bg-primary p-md shadow-raised">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at top right,#fff 0%,transparent 60%)" }}
          />
          <p className="text-center label-bold text-on-primary-container">Cash at Hand</p>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="font-bold text-primary-fixed">UGX</span>
            <span className="price-display text-on-primary">{ugx(cashAtHand)}</span>
          </div>
          <div className="mt-md border-t border-on-primary/20 pt-md">
            <div className="mb-1 flex items-end justify-between text-on-primary">
              <span className="label-bold opacity-70">Savings Goal</span>
              <span className="text-xs font-bold">{goalPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-on-primary/20">
              <div className="h-full rounded-full bg-secondary-container" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-1 text-center text-[11px] text-on-primary/70">
              Target: UGX {ugx(state.savingsGoal)} · {state.termName}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-sm">
        <div className="flex items-start gap-sm rounded-lg border border-tertiary/20 bg-tertiary/10 p-sm">
          <Icon name="lightbulb" className="text-tertiary" />
          <div>
            <p className="label-bold text-tertiary">Simple Insight</p>
            <p className="text-sm text-on-surface">
              Transport is your fastest-growing expense this term. Consider one bulk trip a week.
            </p>
          </div>
        </div>
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`flex h-16 w-full items-center rounded-lg px-md shadow-card transition-transform active:scale-[0.98] ${a.cls}`}
          >
            <span className="mr-sm rounded-full bg-white/20 p-2">
              <Icon name={a.icon} />
            </span>
            <span className="flex-grow text-left text-lg font-semibold">{a.label}</span>
            <Icon name="chevron_right" className="opacity-60" />
          </Link>
        ))}
      </section>

      <section>
        <SectionTitle>Today at a glance</SectionTitle>
        <div className="card flex items-center justify-between p-md">
          {[
            { l: "Sales", v: today.sales, i: "trending_up", c: "text-primary" },
            { l: "Out", v: today.expenses, i: "trending_down", c: "text-tertiary" },
            { l: "Net", v: today.net, i: "account_balance_wallet", c: "text-primary" },
          ].map((s, idx) => (
            <div key={s.l} className="flex flex-1 flex-col items-center gap-1">
              <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-outline">
                <Icon name={s.i} className="text-[14px]" /> {s.l}
              </span>
              <span className={`font-bold ${s.c}`}>{shortUgx(s.v)}</span>
              {idx < 2 ? null : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-sm flex items-end justify-between px-1">
          <h2 className="label-bold text-on-surface-variant">Recent transactions</h2>
          <Link to="/report" className="text-sm font-bold text-primary hover:underline">
            See all
          </Link>
        </div>
        <div className="card overflow-hidden p-0">
          {recent.map((t) => {
            const income = t.type === "sale" || t.type === "capital";
            return (
              <div
                key={t.id}
                className="flex items-center justify-between border-b border-surface-variant p-sm last:border-0"
              >
                <div className="flex items-center gap-sm">
                  <span
                    className={`rounded-full p-2 ${income ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"}`}
                  >
                    <Icon
                      name={
                        t.type === "sale"
                          ? "payments"
                          : t.type === "stock"
                            ? "shopping_cart"
                            : t.type === "capital"
                              ? "savings"
                              : "receipt_long"
                      }
                    />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface">{t.label}</span>
                    <span className="text-xs text-outline">
                      {new Date(t.ts).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <span className={`font-bold ${income ? "text-primary" : "text-tertiary"}`}>
                  {income ? "+" : "-"}
                  {ugx(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-sm sm:grid-cols-3">
        {[
          { to: "/term-capital", icon: "savings", label: "Term capital & goal" },
          { to: "/stock", icon: "inventory", label: "Stock & low-stock alerts" },
          { to: "/report", icon: "description", label: "Term report card" },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="card flex items-center gap-sm p-md transition-colors hover:bg-surface-low"
          >
            <Icon name={c.icon} className="text-primary" />
            <span className="text-sm font-semibold text-on-surface">{c.label}</span>
          </Link>
        ))}
      </section>
    </AppLayout>
  );
}
