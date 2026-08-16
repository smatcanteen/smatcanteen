import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle, SelectField } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import {
  categoryLabels,
  usePlatform,
  zones,
  type CategoryTemplate,
} from "@/lib/platform";

export const Route = createFileRoute("/admin/new")({
  head: () => ({
    meta: [
      { title: "New Canteen Account — SmartCanteen Admin" },
      {
        name: "description",
        content:
          "Account creation wizard: business details, category template, trial length, agent tagging and a WhatsApp invite link.",
      },
      { property: "og:title", content: "New Canteen Account — SmartCanteen Admin" },
      { property: "og:description", content: "Onboard a canteen in four guided steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewAccount,
});

const steps = ["Business", "Template & term", "Access", "Invite"] as const;

function NewAccount() {
  const { user, createOperator } = useAuth();
  const { s, addTenant, updateSettings, addCommission } = usePlatform();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    canteenName: "",
    school: "",
    ownerName: "",
    phone: "",
    email: "",
    password: "",
    category: "day" as CategoryTemplate,
    zone: zones[0]!,
    agentId: "",
    trialDays: "14",
    termStart: "2026-09-07",
    termEnd: "2026-12-05",
    notes: "",
    cloneFrom: "",
    csv: "",
  });
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  const clone = (accountId: string) => {
    const t = s.tenants.find((x) => x.accountId === accountId);
    if (!t) return set({ cloneFrom: "" });
    set({
      cloneFrom: accountId,
      category: t.category,
      zone: t.zone,
      school: t.school,
      termStart: t.termStart,
      termEnd: t.termEnd,
      agentId: t.agentId ?? "",
    });
  };

  const next = () => {
    if (step === 0 && (!f.ownerName.trim() || !f.school.trim())) {
      setError("Owner name and school name are required.");
      return;
    }
    setError("");
    setStep((x) => x + 1);
  };

  const finish = () => {
    if (busy) return;
    setBusy(true);
    const res = createOperator({
      name: f.ownerName,
      email: f.email,
      password: f.password,
      school: f.school,
      phone: f.phone,
    });
    if (!res.ok || !res.account) {
      setError(res.error ?? "Could not create the account.");
      setBusy(false);
      return;
    }
    setError("");
    const trialDays = Number(f.trialDays) || 0;
    addTenant({
      accountId: res.account.id,
      canteenName: f.canteenName.trim() || `${f.ownerName.trim()}'s canteen`,
      school: f.school,
      ownerName: f.ownerName,
      phone: f.phone,
      category: f.category,
      zone: f.zone,
      agentId: f.agentId || null,
      status: trialDays > 0 ? "trial" : "active",
      trialEndsAt: trialDays > 0 ? Date.now() + trialDays * 86400000 : null,
      nextBillingAt: Date.now() + (trialDays > 0 ? trialDays : 30 * s.settings.months) * 86400000,
      tags: [],
      checklist: { loggedIn: false, capitalSet: false, firstStock: false, firstSale: false },
      termStart: f.termStart,
      termEnd: f.termEnd,
    });
    if (f.agentId) {
      addCommission({
        agentId: f.agentId,
        accountId: res.account.id,
        type: "signup",
        amount: s.settings.signupBonus,
        status: "pending",
      });
    }
    const link = `https://smatcanteen.lovable.app/login`;
    const msg = s.settings.welcomeTemplate
      .replace("{name}", f.ownerName)
      .replace("{link}", link)
      .replace("{email}", f.email.trim().toLowerCase());
    setInvite(`https://wa.me/${f.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
    setStep(3);
    setBusy(false);
  };


  return (
    <>
      <div className="flex gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-outline-variant"}`} />
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card className="grid gap-sm sm:grid-cols-2">
          <Field label="Canteen / business name" value={f.canteenName} onChange={(e) => set({ canteenName: e.target.value })} />
          <Field label="School name" value={f.school} onChange={(e) => set({ school: e.target.value })} />
          <Field label="Owner name" value={f.ownerName} onChange={(e) => set({ ownerName: e.target.value })} />
          <Field label="Owner phone" placeholder="+2567…" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
          <SelectField label="Clone setup from" value={f.cloneFrom} onChange={(e) => clone(e.target.value)}>
            <option value="">Start fresh</option>
            {s.tenants.map((t) => (
              <option key={t.accountId} value={t.accountId}>
                {t.canteenName}
              </option>
            ))}
          </SelectField>
          <Field label="Internal note" value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Card>
      )}

      {step === 1 && (
        <Card className="grid gap-sm sm:grid-cols-2">
          <SelectField
            label="Category template"
            value={f.category}
            onChange={(e) => set({ category: e.target.value as CategoryTemplate })}
          >
            {(Object.keys(categoryLabels) as CategoryTemplate[]).map((k) => (
              <option key={k} value={k}>
                {categoryLabels[k]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Zone / district" value={f.zone} onChange={(e) => set({ zone: e.target.value })}>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </SelectField>
          <Field label="Term starts" type="date" value={f.termStart} onChange={(e) => set({ termStart: e.target.value })} />
          <Field label="Term ends" type="date" value={f.termEnd} onChange={(e) => set({ termEnd: e.target.value })} />
          <Field
            label="Trial length (days)"
            inputMode="numeric"
            hint="0 activates the subscription immediately."
            value={f.trialDays}
            onChange={(e) => set({ trialDays: e.target.value })}
          />
          <SelectField label="Assigned agent / source" value={f.agentId} onChange={(e) => set({ agentId: e.target.value })}>
            <option value="">Direct — no agent</option>
            {s.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.territory} {a.certified ? "" : "(uncertified)"}
              </option>
            ))}
          </SelectField>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-sm">
          <div className="grid gap-sm sm:grid-cols-2">
            <Field label="Login email" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />
            <Field
              label="Auto-generated password"
              value={f.password}
              hint="At least 6 characters."
              onChange={(e) => set({ password: e.target.value })}
            />
          </div>
          <button
            onClick={() => set({ password: `sc${Math.random().toString(36).slice(2, 8)}` })}
            className="min-h-11 rounded-full border-2 border-primary px-4 text-sm font-bold text-primary"
          >
            <Icon name="autorenew" className="text-[18px]" /> Generate password
          </button>
          <SectionTitle>Starting stock — bulk CSV (name,qty,buy,sell)</SectionTitle>
          <textarea
            value={f.csv}
            onChange={(e) => set({ csv: e.target.value })}
            rows={4}
            placeholder="Mandazi,200,40000,500"
            className="w-full rounded-md border-2 border-outline-variant bg-surface-lowest p-3 text-sm text-on-surface"
          />
          <p className="text-xs text-on-surface-variant">
            {f.csv.trim() ? `${f.csv.trim().split("\n").length} item rows will be handed to the operator.` : "Optional."}
          </p>
          {error ? <p className="text-sm font-semibold text-tertiary">{error}</p> : null}
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-sm">
          <p className="flex items-center gap-1 text-sm font-bold text-primary">
            <Icon name="check_circle" /> Account created.
          </p>
          <SectionTitle>Welcome message template</SectionTitle>
          <textarea
            rows={4}
            value={s.settings.welcomeTemplate}
            onChange={(e) => updateSettings({ welcomeTemplate: e.target.value })}
            className="w-full rounded-md border-2 border-outline-variant bg-surface-lowest p-3 text-sm text-on-surface"
          />
          {invite ? (
            <a
              href={invite}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary text-base font-bold text-on-primary"
            >
              <Icon name="chat" /> Send WhatsApp / SMS invite
            </a>
          ) : null}
          <p className="text-xs text-on-surface-variant">
            Created by {user?.name}. Branding preview uses the SmartCanteen green with the school name in the header.
          </p>
        </Card>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex gap-sm bg-surface-high/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
        {step > 0 && step < 3 ? (
          <button
            onClick={() => {
              setError("");
              setStep((x) => x - 1);
            }}
            className="h-12 flex-1 rounded-md border-2 border-outline-variant font-bold text-on-surface-variant"
          >
            Back
          </button>
        ) : null}
        <div className="flex-[2]">
          {step < 2 ? (
            <PrimaryButton onClick={next}>
              Continue <Icon name="arrow_forward" />
            </PrimaryButton>
          ) : step === 2 ? (
            <PrimaryButton tone="cta" onClick={finish} disabled={busy}>
              {busy ? "Creating…" : "Create account"} <Icon name="check" />
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => {
                setStep(0);
                setInvite("");
                setError("");
                set({ canteenName: "", ownerName: "", email: "", password: "", phone: "", csv: "", cloneFrom: "" });
              }}
            >
              Create another
            </PrimaryButton>
          )}
        </div>
      </div>

    </>
  );
}
