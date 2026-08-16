import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useAuth, roleLabels, isAdminRole, homeForRole, type Role } from "@/lib/auth";
import logoReversed from "@/assets/logo-reversed.png.asset.json";

export type AdminPerm =
  | "dashboard"
  | "accounts"
  | "new"
  | "agents"
  | "leads"
  | "commissions"
  | "support"
  | "announcements"
  | "revenue"
  | "suspend";

const matrix: Record<"admin" | "support" | "finance", AdminPerm[]> = {
  admin: [
    "dashboard",
    "accounts",
    "new",
    "agents",
    "leads",
    "commissions",
    "support",
    "announcements",
    "revenue",
    "suspend",
  ],
  support: ["dashboard", "accounts", "new", "leads", "support", "announcements"],
  finance: ["dashboard", "accounts", "agents", "commissions", "revenue"],
};

export const can = (role: Role | undefined, perm: AdminPerm) =>
  !!role && isAdminRole(role) && matrix[role as "admin" | "support" | "finance"].includes(perm);

const tabs: { to: string; label: string; perm: AdminPerm }[] = [
  { to: "/admin", label: "Dashboard", perm: "dashboard" },
  { to: "/admin/accounts", label: "Accounts", perm: "accounts" },
  { to: "/admin/new", label: "New account", perm: "new" },
  { to: "/admin/agents", label: "Agents", perm: "agents" },
  { to: "/admin/leads", label: "Leads", perm: "leads" },
  { to: "/admin/commissions", label: "Commissions", perm: "commissions" },
  { to: "/admin/support", label: "Support", perm: "support" },
  { to: "/admin/announcements", label: "Announcements", perm: "announcements" },
];

/** Shared chrome for every Super Admin / Support / Finance screen. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const path = router.state.location.pathname;

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdminRole(user.role)) navigate({ to: homeForRole(user.role) });
  }, [ready, user, navigate]);

  if (!user || !isAdminRole(user.role)) return null;

  return (
    <div className="min-h-screen bg-surface-high pb-16">
      <div className="bg-primary">
        <header className="mx-auto flex h-16 w-full max-w-container-max items-center justify-between gap-2 px-4 md:px-gutter">
          <div className="flex min-w-0 items-center gap-2">
            <img src={logoReversed.url} alt="" aria-hidden className="h-9 w-9 rounded-full object-contain" />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-on-primary">SmartCanteen Admin</p>
              <p className="truncate text-[11px] text-on-primary/70">
                {user.name} · {roleLabels[user.role]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              to="/"
              className="hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold text-on-primary/80 hover:bg-on-primary/10 sm:flex"
            >
              Tenant app
            </Link>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              aria-label="Log out"
              className="rounded-full p-2 text-secondary-container hover:bg-on-primary/10"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>

        <nav className="mx-auto flex w-full max-w-container-max gap-1 overflow-x-auto px-4 pb-2 md:px-gutter">
          {tabs
            .filter((t) => can(user.role, t.perm))
            .map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  path === t.to
                    ? "bg-on-primary text-primary"
                    : "text-on-primary/80 hover:bg-on-primary/10"
                }`}
              >
                {t.label}
              </Link>
            ))}
        </nav>
      </div>

      <main className="mx-auto w-full max-w-container-max space-y-md px-4 py-md md:px-gutter">{children}</main>
    </div>
  );
}

export function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: string }) {
  return (
    <div className="card p-md">
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
        {icon ? <Icon name={icon} className="text-[16px]" /> : null} {label}
      </p>
      <p className="mt-1 truncate text-2xl font-bold text-on-surface">{value}</p>
      {sub ? <p className="text-xs text-on-surface-variant">{sub}</p> : null}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "good" | "warn" | "bad" | "info"; children: ReactNode }) {
  const tones = {
    good: "bg-primary-fixed text-on-secondary-container",
    warn: "bg-secondary-fixed text-on-secondary-container",
    bad: "bg-tertiary-container text-on-tertiary-container",
    info: "bg-surface-highest text-on-surface-variant",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const statusTone = (status: string) =>
  status === "active"
    ? "good"
    : status === "trial"
      ? "info"
      : status === "past_due"
        ? "warn"
        : "bad";
