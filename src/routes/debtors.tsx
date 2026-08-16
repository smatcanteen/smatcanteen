import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/debtors")({
  head: () => ({
    meta: [
      { title: "Credit & Debtors — SmartCanteen" },
      { name: "description", content: "Track student credit separately from cash, and convert a payment into a cash sale in one tap." },
      { property: "og:title", content: "Credit & Debtors — SmartCanteen" },
      { property: "og:description", content: "Names, classes, balances and overdue reminders for canteen credit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Debtors,
});

function Debtors() {
  const { state, settleDebtor, addDebtor } = useStore();
  const [form, setForm] = useState({ name: "", klass: "", item: "", amount: "" });
  const open = state.debtors.filter((d) => !d.paid);
  const owed = open.reduce((a, d) => a + d.amount, 0);

  return (
    <AppLayout title="Credit">
      <Card>
        <p className="label-bold text-on-surface-variant">Outstanding credit</p>
        <p className="price-display text-tertiary">UGX {ugx(owed)}</p>
        <p className="text-xs text-outline">Credit never touches Cash at Hand until it's collected.</p>
      </Card>

      <section>
        <SectionTitle>Debtors</SectionTitle>
        <div className="space-y-sm">
          {state.debtors.map((d) => {
            const days = Math.floor((Date.now() - d.ts) / 86400000);
            return (
              <Card key={d.id} className="flex items-center justify-between gap-sm">
                <div>
                  <p className="font-bold text-on-surface">{d.name}</p>
                  <p className="text-xs text-outline">
                    {d.klass} · {d.item} · {days}d ago
                  </p>
                  {!d.paid && days > 5 && (
                    <span className="mt-1 inline-block rounded-full bg-error-container px-2 py-0.5 text-[11px] font-bold text-on-error-container">
                      Overdue reminder
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-bold ${d.paid ? "text-primary" : "text-tertiary"}`}>
                    UGX {ugx(d.amount)}
                  </p>
                  {d.paid ? (
                    <span className="text-xs font-bold text-primary">Paid</span>
                  ) : (
                    <button
                      onClick={() => settleDebtor(d.id)}
                      className="mt-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary"
                    >
                      Mark paid
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="space-y-sm">
        <SectionTitle>Add a credit sale</SectionTitle>
        <div className="grid gap-sm sm:grid-cols-2">
          <Field label="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Class / section" value={form.klass} onChange={(e) => setForm({ ...form, klass: e.target.value })} />
          <Field label="Item" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          <Field label="Amount (UGX)" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <PrimaryButton
          tone="cta"
          disabled={!form.name || !(Number(form.amount) > 0)}
          onClick={() => {
            addDebtor({ name: form.name, klass: form.klass, item: form.item, amount: Number(form.amount) });
            setForm({ name: "", klass: "", item: "", amount: "" });
          }}
        >
          <Icon name="person_add" /> Record credit
        </PrimaryButton>
      </Card>
    </AppLayout>
  );
}
