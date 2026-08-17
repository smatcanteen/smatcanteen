import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { BrandMark } from "@/components/Brand";
import { homeForRole, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — SmartCanteen Operators & Admin" },
      {
        name: "description",
        content:
          "One secure login for canteen operators and the SmartCanteen platform owner. Open your cash book or the operator overview.",
      },
      { property: "og:title", content: "Log in — SmartCanteen" },
      {
        property: "og:description",
        content: "Every shilling in and out of your canteen — counted for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

const highlights = [
  {
    icon: "receipt_long",
    title: "Sales & expenses in seconds",
    body: "Tap a category, type the amount, done — no paper book.",
  },
  {
    icon: "group",
    title: "Student credit tracked",
    body: "Know who owes you, how much and since when.",
  },
  {
    icon: "account_balance_wallet",
    title: "Cash at hand, always right",
    body: "Daily opening, closing and cumulative balance calculated for you.",
  },
  {
    icon: "bar_chart",
    title: "Term reports & exports",
    body: "Profit by term, Excel and PDF for the school office.",
  },
];

function Login() {
  const navigate = useNavigate();
  const { login, user, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: homeForRole(user.role) });
  }, [ready, user, navigate]);

  const submit = () => {
    setBusy(true);
    const res = login(email, password);
    if (!res.ok) {
      setBusy(false);
      setError(res.error ?? "Could not sign you in.");
      return;
    }
    setError("");
    navigate({ to: homeForRole(res.role!) });
  };

  const useDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface-high">
      {/* Green band — the same header language as the operator dashboard */}
      <div className="bg-primary pb-16 md:hidden">
        <div className="mx-auto flex w-full max-w-[560px] items-center gap-3 px-4 pt-6">
          <BrandMark variant="dark" size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-on-primary">
              Smart<span className="text-secondary-container">Canteen</span>
            </p>
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-on-primary/70">
              The smarter way to run your canteen
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-12 w-full max-w-5xl px-3 pb-8 md:mt-0 md:px-6 md:py-8">
        <div className="grid w-full overflow-hidden rounded-2xl shadow-raised md:grid-cols-2">
          {/* Login form */}
          <div className="flex flex-col bg-surface-lowest p-4 sm:p-6 md:p-10">
            <div className="hidden items-center gap-2 md:flex">
              <BrandMark size="md" />
              <div>
                <p className="text-lg font-bold text-secondary">
                  Smart<span className="text-primary">Canteen</span>
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  The smarter way to run your canteen
                </p>
              </div>
            </div>

            <form
              className="my-auto space-y-sm py-4 md:py-8"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">Welcome back</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Operators, field agents and admin sign in here.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-on-surface-variant" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.ac.ug"
                  className="h-12 min-h-12 w-full rounded-md border-2 border-outline-variant bg-surface-low px-3 font-semibold text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 min-h-12 w-full rounded-md border-2 border-outline-variant bg-surface-low px-3 pr-12 font-semibold text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-high"
                  >
                    <Icon name={show ? "visibility_off" : "visibility"} />
                  </button>
                </div>
              </div>

              {error ? (
                <p className="flex items-start gap-1 text-sm font-semibold text-tertiary">
                  <Icon name="error" className="text-[18px]" /> <span className="min-w-0">{error}</span>
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-base font-bold text-on-primary shadow-raised transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
                    Signing you in…
                  </>
                ) : (
                  "Log in"
                )}
              </button>

              <p className="flex items-center justify-center gap-1 text-center text-xs text-on-surface-variant">
                <Icon name="verified_user" className="text-[14px]" /> One secure login for every role.
              </p>

              <div className="rounded-md border border-outline-variant/60 bg-surface-low p-sm text-xs text-on-surface-variant">
                <p className="mb-1 font-bold text-on-surface">Demo accounts</p>
                <DemoRow label="Operator" email="operator@smartcanteen.app" pass="canteen1234" onUse={useDemo} />
                <DemoRow label="Admin" email="admin@smartcanteen.app" pass="admin1234" onUse={useDemo} />
                <DemoRow label="Field agent" email="agent@smartcanteen.app" pass="agent1234" onUse={useDemo} />
              </div>
            </form>

            <p className="text-center text-[11px] text-on-surface-variant">
              © 2026 SmartCanteen. Your records stay private to your canteen.
            </p>
          </div>

          {/* Brand panel */}
          <div className="relative hidden flex-col justify-center gap-md bg-primary p-10 text-on-primary md:flex">
            <div className="flex items-center gap-3">
              <BrandMark variant="dark" size="lg" />
              <div>
                <p className="text-lg font-bold text-secondary-container">
                  Smart<span className="text-on-primary">Canteen</span>
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-on-primary/70">
                  The smarter way to run your canteen
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold leading-tight">
              Every shilling in and out of your canteen — counted for you.
            </h2>
            <p className="text-sm text-on-primary/80">
              Replace the paper book. Record sales, expenses and student credit as they happen, and see exactly
              how much cash you should be holding at the end of the day.
            </p>

            <ul className="space-y-2">
              {highlights.map((h) => (
                <li key={h.title} className="flex items-start gap-3 rounded-lg bg-on-primary/10 p-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-on-primary/15">
                    <Icon name={h.icon} className="text-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{h.title}</p>
                    <p className="text-xs text-on-primary/75">{h.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoRow({
  label,
  email,
  pass,
  onUse,
}: {
  label: string;
  email: string;
  pass: string;
  onUse: (email: string, pass: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="min-w-0 truncate">
        <b>{label}:</b> {email} / {pass}
      </span>
      <button
        type="button"
        onClick={() => onUse(email, pass)}
        className="shrink-0 font-bold text-primary underline"
      >
        Use
      </button>
    </div>
  );
}
