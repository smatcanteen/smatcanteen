import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { GroupedBars } from "@/components/Charts";
import { Card, Field, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { useAuth, type Account } from "@/lib/auth";
import { ugx, useStore } from "@/lib/store";
import logoReversed from "@/assets/logo-reversed.png.asset.json";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SmartCanteen Operators" },
      {
        name: "description",
        content:
          "Platform owner view: create operator accounts, watch cash at hand, term profit and close-out discipline across every canteen.",
      },
      { property: "og:title", content: "Admin Dashboard — SmartCanteen" },
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

/** Deterministic demo performance for operator accounts other than the signed-in device. */
function demoStats(acc: Account) {
  let h = 0;
  for (const ch of acc.id + acc.email) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  const cash = 180000 + (h % 550) * 1000;
  const sales = cash * 2 + (h % 313) * 1000;
  const expenses = Math.round(sales * 0.18);
  const stock = Math.round(sales * 0.52);
  return {
    cash,
    sales,
    expenses,
    stock,
    profit: sales - expenses - stock,
    closedYesterday: h % 4 !== 1,
  };
}

function Admin() {
  const { user, ready, accounts, logout, createOperator, toggleAccount } = useAuth();
  const { state, cashAtHand, totals } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", school: "", phone: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "admin") navigate({ to: "/" });
  }, [ready, user, navigate]);

  const operators = useMemo(() => accounts.filter((a) => a.role === "operator"), [accounts]);

  const rows = operators.map((a, i) => {
    // The first seeded operator is the account running on this device.
    const live = a.id === "acc-op-1";
    const s = live
      ? {
          cash: cashAtHand,
          sales: totals.sales,
          expenses: totals.expenses,
          stock: totals.stock,
          profit: totals.sales - totals.expenses - totals.stock,
          closedYesterday: true,
        }
      : demoStats(a);
    return { acc: a, ...s, live, index: i };
  });

  const totalCash = rows.reduce((s, r) => s + r.cash, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const notClosed = rows.filter((r) => !r.closedYesterday).length;

  const chartRows = rows.slice(0, 6).map((r) => ({
    label: r.acc.school || r.acc.name,
    values: { sales: r.sales, spend: r.stock + r.expenses, profit: r.profit },
  }));

  const submit = () => {
    const res = createOperator(form);
    if (!res.ok) {
      setError(res.error ?? "Could not create the account.");
      setMsg("");
      return;
    }
    setError("");
    setMsg(`${res.account!.name} can now log in with ${res.account!.email}.`);
    setForm({ name: "", email: "", password: "", school: "", phone: "" });
    setOpen(false);
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-surface-high pb-16">
      <div className="bg-primary pb-16">
        <header className="mx-auto flex h-16 w-full max-w-container-max items-center justify-between gap-2 px-4 md:px-gutter">
          <div className="flex min-w-0 items-center gap-2">
            <img src={logoReversed.url} alt="" aria-hidden className="h-9 w-9 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-on-primary">Admin Dashboard</p>
              <p className="truncate text-[11px] text-on-primary/70">{user.name} · platform owner</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-secondary-container hover:bg-on-primary/10"
          >
            <Icon name="logout" className="text-[20px]" /> Log out
          </button>
        </header>

        <div className="mx-auto grid w-full max-w-container-max grid-cols-2 gap-sm px-4 md:grid-cols-4 md:px-gutter">
          <Kpi label="Operators" value={String(operators.length)} icon="storefront" />
          <Kpi label="Cash across shops" value={`UGX ${ugx(totalCash)}`} icon="account_balance_wallet" />
          <Kpi label="Term profit" value={`UGX ${ugx(totalProfit)}`} icon="trending_up" />
          <Kpi label="Missed close-outs" value={String(notClosed)} icon="pending_actions" />
        </div>
      </div>

      <main className="mx-auto -mt-10 w-full max-w-container-max space-y-md px-4 pb-lg md:px-gutter">
        <Card className="space-y-sm">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>Performance by canteen</SectionTitle>
            <span className="text-xs text-on-surface-variant">{state.termName}</span>
          </div>
          <GroupedBars
            rows={chartRows}
            series={[
              { key: "sales", label: "Sales", color: "var(--color-primary)" },
              { key: "spend", label: "Stock + expenses", color: "var(--color-secondary)" },
              { key: "profit", label: "Profit", color: "var(--color-tertiary)" },
            ]}
          />
        </Card>

        <section className="space-y-sm">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>Operator accounts</SectionTitle>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex min-h-11 items-center gap-1 rounded-full bg-primary px-4 text-sm font-bold text-on-primary"
            >
              <Icon name={open ? "close" : "person_add"} className="text-[18px]" />
              {open ? "Cancel" : "New operator"}
            </button>
          </div>

          {msg ? (
            <p className="flex items-center gap-1 rounded-md bg-secondary-fixed/60 p-sm text-sm font-semibold text-on-secondary-container">
              <Icon name="check_circle" className="text-[18px]" /> {msg}
            </p>
          ) : null}

          {open ? (
            <Card className="space-y-sm">
              <div className="grid gap-sm sm:grid-cols-2">
                <Field label="Operator name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Field label="School / canteen" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
                <Field label="Login email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Field
                  label="Temporary password"
                  value={form.password}
                  hint="At least 6 characters. The operator can change it later."
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Field label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              {error ? <p className="text-sm font-semibold text-tertiary">{error}</p> : null}
              <PrimaryButton onClick={submit}>
                <Icon name="person_add" /> Create operator account
              </PrimaryButton>
            </Card>
          ) : null}

          <div className="space-y-sm">
            {rows.map((r) => (
              <Card key={r.acc.id} className="space-y-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-on-surface">
                      {r.acc.name} {r.live ? <span className="text-xs font-semibold text-primary">· this device</span> : null}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {r.acc.school || "—"} · {r.acc.email}
                    </p>
                    <p
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.closedYesterday
                          ? "bg-secondary-fixed text-on-secondary-container"
                          : "bg-tertiary-container text-on-tertiary-container"
                      }`}
                    >
                      <Icon name={r.closedYesterday ? "task_alt" : "pending"} className="text-sm" />
                      {r.closedYesterday ? "Closed out" : "Not closed"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-on-surface">UGX {ugx(r.cash)}</p>
                    <p className={`text-xs font-semibold ${r.profit < 0 ? "text-tertiary" : "text-on-surface-variant"}`}>
                      {r.profit < 0 ? "-" : "+"}UGX {ugx(Math.abs(r.profit))} profit
                    </p>
                    <button
                      onClick={() => toggleAccount(r.acc.id)}
                      className="mt-1 text-xs font-bold text-primary underline"
                    >
                      {r.acc.active ? "Pause access" : "Restore access"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <p className="text-xs text-outline">
          Administrators see totals, account status and close-out discipline only — never a student's individual
          credit record.
        </p>
      </main>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg bg-on-primary/10 p-3 text-on-primary">
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-on-primary/70">
        <Icon name={icon} className="text-[16px]" /> {label}
      </p>
      <p className="mt-1 truncate text-lg font-bold">{value}</p>
    </div>
  );
}
