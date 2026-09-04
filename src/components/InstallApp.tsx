import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "smartcanteen.install.dismissed";

/**
 * Invites the operator to keep SmartCanteen on their phone's home screen.
 * Android/Chrome gets the real install prompt; iPhone gets the Share-sheet
 * instruction, because Safari has no prompt API.
 */
export function InstallApp() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
      setIosHint(true);
      setHidden(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-[70] mx-auto w-[min(94%,460px)] rounded-xl bg-inverse-surface p-3 text-inverse-on-surface shadow-raised lg:bottom-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-inverse-primary text-primary">
          <Icon name="install_mobile" className="text-[20px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install SmartCanteen on your phone</p>
          <p className="mt-0.5 text-xs opacity-80">
            {iosHint
              ? "Tap Share, then “Add to Home Screen” — it opens like an app and works offline."
              : "Keep it on your home screen. It opens like an app and still records sales offline."}
          </p>
          {!iosHint && deferred ? (
            <button
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                dismiss();
              }}
              className="mt-2 min-h-11 rounded-full bg-inverse-primary px-4 text-sm font-bold text-primary"
            >
              Install app
            </button>
          ) : null}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-full p-1 opacity-70 hover:opacity-100"
        >
          <Icon name="close" className="text-[20px]" />
        </button>
      </div>
    </div>
  );
}
