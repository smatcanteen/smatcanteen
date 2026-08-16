import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TxType = "sale" | "expense" | "stock" | "capital";

export type Tx = {
  id: string;
  type: TxType;
  label: string;
  amount: number;
  category?: string;
  ts: number;
};

export type StockItem = {
  id: string;
  name: string;
  qty: number;
  stock: number;
  buy: number;
  sell: number;
};

export type Debtor = {
  id: string;
  name: string;
  klass: string;
  item: string;
  amount: number;
  paid: boolean;
  ts: number;
};

export type Payment = { id: string; amount: number; note: string; ts: number };

export type State = {
  termName: string;
  pin: string | null;
  autoLockMin: number;
  payments: Payment[];
  capital: number;
  savingsGoal: number;
  items: StockItem[];
  txs: Tx[];
  debtors: Debtor[];
};

const STORAGE_KEY = "smartcanteen.v2";

const seed: State = {
  termName: "Term 2, 2026",
  pin: null,
  autoLockMin: 5,
  payments: [],
  capital: 473000,
  savingsGoal: 200000,
  items: [
    { id: "i1", name: "Mandazi", qty: 200, stock: 148, buy: 40000, sell: 500 },
    { id: "i2", name: "Soda (300ml)", qty: 96, stock: 61, buy: 96000, sell: 1500 },
    { id: "i3", name: "Water Bottle", qty: 120, stock: 84, buy: 72000, sell: 1000 },
  ],
  txs: [
    { id: "t0", type: "capital", label: "Opening term capital", amount: 473000, ts: Date.now() - 86400000 * 9 },
    { id: "t1", type: "stock", label: "Mandazi restock", amount: 40000, ts: Date.now() - 86400000 * 8 },
    { id: "t2", type: "stock", label: "Soda (300ml) restock", amount: 96000, ts: Date.now() - 86400000 * 8 },
    { id: "t3", type: "stock", label: "Water Bottle restock", amount: 72000, ts: Date.now() - 86400000 * 8 },
    { id: "t4", type: "sale", label: "Cash sale", amount: 86000, ts: Date.now() - 86400000 * 2 },
    { id: "t5", type: "expense", label: "Transport", category: "Transport", amount: 15000, ts: Date.now() - 86400000 },
    { id: "t6", type: "sale", label: "Cash sale", amount: 120000, ts: Date.now() - 3600000 * 5 },
    { id: "t7", type: "expense", label: "Allowance — Sarah", category: "Allowances", amount: 30000, ts: Date.now() - 3600000 * 3 },
  ],
  debtors: [
    { id: "d1", name: "Brian Okello", klass: "S3 East", item: "Soda & Mandazi", amount: 4500, paid: false, ts: Date.now() - 86400000 * 6 },
    { id: "d2", name: "Aisha Nakato", klass: "S1 West", item: "Water Bottle", amount: 2000, paid: false, ts: Date.now() - 86400000 * 2 },
  ],
};

type Ctx = {
  state: State;
  cashAtHand: number;
  totals: { sales: number; expenses: number; stock: number };
  today: { sales: number; expenses: number; net: number };
  addTx: (tx: Omit<Tx, "id" | "ts">) => void;
  addStockItems: (entries: { name: string; qty: number; buy: number; sell: number }[]) => void;
  setCapital: (amount: number, termName: string, goal: number) => void;
  settleDebtor: (id: string) => void;
  addDebtor: (d: Omit<Debtor, "id" | "ts" | "paid">) => void;
  undoLast: () => void;
  setPin: (pin: string | null, autoLockMin: number) => void;
  addPayment: (amount: number, note: string) => void;
  restoreState: (next: State) => void;
  clearAll: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const isToday = (ts: number) => new Date(ts).toDateString() === new Date().toDateString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...seed, ...(JSON.parse(raw) as State) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const addTx = useCallback((tx: Omit<Tx, "id" | "ts">) => {
    setState((s) => ({ ...s, txs: [...s.txs, { ...tx, id: uid(), ts: Date.now() }] }));
  }, []);

  const addStockItems = useCallback(
    (entries: { name: string; qty: number; buy: number; sell: number }[]) => {
      setState((s) => {
        const items = [...s.items];
        const txs = [...s.txs];
        for (const e of entries) {
          const existing = items.find((i) => i.name.toLowerCase() === e.name.toLowerCase());
          if (existing) {
            existing.qty += e.qty;
            existing.stock += e.qty;
            existing.buy = e.buy;
            existing.sell = e.sell;
          } else {
            items.push({ id: uid(), name: e.name, qty: e.qty, stock: e.qty, buy: e.buy, sell: e.sell });
          }
          txs.push({ id: uid(), type: "stock", label: `${e.name} restock`, amount: e.buy, ts: Date.now() });
        }
        return { ...s, items, txs };
      });
    },
    [],
  );

  const setCapital = useCallback((amount: number, termName: string, goal: number) => {
    setState((s) => ({
      ...s,
      termName,
      capital: amount,
      savingsGoal: goal,
      txs: [
        ...s.txs.filter((t) => t.type !== "capital"),
        { id: uid(), type: "capital", label: "Opening term capital", amount, ts: Date.now() },
      ],
    }));
  }, []);

  const settleDebtor = useCallback((id: string) => {
    setState((s) => {
      const d = s.debtors.find((x) => x.id === id);
      if (!d || d.paid) return s;
      return {
        ...s,
        debtors: s.debtors.map((x) => (x.id === id ? { ...x, paid: true } : x)),
        txs: [
          ...s.txs,
          { id: uid(), type: "sale" as TxType, label: `Credit paid — ${d.name}`, amount: d.amount, ts: Date.now() },
        ],
      };
    });
  }, []);

  const addDebtor = useCallback((d: Omit<Debtor, "id" | "ts" | "paid">) => {
    setState((s) => ({ ...s, debtors: [...s.debtors, { ...d, id: uid(), paid: false, ts: Date.now() }] }));
  }, []);

  const undoLast = useCallback(() => {
    setState((s) => ({ ...s, txs: s.txs.slice(0, -1) }));
  }, []);

  const setPin = useCallback((pin: string | null, autoLockMin: number) => {
    setState((s) => ({ ...s, pin, autoLockMin }));
  }, []);

  const addPayment = useCallback((amount: number, note: string) => {
    setState((s) => ({
      ...s,
      payments: [...s.payments, { id: uid(), amount, note, ts: Date.now() }],
    }));
  }, []);

  const restoreState = useCallback((next: State) => {
    setState({ ...seed, ...next });
  }, []);

  const clearAll = useCallback(() => {
    // Wipes the cash book only: entries, stock, debtors and capital.
    // Keeps your PIN, auto-lock, term name, savings goal and subscription payments.
    setState((s) => ({
      ...s,
      txs: [],
      debtors: [],
      items: [],
      capital: 0,
    }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const t = { sales: 0, expenses: 0, stock: 0 };
    const day = { sales: 0, expenses: 0, net: 0 };
    for (const tx of state.txs) {
      if (tx.type === "sale") t.sales += tx.amount;
      if (tx.type === "expense") t.expenses += tx.amount;
      if (tx.type === "stock") t.stock += tx.amount;
      if (isToday(tx.ts)) {
        if (tx.type === "sale") day.sales += tx.amount;
        if (tx.type === "expense" || tx.type === "stock") day.expenses += tx.amount;
      }
    }
    day.net = day.sales - day.expenses;
    const capital = state.txs.find((x) => x.type === "capital")?.amount ?? state.capital;
    return {
      state,
      cashAtHand: capital + t.sales - t.expenses - t.stock,
      totals: t,
      today: day,
      addTx,
      addStockItems,
      setCapital,
      settleDebtor,
      addDebtor,
      undoLast,
      setPin,
      addPayment,
      restoreState,
      clearAll,
    };
  }, [state, addTx, addStockItems, setCapital, settleDebtor, addDebtor, undoLast, setPin, addPayment, restoreState, clearAll]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const ugx = (n: number) => new Intl.NumberFormat("en-UG").format(Math.round(n));
export const shortUgx = (n: number) =>
  Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`;
