import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-md ${className}`}>{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-sm px-1 label-bold text-on-surface-variant">{children}</h2>;
}

export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-on-surface-variant">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-md border-2 border-outline-variant bg-surface-lowest px-3 text-base font-semibold text-on-surface outline-none transition-colors placeholder:font-normal placeholder:text-outline focus:border-primary-container"
      />
      {hint ? <span className="mt-1 block text-xs text-outline">{hint}</span> : null}
    </label>
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
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-md text-base font-bold shadow-raised transition-all active:scale-[0.98] disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function MicButton() {
  return (
    <button
      type="button"
      title="Hold to speak (voice entry)"
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border-2 border-outline-variant text-primary transition-colors hover:bg-surface-high"
      aria-label="Voice entry"
    >
      <Icon name="mic" />
    </button>
  );
}
