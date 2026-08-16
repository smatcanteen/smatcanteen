import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppLayout, Saved } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { useStore, type State } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SmartCanteen" },
      {
        name: "description",
        content:
          "Set a privacy PIN with auto-lock, download a backup of your cash book, restore from a file, or clear all data.",
      },
      { property: "og:title", content: "Settings — SmartCanteen" },
      {
        property: "og:description",
        content: "Privacy lock, backup and restore for your canteen cash book.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setPin, restoreState, clearAll } = useStore();
  const [pin, setPinValue] = useState("");
  const [lock, setLock] = useState(String(state.autoLockMin));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartcanteen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as State;
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.txs)) {
        throw new Error("bad file");
      }
      restoreState(parsed);
      setError("");
      flash();
    } catch {
      setError("That file isn't a SmartCanteen backup.");
    }
  };

  return (
    <AppLayout title="Settings" back>
      <div>
        <SectionTitle>Privacy lock</SectionTitle>
        <Card className="space-y-sm">
          <p className="text-sm text-on-surface-variant">
            {state.pin ? (
              <>
                A PIN is set. Your money is hidden until it&apos;s entered.
              </>
            ) : (
              <>
                <span className="font-bold text-secondary">No PIN set.</span> Add one to hide your
                money from prying eyes.
              </>
            )}
          </p>

          <div className="grid gap-sm md:grid-cols-2">
            <Field
              label="New PIN"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
            />
            <Field
              label="Auto-lock (min)"
              inputMode="numeric"
              value={lock}
              onChange={(e) => setLock(e.target.value)}
            />
          </div>

          <div className="grid gap-sm md:grid-cols-2">
            <PrimaryButton
              tone="cta"
              disabled={pin.length < 4}
              onClick={() => {
                setPin(pin, Number(lock) || 5);
                setPinValue("");
                flash();
              }}
            >
              <Icon name="lock" className="text-[20px]" />
              Set PIN
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setPin(null, Number(lock) || 5);
                setPinValue("");
                flash();
              }}
              className="flex h-12 w-full items-center justify-center rounded-md border-2 border-outline-variant bg-surface-container text-base font-bold text-on-surface transition-colors hover:bg-surface-high"
            >
              Remove PIN
            </button>
          </div>
          <p className="text-xs text-outline">PIN must be 4–6 digits.</p>
        </Card>
      </div>

      <div>
        <SectionTitle>Backup &amp; restore</SectionTitle>
        <Card className="space-y-sm">
          <button
            type="button"
            onClick={download}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface-container text-base font-semibold text-on-surface transition-colors hover:bg-surface-high"
          >
            <Icon name="download" className="text-[20px]" />
            Download backup (JSON)
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface-container text-base font-semibold text-on-surface transition-colors hover:bg-surface-high"
          >
            <Icon name="upload" className="text-[20px]" />
            Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void restore(f);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => {
              if (confirm("Clear all cash book data? This cannot be undone.")) {
                clearAll();
                flash();
              }
            }}
            className="flex h-12 w-full items-center justify-center rounded-md bg-error text-base font-bold text-on-error shadow-raised transition-all active:scale-[0.98]"
          >
            Clear all cash book data
          </button>

          {error ? <p className="text-sm font-semibold text-error">{error}</p> : null}
          <p className="text-xs text-outline">
            Backups are plain JSON files kept on your own device — keep one after every term close.
          </p>
        </Card>
      </div>

      <Saved show={saved} onUndo={() => setSaved(false)} />
    </AppLayout>
  );
}
