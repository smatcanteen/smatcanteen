import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout, Saved } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, MicButton, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/stock-in")({
  head: () => ({
    meta: [
      { title: "Stock In — SmartCanteen" },
      { name: "description", content: "Log a whole restocking trip: quantity, buying price, selling price and live expected profit." },
      { property: "og:title", content: "Stock In — SmartCanteen" },
      { property: "og:description", content: "Fast line-item stock entry with live expected profit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StockIn,
});

type Line = { name: string; qty: string; buy: string; sell: string };
const blank: Line = { name: "", qty: "", buy: "", sell: "" };

function StockIn() {
  const { state, addStockItems, cashAtHand } = useStore();
  const [lines, setLines] = useState<Line[]>([{ ...blank }]);
  const [saved, setSaved] = useState(false);

  const parsed = lines.map((l) => ({
    name: l.name.trim(),
    qty: Number(l.qty) || 0,
    buy: Number(l.buy) || 0,
    sell: Number(l.sell) || 0,
  }));
  const cost = parsed.reduce((a, l) => a + l.buy, 0);
  const revenue = parsed.reduce((a, l) => a + l.qty * l.sell, 0);
  const profit = revenue - cost;
  const valid = parsed.some((l) => l.name && l.qty > 0 && l.buy > 0);

  const update = (i: number, key: keyof Line, v: string) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: v } : l)));

  const save = () => {
    addStockItems(parsed.filter((l) => l.name && l.qty > 0 && l.buy > 0));
    setLines([{ ...blank }]);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <AppLayout title="Stock In" back>
      <p className="text-sm text-on-surface-variant">
        Cash at Hand after this trip:{" "}
        <strong className="text-primary">UGX {ugx(cashAtHand - cost)}</strong>
      </p>

      {lines.map((line, i) => {
        const p = parsed[i]!;
        return (
          <Card key={i} className="space-y-sm">
            <div className="flex items-center justify-between">
              <SectionTitle>Item {i + 1}</SectionTitle>
              {lines.length > 1 && (
                <button
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  className="text-tertiary"
                  aria-label="Remove item"
                >
                  <Icon name="delete" />
                </button>
              )}
            </div>
            <div className="flex gap-sm">
              <div className="flex-grow">
                <Field
                  label="Item name"
                  list="known-items"
                  placeholder="e.g. Mandazi"
                  value={line.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    update(i, "name", v);
                    const known = state.items.find((it) => it.name.toLowerCase() === v.toLowerCase());
                    if (known) update(i, "sell", String(known.sell));
                  }}
                />
              </div>
              <div className="self-end">
                <MicButton />
              </div>
            </div>
            <datalist id="known-items">
              {state.items.map((it) => (
                <option key={it.id} value={it.name} />
              ))}
            </datalist>
            <div className="grid grid-cols-3 gap-sm">
              <Field label="Qty" inputMode="numeric" value={line.qty} onChange={(e) => update(i, "qty", e.target.value)} />
              <Field label="Buying (total)" inputMode="numeric" value={line.buy} onChange={(e) => update(i, "buy", e.target.value)} />
              <Field label="Selling (each)" inputMode="numeric" value={line.sell} onChange={(e) => update(i, "sell", e.target.value)} />
            </div>
            <div className="rounded-md bg-surface-low p-sm text-sm">
              Expected profit:{" "}
              <strong className={p.qty * p.sell - p.buy >= 0 ? "text-primary" : "text-tertiary"}>
                UGX {ugx(p.qty * p.sell - p.buy)}
              </strong>
            </div>
          </Card>
        );
      })}

      <button
        onClick={() => setLines((ls) => [...ls, { ...blank }])}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-outline-variant font-bold text-primary hover:bg-surface-low"
      >
        <Icon name="add" /> Add another item
      </button>

      <Card className="space-y-2 bg-surface-low">
        <Row label="Total spent" value={`UGX ${ugx(cost)}`} />
        <Row label="Expected revenue" value={`UGX ${ugx(revenue)}`} />
        <Row label="Expected profit" value={`UGX ${ugx(profit)}`} strong />
      </Card>

      <PrimaryButton onClick={save} disabled={!valid}>
        <Icon name="check" /> Save stocking trip
      </PrimaryButton>
      <Saved show={saved} onUndo={() => setSaved(false)} />
    </AppLayout>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={strong ? "text-base font-bold text-primary" : "font-semibold"}>{value}</span>
    </div>
  );
}
