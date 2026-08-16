import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/ui-kit";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SmartCanteen" },
      { name: "description", content: "Operator and staff PIN sign-in for the SmartCanteen daily cash book." },
      { property: "og:title", content: "Sign in — SmartCanteen" },
      { property: "og:description", content: "Enter your PIN to open your canteen's cash book." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<"Owner" | "Staff">("Owner");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-lg">
      <div className="w-full max-w-sm space-y-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary">
          <Icon name="storefront" className="text-[32px]" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-primary">SmartCanteen</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Your canteen's money, one number that's always right.
          </p>
        </div>

        <div className="flex rounded-lg bg-surface-container p-1">
          {(["Owner", "Staff"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`h-10 flex-1 rounded-md text-sm font-bold ${
                role === r ? "bg-primary text-on-primary" : "text-on-surface-variant"
              }`}
            >
              {r} PIN
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full ${pin.length > i ? "bg-primary" : "bg-surface-highest"}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-sm">
          {keys.map((k, i) =>
            k === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                onClick={() =>
                  setPin((p) => (k === "back" ? p.slice(0, -1) : p.length < 4 ? p + k : p))
                }
                className="h-14 rounded-md bg-surface-lowest text-xl font-bold text-on-surface shadow-card active:scale-95"
              >
                {k === "back" ? <Icon name="backspace" /> : k}
              </button>
            ),
          )}
        </div>

        <PrimaryButton onClick={() => navigate({ to: "/" })} disabled={pin.length < 4}>
          <Icon name="lock_open" /> Enter as {role}
        </PrimaryButton>
        <p className="text-xs text-outline">
          Demo mode — any 4-digit PIN opens the operator dashboard.
        </p>
      </div>
    </div>
  );
}
