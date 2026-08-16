import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";
import { Icon } from "./Icon";
import { useVoice } from "@/lib/voice";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-md ${className}`}>{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-sm px-1 label-bold text-on-surface-variant">{children}</h2>;
}

const controlClass =
  "h-12 min-h-12 w-full rounded-md border-2 border-outline-variant bg-surface-lowest px-3 text-base font-semibold text-on-surface outline-none transition-colors placeholder:font-normal placeholder:text-outline focus:border-primary hover:border-outline";

export function Field({
  label,
  hint,
  id,
  ...props
}: { label: string; hint?: string | undefined } & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-1 block text-sm font-bold text-on-surface-variant">
        {label}
      </label>
      <input id={inputId} aria-describedby={hint ? hintId : undefined} {...props} className={controlClass} />
      {hint ? (
        <span id={hintId} className="mt-1 block text-xs text-on-surface-variant">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  children,
  id,
  ...props
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className="block">
      <label htmlFor={selectId} className="mb-1 block text-sm font-bold text-on-surface-variant">
        {label}
      </label>
      <select id={selectId} {...props} className={controlClass}>
        {children}
      </select>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  tone = "primary",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "cta" | "negative";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const tones = {
    primary: "bg-primary text-on-primary hover:bg-primary-container",
    cta: "bg-secondary-container text-on-secondary-container hover:brightness-95",
    negative: "bg-tertiary text-on-tertiary hover:bg-tertiary-container",
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-md text-base font-bold shadow-raised transition-all active:scale-[0.98] disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/**
 * Working voice entry. Tap to listen; the recognised sentence is handed back to
 * the screen, which fills in the fields.
 */
export function MicButton({
  onResult,
  hint = "Tap and say what happened",
}: {
  onResult?: (text: string) => void;
  hint?: string;
}) {
  const { listening, error, heard, start, stop, supported } = useVoice((t) => onResult?.(t));
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => (listening ? stop() : start())}
        title={hint}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Start voice entry"}
        className={`flex h-12 w-12 min-h-12 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          listening
            ? "animate-pulse border-tertiary bg-tertiary text-on-tertiary"
            : "border-outline-variant text-primary hover:bg-surface-high"
        }`}
      >
        <Icon name={listening ? "graphic_eq" : "mic"} />
      </button>
      <span className="max-w-[120px] text-center text-[10px] leading-tight text-on-surface-variant">
        {error || (listening ? "Listening…" : heard ? `“${heard}”` : supported ? "Voice" : "No mic")}
      </span>
    </div>
  );
}

/** Big MoMo-style amount keypad, reused by every money screen. */
export function Keypad({ onPress }: { onPress: (key: string) => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-sm">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onPress(k)}
          aria-label={k === "back" ? "Delete last digit" : k}
          className="h-14 min-h-14 rounded-md bg-surface-lowest text-xl font-bold text-on-surface shadow-card transition-transform active:scale-95 hover:bg-surface-low"
        >
          {k === "back" ? <Icon name="backspace" /> : k}
        </button>
      ))}
    </div>
  );
}
