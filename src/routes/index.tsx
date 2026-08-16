import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
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


type Tile = { to: string; icon: string; label: string };

const tabs: { id: string; label: string; tiles: Tile[] }[] = [
  {
    id: "for-you",
    label: "FOR YOU",
    tiles: [
      { to: "/sale", icon: "point_of_sale", label: "Cash Sale" },
      { to: "/stock-in", icon: "local_shipping", label: "Stock In" },
      { to: "/expense", icon: "receipt_long", label: "Expense" },
      { to: "/debtors", icon: "group", label: "Credit Book" },
      { to: "/close-out", icon: "task_alt", label: "Close Day" },
      { to: "/report", icon: "bar_chart", label: "Reports" },
    ],
  },
  {
    id: "money-in",
    label: "MONEY IN",
    tiles: [
      { to: "/sale", icon: "payments", label: "Cash Sale" },
      { to: "/sale", icon: "sell", label: "Sell Item" },
      { to: "/debtors", icon: "handshake", label: "Collect Debt" },
      { to: "/term-capital", icon: "savings", label: "Add Capital" },
    ],
  },
  {
    id: "money-out",
    label: "MONEY OUT",
    tiles: [
      { to: "/stock-in", icon: "shopping_cart", label: "Buy Stock" },
      { to: "/expense", icon: "local_taxi", label: "Transport" },
      { to: "/expense", icon: "badge", label: "Salary" },
      { to: "/expense", icon: "home_work", label: "Rent" },
      { to: "/expense", icon: "bolt", label: "Utilities" },
      { to: "/subscription", icon: "card_membership", label: "Subscription" },
    ],
  },
  {
    id: "manage",
    label: "MANAGE",
    tiles: [
      { to: "/stock", icon: "inventory", label: "Stock List" },
      { to: "/term-capital", icon: "account_balance", label: "Term Capital" },
      { to: "/term-transition", icon: "event_repeat", label: "Close Term" },
      { to: "/onboarding", icon: "rocket_launch", label: "New Canteen" },
      { to: "/admin", icon: "admin_panel_settings", label: "Admin" },
      { to: "/settings", icon: "settings", label: "Settings" },
    ],
  },
];

function Home() {
  const { state, cashAtHand, today, totals } = useStore();
  const [tab, setTab] = useState(tabs[0]!.id);
  const [hide, setHide] = useState(false);
  const netProfit = totals.sales - totals.expenses;
  const goalPct = Math.max(0, Math.min(100, Math.round((netProfit / state.savingsGoal) * 100)));
  const recent = [...state.txs].sort((a, b) => b.ts - a.ts).slice(0, 6);
  const active = tabs.find((t) => t.id === tab)!;

  const hero = (
    <div className="card p-0">
      <div className="relative px-md pb-md pt-5">
        <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-lg bg-secondary-container px-3 py-1 text-[11px] font-bold text-on-secondary-container">
          Cash at Hand
        </span>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-outline">{state.termName}</p>
            <p className="price-display truncate text-primary">
              {hide ? "UGX ••••••" : `UGX ${ugx(cashAtHand)}`}
            </p>
          </div>
          <button
            onClick={() => setHide((h) => !h)}
            aria-label={hide ? "Show balance" : "Hide balance"}
            className="shrink-0 rounded-full p-2 text-primary hover:bg-surface-high"
          >
            <Icon name={hide ? "visibility" : "visibility_off"} />
          </button>
        </div>
        <div className="mt-sm">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-high">
            <div className="h-full rounded-full bg-secondary-container" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-outline">
            Savings goal {goalPct}% · target UGX {ugx(state.savingsGoal)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-outline-variant/50">
        <Link to="/close-out" className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-primary hover:bg-surface-low">
          <Icon name="task_alt" className="text-[20px]" /> Close Day
        </Link>
        <Link
          to="/report"
          className="flex items-center justify-center gap-2 border-l border-outline-variant/50 py-3 text-sm font-bold text-primary hover:bg-surface-low"
        >
          <Icon name="swap_vert" className="text-[20px]" /> Statements
        </Link>
      </div>
    </div>
  );

  return (
    <AppLayout title="SmartCanteen" hero={hero}>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex min-w-max gap-1 border-b border-outline-variant/50">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-3 pb-2 pt-1 text-sm font-bold tracking-wide transition-colors ${
                t.id === tab ? "text-primary" : "text-outline"
              }`}
            >
              {t.label}
              {t.id === tab ? (
                <span className="absolute inset-x-2 -bottom-px h-1 rounded-full bg-secondary-container" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-3 gap-sm">
        {active.tiles.map((t, i) => (
          <Link
            key={`${t.to}-${i}`}
            to={t.to}
            className="card flex aspect-square flex-col items-center justify-center gap-2 p-2 text-center transition-transform active:scale-95 hover:bg-surface-low"
          >
            <Icon name={t.icon} className="text-[26px] text-primary" />
            <span className="text-xs font-semibold leading-tight text-on-surface">{t.label}</span>
          </Link>
        ))}
      </section>

      <section className="flex items-start gap-sm rounded-lg border border-secondary-container/40 bg-secondary-fixed/40 p-sm">
        <Icon name="lightbulb" className="text-secondary" />
        <div>
          <p className="label-bold text-on-secondary-container">Simple Insight</p>
          <p className="text-sm text-on-surface">
            Transport is your fastest-growing expense this term. Consider one bulk trip a week.
          </p>
        </div>
      </section>

      <section className="card grid grid-cols-3 p-md">
        {[
          { l: "Sales", v: today.sales, i: "trending_up", c: "text-primary" },
          { l: "Out", v: today.expenses, i: "trending_down", c: "text-tertiary" },
          { l: "Net", v: today.net, i: "account_balance_wallet", c: "text-primary" },
        ].map((s) => (
          <div key={s.l} className="flex flex-col items-center gap-1">
            <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-outline">
              <Icon name={s.i} className="text-[14px]" /> {s.l}
            </span>
            <span className={`font-bold ${s.c}`}>{shortUgx(s.v)}</span>
          </div>
        ))}
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
                className="flex items-center justify-between gap-2 border-b border-surface-variant p-sm last:border-0"
              >
                <div className="flex min-w-0 items-center gap-sm">
                  <span
                    className={`shrink-0 rounded-full p-2 ${income ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary"}`}
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
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-on-surface">{t.label}</span>
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
                <span className={`shrink-0 font-bold ${income ? "text-primary" : "text-tertiary"}`}>
                  {income ? "+" : "-"}
                  {ugx(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </AppLayout>
  );
}
