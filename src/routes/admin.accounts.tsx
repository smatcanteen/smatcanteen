import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { Pill, can, statusTone } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import {
  categoryLabels,
  checklistDone,
  fmtDate,
  statusLabels,
  tagLabels,
  usePlatform,
  zones,
  type FollowUpTag,
  type TenantStatus,
} from "@/lib/platform";

export const Route = createFileRoute("/admin/accounts")({
  head: () => ({
    meta: [
      { title: "Canteen Accounts — SmartCanteen Admin" },
      {
        name: "description",
        content: "Search, filter, tag and bulk-manage every canteen account across zones and categories.",
      },
      { property: "og:title", content: "Canteen Accounts — SmartCanteen Admin" },
      { property: "og:description", content: "Portfolio account management for SmartCanteen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accounts,
});

const filters: { key: TenantStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "past_due", label: "Past due" },
  { key: "suspended", label: "Suspended" },
];

function Accounts() {
  const { user, toggleAccount } = useAuth();
  const { s, updateTenant, toggleTag, bulkStatus, addTenantNote, logAction } = usePlatform();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TenantStatus | "all">("all");
  const [zone, setZone] = useState("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const rows = useMemo(
    () =>
      s.tenants.filter((t) => {
        const hay = `${t.canteenName} ${t.school} ${t.ownerName} ${t.phone}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        if (filter !== "all" && t.status !== filter) return false;
        if (zone !== "all" && t.zone !== zone) return false;
        return true;
      }),
    [s.tenants, q, filter, zone],
  );

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <>
      <div className="flex flex-wrap items-center gap-sm">
        <div className="min-w-[220px] flex-1">
          <Field label="Search" placeholder="Search name, school or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1 pt-5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                filter === f.key ? "bg-primary text-on-primary" : "bg-surface-lowest text-on-surface-variant"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 pt-5">
          {["all", ...zones].map((z) => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={`min-h-11 rounded-full px-3 text-xs font-bold ${
                zone === z ? "bg-secondary text-on-secondary" : "bg-surface-lowest text-on-surface-variant"
              }`}
            >
              {z === "all" ? "All zones" : z}
            </button>
          ))}
        </div>
      </div>

      {picked.length ? (
        <Card className="flex flex-wrap items-center gap-sm">
          <span className="text-sm font-bold text-on-surface">{picked.length} selected</span>
          <button
            onClick={() => {
              bulkStatus(picked, "active");
              setPicked([]);
            }}
            className="min-h-11 rounded-full bg-primary px-4 text-sm font-bold text-on-primary"
          >
            Renew / activate
          </button>
          {can(user?.role, "suspend") ? (
            <button
              onClick={() => {
                bulkStatus(picked, "suspended");
                setPicked([]);
              }}
              className="min-h-11 rounded-full bg-tertiary px-4 text-sm font-bold text-on-tertiary"
            >
              Suspend
            </button>
          ) : null}
          <button onClick={() => setPicked([])} className="min-h-11 px-3 text-sm font-bold text-primary">
            Clear
          </button>
        </Card>
      ) : null}

      <div className="space-y-sm">
        {rows.map((t) => (
          <Card key={t.accountId} className="space-y-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <label className="flex min-w-0 items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={picked.includes(t.accountId)}
                  onChange={() => toggle(t.accountId)}
                  aria-label={`Select ${t.canteenName}`}
                />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-on-surface">{t.canteenName}</span>
                  <span className="block truncate text-xs text-on-surface-variant">
                    {t.school || "—"} · {t.ownerName} · {t.phone}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1">
                    <Pill tone={statusTone(t.status)}>{statusLabels[t.status]}</Pill>
                    <Pill tone="info">{categoryLabels[t.category]}</Pill>
                    <Pill tone="info">{t.zone}</Pill>
                    {t.tags.map((tag) => (
                      <Pill key={tag} tone="warn">
                        {tagLabels[tag]}
                      </Pill>
                    ))}
                  </span>
                </span>
              </label>
              <div className="shrink-0 text-right text-xs text-on-surface-variant">
                <p>Next billing {fmtDate(t.nextBillingAt)}</p>
                <p>Last login {t.lastLoginAt ? fmtDate(t.lastLoginAt) : "Never"}</p>
                <p>{t.entries} entries</p>
                <button
                  onClick={() => setOpenId(openId === t.accountId ? null : t.accountId)}
                  className="mt-1 text-xs font-bold text-primary underline"
                >
                  {openId === t.accountId ? "Hide detail" : "Open detail"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {(["loggedIn", "capitalSet", "firstStock", "firstSale"] as const).map((k) => (
                <Pill key={k} tone={t.checklist[k] ? "good" : "bad"}>
                  <Icon name={t.checklist[k] ? "check" : "close"} className="text-[14px]" />
                  {k === "loggedIn"
                    ? "Logged in"
                    : k === "capitalSet"
                      ? "Opening capital"
                      : k === "firstStock"
                        ? "First stock"
                        : "First sale"}
                </Pill>
              ))}
              <span className="text-xs text-on-surface-variant">{checklistDone(t)}/4 onboarding steps</span>
            </div>

            {openId === t.accountId ? (
              <div className="space-y-sm rounded-md bg-surface-lowest p-sm">
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(tagLabels) as FollowUpTag[]).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(t.accountId, tag)}
                      className={`min-h-11 rounded-full px-3 text-xs font-bold ${
                        t.tags.includes(tag)
                          ? "bg-secondary text-on-secondary"
                          : "border-2 border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      {tagLabels[tag]}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-on-surface-variant">
                  Term calendar: {t.termStart} → {t.termEnd}
                </p>

                <div className="flex flex-wrap gap-sm">
                  <button
                    onClick={() => logAction(user?.name ?? "admin", `Viewed ${t.canteenName} as operator (read-only)`)}
                    className="min-h-11 rounded-full border-2 border-primary px-4 text-sm font-bold text-primary"
                  >
                    <Icon name="visibility" className="text-[18px]" /> View as operator (logged)
                  </button>
                  {can(user?.role, "suspend") ? (
                    <button
                      onClick={() => {
                        updateTenant(t.accountId, {
                          status: t.status === "suspended" ? "active" : "suspended",
                        });
                        toggleAccount(t.accountId);
                      }}
                      className="min-h-11 rounded-full bg-tertiary px-4 text-sm font-bold text-on-tertiary"
                    >
                      {t.status === "suspended" ? "Restore access" : "Suspend account"}
                    </button>
                  ) : null}
                </div>

                <div className="flex gap-sm">
                  <div className="flex-1">
                    <Field label="Internal note" value={note} onChange={(e) => setNote(e.target.value)} />
                  </div>
                  <div className="w-32 self-end">
                    <PrimaryButton
                      onClick={() => {
                        if (!note.trim()) return;
                        addTenantNote(t.accountId, note.trim());
                        setNote("");
                      }}
                    >
                      Save
                    </PrimaryButton>
                  </div>
                </div>
                {t.notes.map((n) => (
                  <p key={n.id} className="text-xs text-on-surface-variant">
                    {fmtDate(n.ts)} — {n.text}
                  </p>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
        {rows.length === 0 ? <SectionTitle>No accounts match this filter.</SectionTitle> : null}
      </div>
    </>
  );
}
