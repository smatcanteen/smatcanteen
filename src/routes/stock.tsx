import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, SectionTitle } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock & Reorder Alerts — SmartCanteen" },
      { name: "description", content: "See what's on the shelf at cost and at retail, expected profit per item, and what to restock." },
      { property: "og:title", content: "Stock & Reorder Alerts — SmartCanteen" },
      { property: "og:description", content: "Per-item stock levels, expected profit and low-stock flags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Stock,
});

function Stock() {
  const { state } = useStore();
  const atCost = state.items.reduce((a, i) => a + (i.qty ? (i.buy / i.qty) * i.stock : 0), 0);
  const atRetail = state.items.reduce((a, i) => a + i.sell * i.stock, 0);
  const low = state.items.filter((i) => i.qty > 0 && i.stock / i.qty < 0.35);

  return (
    <AppLayout title="Stock">
      <div className="grid gap-sm sm:grid-cols-2">
        <Card>
          <p className="label-bold text-on-surface-variant">Shelf value at cost</p>
          <p className="price-display text-on-surface">UGX {ugx(atCost)}</p>
        </Card>
        <Card>
          <p className="label-bold text-on-surface-variant">Shelf value at retail</p>
          <p className="price-display text-primary">UGX {ugx(atRetail)}</p>
        </Card>
      </div>

      {low.length > 0 && (
        <div className="rounded-lg border border-tertiary/20 bg-tertiary/10 p-sm">
          <p className="label-bold flex items-center gap-2 text-tertiary">
            <Icon name="warning" className="text-[18px]" /> Restock soon
          </p>
          <p className="mt-1 text-sm text-on-surface">{low.map((i) => i.name).join(", ")}</p>
        </div>
      )}

      <section>
        <SectionTitle>Items this term</SectionTitle>
        <div className="space-y-sm">
          {state.items.map((i) => {
            const unitCost = i.qty ? i.buy / i.qty : 0;
            return (
              <Card key={i.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-on-surface">{i.name}</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {i.stock} / {i.qty} left
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Stat label="Unit cost" value={`UGX ${ugx(unitCost)}`} />
                  <Stat label="Sells at" value={`UGX ${ugx(i.sell)}`} />
                  <Stat label="Profit / unit" value={`UGX ${ugx(i.sell - unitCost)}`} accent />
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-highest">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${i.qty ? (i.stock / i.qty) * 100 : 0}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Link
        to="/stock-in"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary font-bold text-on-primary shadow-raised"
      >
        <Icon name="add" /> New stocking trip
      </Link>
    </AppLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-outline">{label}</p>
      <p className={`font-bold ${accent ? "text-primary" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}
