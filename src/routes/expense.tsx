import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, Saved } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, MicButton, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/expense")({
  head: () => ({
    meta: [
      { title: "Expense Entry — SmartCanteen" },
      { name: "description", content: "Log transport, salary, allowances and rent in one tap — Cash at Hand updates itself." },
      { property: "og:title", content: "Expense Entry — SmartCanteen" },
      { property: "og:description", content: "Pinned category chips and fast amount entry for canteen expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Expense,
});

const pinned = [
  { l: "Transport", i: "local_shipping" },
  { l: "Salary/Wages", i: "badge" },
  { l: "Allowances", i: "volunteer_activism" },
  { l: "Rent", i: "home_work" },
];
const more = ["Foodstuffs", "Cooking Gas", "Water", "Packaging", "Utensils/Repairs", "Miscellaneous"];

function Expense() {
  const { addTx, undoLast, cashAtHand } = useStore();
  const [category, setCategory] = useState("Transport");
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [saved, setSaved] = useState(false);
  const value = Number(amount) || 0;

  const save = () => {
    if (value <= 0) return;
    const label =
      category === "Allowances" && who.trim() ? `Allowance — ${who.trim()}` : category + (recurring ? " (recurring)" : "");
    addTx({ type: "expense", label, category, amount: value });
    setAmount("");
    setWho("");
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <AppLayout title="Expense" back>
      <section>
        <SectionTitle>Category</SectionTitle>
        <div className="grid grid-cols-2 gap-sm">
          {pinned.map((c) => (
            <button
              key={c.l}
              onClick={() => setCategory(c.l)}
              className={`flex h-16 items-center gap-sm rounded-lg px-md text-left font-bold transition-colors ${
                category === c.l
                  ? "bg-tertiary text-on-tertiary shadow-raised"
                  : "bg-surface-lowest text-on-surface shadow-card"
              }`}
            >
              <Icon name={c.i} />
              <span className="text-sm">{c.l}</span>
            </button>
          ))}
        </div>
        <div className="mt-sm flex flex-wrap gap-2">
          {more.map((m) => (
            <button
              key={m}
              onClick={() => setCategory(m)}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${
                category === m ? "bg-tertiary text-on-tertiary" : "bg-surface-high text-on-surface-variant"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <Card className="space-y-sm">
        <div className="flex items-end gap-sm">
          <div className="flex-grow">
            <Field
              label={`Amount (UGX) — ${category}`}
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <MicButton />
        </div>
        {category === "Allowances" && (
          <Field label="For (name)" value={who} onChange={(e) => setWho(e.target.value)} placeholder="e.g. Sarah" />
        )}
        {category === "Rent" && (
          <label className="flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface-variant">Recurring each period</span>
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-6 w-6 accent-[#822912]"
            />
          </label>
        )}
        <p className="text-xs text-outline">
          Cash at Hand becomes UGX {ugx(cashAtHand - value)}
        </p>
      </Card>

      <PrimaryButton tone="negative" onClick={save} disabled={value <= 0}>
        <Icon name="check" /> Save expense
      </PrimaryButton>
      <Saved show={saved} onUndo={() => { undoLast(); setSaved(false); }} />
    </AppLayout>
  );
}
