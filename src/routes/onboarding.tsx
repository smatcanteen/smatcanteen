import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton } from "@/components/ui-kit";
import { ugx, useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set Up Your Canteen — SmartCanteen" },
      {
        name: "description",
        content:
          "Three quick steps: name your shop, declare your opening term capital, and log your first stock trip.",
      },
      { property: "og:title", content: "Set Up Your Canteen — SmartCanteen" },
      {
        property: "og:description",
        content: "Get from an empty notebook to a live Cash at Hand figure in under two minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const steps = ["Operator account", "Your shop", "Opening capital", "First stock"] as const;

function Onboarding() {
  const { setCapital, addStockItems } = useStore();
  const { createOperator } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [account, setAccount] = useState({ name: "", email: "", password: "", phone: "" });
  const [accountError, setAccountError] = useState("");
  const [shop, setShop] = useState("");
  const [term, setTerm] = useState("Term 3, 2026");
  const [capital, setCapitalInput] = useState("");
  const [goal, setGoal] = useState("");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");

  const saveAccount = () => {
    const res = createOperator({ ...account, school: shop.trim() || "New canteen" });
    if (!res.ok) {
      setAccountError(res.error ?? "Could not create the account.");
      return false;
    }
    setAccountError("");
    return true;
  };

  const finish = () => {
    if (!saveAccount()) return;
    setCapital(Number(capital) || 0, term, Number(goal) || 0);
    if (itemName.trim()) {
      addStockItems([
        { name: itemName.trim(), qty: Number(qty) || 0, buy: Number(buy) || 0, sell: Number(sell) || 0 },
      ]);
    }
    try {
      localStorage.setItem("smartcanteen.shop", shop.trim());
    } catch {
      /* ignore */
    }
    navigate({ to: "/admin" });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-md px-4 py-8">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary p-2 text-on-primary">
          <Icon name="storefront" />
        </span>
        <h1 className="text-2xl font-bold text-primary">Welcome to SmartCanteen</h1>
      </div>
      <p className="text-sm text-on-surface-variant">
        Tell the system what happened, and let it do the arithmetic. Let's set up your term.
      </p>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-outline-variant"}`}
            />
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{s}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card className="space-y-sm">
          <p className="text-sm text-on-surface-variant">
            These are the login details this operator will use to open their cash book.
          </p>
          <Field
            label="Operator full name"
            placeholder="e.g. Grace Nabirye"
            value={account.name}
            onChange={(e) => setAccount({ ...account, name: e.target.value })}
          />
          <Field
            label="Login email"
            type="email"
            placeholder="operator@school.ac.ug"
            value={account.email}
            onChange={(e) => setAccount({ ...account, email: e.target.value })}
          />
          <Field
            label="Password"
            type="password"
            hint="At least 6 characters."
            value={account.password}
            onChange={(e) => setAccount({ ...account, password: e.target.value })}
          />
          <Field
            label="Phone (optional)"
            value={account.phone}
            onChange={(e) => setAccount({ ...account, phone: e.target.value })}
          />
          {accountError ? <p className="text-sm font-semibold text-tertiary">{accountError}</p> : null}
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-sm">
          <Field
            label="Canteen / shop name"
            placeholder="e.g. St. Mary's Canteen"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
          />
          <Field label="Term name" value={term} onChange={(e) => setTerm(e.target.value)} />
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-sm">
          <p className="label-bold text-on-surface-variant">Opening capital</p>
          <p className="price-display text-primary">UGX {ugx(Number(capital) || 0)}</p>
          <Field
            label="Money you are putting into the shop (UGX)"
            inputMode="numeric"
            value={capital}
            onChange={(e) => setCapitalInput(e.target.value)}
            hint="This becomes your starting Cash at Hand."
          />
          <Field
            label="Savings goal for the term (UGX)"
            inputMode="numeric"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-sm">
          <p className="text-sm text-on-surface-variant">
            Add one item to start. You can log a full restock trip later.
          </p>
          <Field label="Item name" placeholder="Mandazi" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Field label="Total cost" inputMode="numeric" value={buy} onChange={(e) => setBuy(e.target.value)} />
            <Field label="Sell price" inputMode="numeric" value={sell} onChange={(e) => setSell(e.target.value)} />
          </div>
        </Card>
      )}

      <div className="mt-auto flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="h-12 flex-1 rounded-md border-2 border-outline-variant text-base font-bold text-on-surface-variant"
          >
            Back
          </button>
        )}
        <div className="flex-[2]">
          {step < steps.length - 1 ? (
            <PrimaryButton onClick={() => setStep((s) => s + 1)}>
              Continue <Icon name="arrow_forward" />
            </PrimaryButton>
          ) : (
            <PrimaryButton tone="cta" onClick={finish}>
              Start the term <Icon name="check" />
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
