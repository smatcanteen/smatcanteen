import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, Saved } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, MicButton, PrimaryButton } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/sale")({
  head: () => ({
    meta: [
      { title: "Cash Sale — SmartCanteen" },
      { name: "description", content: "Record a cash sale in seconds with the keypad, or itemize it for stock tracking." },
      { property: "og:title", content: "Cash Sale — SmartCanteen" },
      { property: "og:description", content: "Fast keypad sale entry that updates Cash at Hand automatically." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sale,
});

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];

function Sale() {
  const { state, addTx, undoLast, cashAtHand } = useStore();
  const [amount, setAmount] = useState("");
  const [itemize, setItemize] = useState(false);
  const [credit, setCredit] = useState(false);
  const [debtor, setDebtor] = useState({ name: "", klass: "" });
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const { addDebtor } = useStore();

  const itemTotal = Object.entries(picked).reduce((a, [id, q]) => {
    const it = state.items.find((i) => i.id === id);
    return a + (it ? it.sell * q : 0);
  }, 0);
  const total = itemize ? itemTotal : Number(amount) || 0;

  const press = (k: string) =>
    setAmount((a) => (k === "back" ? a.slice(0, -1) : (a + k).replace(/^0+(?=\d)/, "")));

  const handleSave = () => {
    if (total <= 0) return;
    const label = itemize
      ? Object.entries(picked)
          .map(([id, q]) => `${state.items.find((i) => i.id === id)?.name} x${q}`)
          .join(", ")
      : "Cash sale";
    if (credit) {
      addDebtor({ name: debtor.name || "Unnamed student", klass: debtor.klass, item: label, amount: total });
    } else {
      addTx({ type: "sale", label, amount: total });
    }
    setAmount("");
    setPicked({});
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <AppLayout title="Cash Sale" back>
      <div className="flex items-center justify-between rounded-lg bg-surface-container p-1">
        {[
          { l: "Simple", v: false },
          { l: "Itemize", v: true },
        ].map((t) => (
          <button
            key={t.l}
            onClick={() => setItemize(t.v)}
            className={`h-10 flex-1 rounded-md text-sm font-bold transition-colors ${
              itemize === t.v ? "bg-primary text-on-primary" : "text-on-surface-variant"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <Card className="text-center">
        <p className="label-bold text-on-surface-variant">Sale amount</p>
        <p className="price-display mt-1 text-primary">UGX {ugx(total)}</p>
        <p className="mt-1 text-xs text-outline">
          Cash at Hand becomes UGX {ugx(cashAtHand + (credit ? 0 : total))}
        </p>
      </Card>

      {itemize ? (
        <div className="space-y-sm">
          {state.items.map((it) => (
            <Card key={it.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">{it.name}</p>
                <p className="text-xs text-outline">
                  UGX {ugx(it.sell)} each · {it.stock} in stock
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPicked((p) => ({ ...p, [it.id]: Math.max(0, (p[it.id] ?? 0) - 1) }))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-primary"
                  aria-label={`Remove one ${it.name}`}
                >
                  <Icon name="remove" />
                </button>
                <span className="w-6 text-center font-bold">{picked[it.id] ?? 0}</span>
                <button
                  onClick={() => setPicked((p) => ({ ...p, [it.id]: (p[it.id] ?? 0) + 1 }))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary"
                  aria-label={`Add one ${it.name}`}
                >
                  <Icon name="add" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex gap-sm">
          <div className="grid flex-grow grid-cols-3 gap-sm">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                className="h-14 rounded-md bg-surface-lowest text-xl font-bold text-on-surface shadow-card active:scale-95"
              >
                {k === "back" ? <Icon name="backspace" /> : k}
              </button>
            ))}
          </div>
          <MicButton />
        </div>
      )}

      <Card className="space-y-sm">
        <label className="flex items-center justify-between">
          <span className="text-sm font-bold text-on-surface-variant">
            Credit sale (doesn't touch Cash at Hand)
          </span>
          <input
            type="checkbox"
            checked={credit}
            onChange={(e) => setCredit(e.target.checked)}
            className="h-6 w-6 accent-[#135230]"
          />
        </label>
        {credit && (
          <div className="grid gap-sm sm:grid-cols-2">
            <Field label="Student name" value={debtor.name} onChange={(e) => setDebtor({ ...debtor, name: e.target.value })} />
            <Field label="Class / section" value={debtor.klass} onChange={(e) => setDebtor({ ...debtor, klass: e.target.value })} />
          </div>
        )}
      </Card>

      <PrimaryButton tone="cta" onClick={handleSave} disabled={total <= 0}>
        <Icon name="check" /> Save sale
      </PrimaryButton>
      <Saved show={saved} onUndo={() => { if (!credit) undoLast(); setSaved(false); }} />
    </AppLayout>
  );
}
