import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal typing for the browser Web Speech API. */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function useVoice(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState("");
  const [heard, setHeard] = useState("");
  const ref = useRef<SpeechRecognitionLike | null>(null);
  const cb = useRef(onTranscript);
  cb.current = onTranscript;

  useEffect(() => {
    const rec = getRecognition();
    setSupported(!!rec);
    if (!rec) return;
    rec.lang = "en-UG";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results as unknown as ArrayLike<{ 0: { transcript: string } }>)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      setHeard(text);
      cb.current(text);
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone blocked. Allow mic access in your browser."
          : "Didn't catch that — try again.",
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    ref.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    setError("");
    setHeard("");
    const rec = ref.current;
    if (!rec) {
      setError("Voice entry isn't supported in this browser. Try Chrome on Android.");
      return;
    }
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      ref.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  return { listening, supported, error, heard, start, stop };
}

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

/** Pulls a UGX amount out of speech: "15000", "15k", "fifteen thousand", "1.5m". */
export function parseAmount(text: string): number {
  const t = text.toLowerCase().replace(/,/g, "");
  const digits = t.match(/(\d+(?:\.\d+)?)\s*(k|thousand|m|million)?/);
  if (digits) {
    const n = Number(digits[1]);
    const unit = digits[2];
    if (unit === "k" || unit === "thousand") return Math.round(n * 1000);
    if (unit === "m" || unit === "million") return Math.round(n * 1_000_000);
    return Math.round(n);
  }
  let total = 0;
  let current = 0;
  for (const w of t.split(/\s+/)) {
    if (w in WORDS) {
      const v = WORDS[w]!;
      current = v === 100 ? Math.max(current, 1) * 100 : current + v;
    } else if (w === "thousand") {
      total += Math.max(current, 1) * 1000;
      current = 0;
    } else if (w === "million") {
      total += Math.max(current, 1) * 1_000_000;
      current = 0;
    }
  }
  return total + current;
}

export function parseQty(text: string): number {
  const m = text.toLowerCase().match(/(\d+)\s*(pieces?|pcs|items?|units?|crates?|boxes?|packets?)/);
  return m ? Number(m[1]) : 0;
}

/** "transport fifteen thousand" -> { category: "Transport", amount: 15000 } */
export function parseExpense(text: string, categories: { label: string }[]) {
  const t = text.toLowerCase();
  const match = categories.find((c) => t.includes(c.label.toLowerCase().split("/")[0]!.trim()));
  return { category: match?.label, amount: parseAmount(t) };
}

/** "mandazi 200 pieces for 40000 selling at 500" */
export function parseStock(text: string, known: { name: string }[]) {
  const t = text.toLowerCase();
  const item = known.find((i) => t.includes(i.name.toLowerCase().split(" ")[0]!));
  const nums = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(k|thousand|m|million)?/g)].map((m) => {
    const n = Number(m[1]);
    if (m[2] === "k" || m[2] === "thousand") return n * 1000;
    if (m[2] === "m" || m[2] === "million") return n * 1_000_000;
    return n;
  });
  const qty = parseQty(t) || nums[0] || 0;
  const rest = nums.filter((n) => n !== qty);
  const buy = rest[0] ?? 0;
  const sell = rest[1] ?? 0;
  const name = item?.name ?? (t.split(/\s+/)[0] ?? "");
  return { name, qty, buy, sell };
}
