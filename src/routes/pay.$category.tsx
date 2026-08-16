import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, Saved } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, Keypad, MicButton, PrimaryButton } from "@/components/ui-kit";
import { parseAmount } from "@/lib/voice";
import { dateInput, fromDateInput, ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/pay/$category")({
  head: () => ({
    meta: [
      { title: "Quick Payment — SmartCanteen" },
      { name: "description", content: "A dedicated keypad page for each money-out category: type the amount, set the date, save." },
      { property: "og:title", content: "Quick Payment — SmartCanteen" },
      { property: "og:description", content: "One-tap expense pages for transport, salary, rent, airtime and any category you add." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PayCategory,
});

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function PayCategory() {
  const { category } = useParams({ from: "/pay/$category" });
  const navigate = useNavigate();
  const { state, addTx, undoLast, cashAtHand } = useStore();
  const cat = state.expenseCategories.find((c) => slugify(c.label) === category);
  const label = cat?.label ?? category.replace(/-/g, " ");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState(dateInput(Date.now()));
  const [saved, setSaved] = useState(false);
  const value = Number(amount) || 0;

  const press = (k: string) =>
    setAmount((a) => (k === "back" ? a.slice(0, -1) : (a + k).replace(/^0+(?=\d)/, "")));

  const save = () => {
    if (value <= 0) return;
    addTx({
      type: "expense",
      label: note.trim() ? `${label} — ${note.trim()}` : label,
      category: label,
      amount: value,
      ts: fromDateInput(when),
    });
    setAmount("");
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <AppLayout title={label} back>
      <Card className="text-center">
        <p className="label-bold text-on-surface-variant">
          <Icon name={cat?.icon ?? "payments"} className="mr-1 align-middle text-[18px]" />
          {label} payment
        </p>
        <p className="price-display mt-1 text-tertiary">UGX {ugx(value)}</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Cash at Hand becomes UGX {ugx(cashAtHand - value)}
        </p>
      </Card>

      <div className="flex gap-sm">
        <div className="flex-grow">
          <Keypad onPress={press} />
        </div>
        <MicButton
          onResult={(t) => {
            const n = parseAmount(t);
            if (n > 0) setAmount(String(n));
            else setNote(t);
          }}
        />
      </div>

      <Card className="grid gap-sm sm:grid-cols-2">
        <Field label="Date of payment" type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. boda to market" />
      </Card>

      <PrimaryButton tone="negative" onClick={save} disabled={value <= 0}>
        <Icon name="check" /> Save {label.toLowerCase()}
      </PrimaryButton>
      <button
        onClick={() => navigate({ to: "/expense" })}
        className="h-12 min-h-12 w-full rounded-md border-2 border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-high"
      >
        Use the full expense form instead
      </button>

      <Saved show={saved} onUndo={() => { undoLast(); setSaved(false); }} />
    </AppLayout>
  );
}
