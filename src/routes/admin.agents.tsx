import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle, SelectField } from "@/components/ui-kit";
import { Pill } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { ugx } from "@/lib/store";
import { agentChurnRate, fmtDate, usePlatform, zones } from "@/lib/platform";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({
    meta: [
      { title: "Field Agents — SmartCanteen Admin" },
      {
        name: "description",
        content: "Approve agents, track certification, territories, onboarded accounts and churn-quality flags.",
      },
      { property: "og:title", content: "Field Agents — SmartCanteen Admin" },
      { property: "og:description", content: "The people selling SmartCanteen on the ground." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Agents,
});

function Agents() {
  const { s, addAgent, updateAgent, certifyAgent, updateSettings } = usePlatform();
  const { createAccount } = useAuth();
  const [f, setF] = useState({ name: "", phone: "", email: "", territory: zones[0]!, password: "agent1234" });
  const [msg, setMsg] = useState("");

  const avgChurn =
    s.agents.reduce((a, x) => a + agentChurnRate(x.id, s.tenants), 0) / Math.max(1, s.agents.length);

  const register = () => {
    if (!f.name.trim() || !f.email.trim()) return;
    const acc = createAccount({
      name: f.name,
      email: f.email,
      password: f.password,
      school: f.territory,
      phone: f.phone,
      role: "agent",
    });
    const agent = addAgent({
      accountId: acc.account?.id ?? null,
      name: f.name.trim(),
      phone: f.phone,
      email: f.email.trim().toLowerCase(),
      territory: f.territory,
    });
    setMsg(`${agent.name} registered as Pending. They must pass training before activating paying accounts.`);
    setF({ ...f, name: "", phone: "", email: "" });
  };

  return (
    <>
      <Card className="grid gap-sm sm:grid-cols-3">
        <Field
          label="Signup bonus (UGX)"
          inputMode="numeric"
          value={String(s.settings.signupBonus)}
          onChange={(e) => updateSettings({ signupBonus: Number(e.target.value) || 0 })}
        />
        <Field
          label="Recurring trail (% of subscription)"
          inputMode="numeric"
          value={String(s.settings.trailPct)}
          onChange={(e) => updateSettings({ trailPct: Number(e.target.value) || 0 })}
        />
        <Field
          label="Clawback window (days)"
          inputMode="numeric"
          hint="Signup bonus is reversed if the account churns inside this window."
          value={String(s.settings.clawbackDays)}
          onChange={(e) => updateSettings({ clawbackDays: Number(e.target.value) || 0 })}
        />
        <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={s.settings.leaderboard}
            onChange={(e) => updateSettings({ leaderboard: e.target.checked })}
          />
          Show agent leaderboard
        </label>
      </Card>

      <Card className="space-y-sm">
        <SectionTitle>Register an agent (approval required)</SectionTitle>
        <div className="grid gap-sm sm:grid-cols-2">
          <Field label="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Field label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Field label="Email / login" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Field label="Temporary password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <SelectField label="Territory / zone" value={f.territory} onChange={(e) => setF({ ...f, territory: e.target.value })}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </SelectField>
        </div>
        {msg ? <p className="text-sm font-semibold text-primary">{msg}</p> : null}
        <PrimaryButton onClick={register}>
          <Icon name="person_add" /> Register agent
        </PrimaryButton>
      </Card>

      <div className="space-y-sm">
        {s.agents.map((a) => {
          const mine = s.tenants.filter((t) => t.agentId === a.id);
          const churn = agentChurnRate(a.id, s.tenants);
          const earned = s.commissions
            .filter((c) => c.agentId === a.id && c.status !== "clawback")
            .reduce((x, c) => x + c.amount, 0);
          return (
            <Card key={a.id} className="space-y-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-on-surface">{a.name}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {a.email} · {a.phone} · {a.territory}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill tone={a.status === "certified" ? "good" : a.status === "pending" ? "warn" : "bad"}>
                      {a.status === "certified" ? "Certified" : a.status === "pending" ? "Pending approval" : "Suspended"}
                    </Pill>
                    {a.trainedAt ? <Pill tone="info">Trained {fmtDate(a.trainedAt)}</Pill> : null}
                    {churn > avgChurn + 0.2 ? <Pill tone="bad">High churn — review quality</Pill> : null}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-on-surface-variant">
                  <p>{mine.length} accounts onboarded</p>
                  <p>UGX {ugx(earned)} commission</p>
                  <div className="mt-1 flex gap-2">
                    {!a.certified ? (
                      <button onClick={() => certifyAgent(a.id)} className="text-xs font-bold text-primary underline">
                        Approve &amp; certify
                      </button>
                    ) : null}
                    <button
                      onClick={() => updateAgent(a.id, { status: a.status === "suspended" ? "certified" : "suspended" })}
                      className="text-xs font-bold text-tertiary underline"
                    >
                      {a.status === "suspended" ? "Restore" : "Suspend"}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
