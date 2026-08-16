import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

const nav = [
  { to: "/", icon: "home", label: "Home" },
  { to: "/stock", icon: "inventory_2", label: "Stock" },
  { to: "/report", icon: "bar_chart", label: "Reports" },
  { to: "/debtors", icon: "group", label: "Credit" },
  { to: "/close-out", icon: "task_alt", label: "Close" },
];

export function AppLayout({
  title,
  back,
  children,
}: {
  title: string;
  back?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = router.state.location.pathname;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/95 px-4 backdrop-blur md:px-gutter">
        <div className="flex items-center gap-2">
          {back ? (
            <Link
              to="/"
              className="-ml-2 rounded-full p-2 text-primary transition-colors hover:bg-surface-high"
              aria-label="Back to home"
            >
              <Icon name="arrow_back" />
            </Link>
          ) : (
            <span className="rounded-full bg-primary p-2 text-on-primary">
              <Icon name="storefront" />
            </span>
          )}
          <h1 className="text-xl font-bold text-primary">{title}</h1>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                path === n.to
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-high"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/login"
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary-container bg-surface-variant text-primary"
          aria-label="Account"
        >
          <Icon name="person" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-container-max flex-grow space-y-lg px-4 py-md pb-28 md:px-gutter md:pb-lg">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-xl bg-surface-container px-2 py-2 shadow-[0_-2px_10px_rgba(19,82,48,0.1)] md:hidden">
        {nav.map((n) => {
          const active = path === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <Icon name={n.icon} className={active ? "" : "opacity-70"} />
              <span className="text-[11px] font-semibold">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Saved({ show, onUndo }: { show: boolean; onUndo: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] mx-auto flex w-[min(92%,420px)] items-center gap-3 rounded-xl bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-raised md:bottom-8">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-inverse-primary text-primary">
        <Icon name="check" className="text-[18px]" />
      </span>
      <span className="flex-grow text-sm font-semibold">Saved</span>
      <button onClick={onUndo} className="text-sm font-bold text-inverse-primary underline">
        Undo
      </button>
    </div>
  );
}
