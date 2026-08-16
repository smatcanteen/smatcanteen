import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "admin" | "support" | "finance" | "operator" | "agent";

export const roleLabels: Record<Role, string> = {
  admin: "Super Admin",
  support: "Support Staff",
  finance: "Finance",
  operator: "Canteen operator",
  agent: "Field agent",
};

/** Where each role lands after signing in. */
export const homeForRole = (role: Role) =>
  role === "operator" ? "/" : role === "agent" ? "/agent" : "/admin";

export const isAdminRole = (role: Role) => role === "admin" || role === "support" || role === "finance";

export type Account = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  /** School / canteen the operator runs (blank for the platform admin). */
  school: string;
  phone?: string;
  createdAt: number;
  active: boolean;
};

type AuthState = { accounts: Account[]; sessionId: string | null };

const KEY = "smartcanteen.auth.v2";
const uid = () => Math.random().toString(36).slice(2, 10);
const ANCHOR = Date.UTC(2026, 7, 14, 9, 0, 0);

/** Demo directory. One platform admin, plus the canteen operators they oversee. */
export const seedAccounts: Account[] = [
  {
    id: "acc-admin",
    name: "Shadai Barbra",
    email: "admin@smartcanteen.app",
    password: "admin1234",
    role: "admin",
    school: "SmartCanteen HQ",
    phone: "+256 700 000 001",
    createdAt: ANCHOR - 200 * 86400000,
    active: true,
  },
  {
    id: "acc-support",
    name: "Joan Atim",
    email: "support@smartcanteen.app",
    password: "support1234",
    role: "support",
    school: "SmartCanteen HQ",
    phone: "+256 700 000 010",
    createdAt: ANCHOR - 150 * 86400000,
    active: true,
  },
  {
    id: "acc-finance",
    name: "Denis Mugisha",
    email: "finance@smartcanteen.app",
    password: "finance1234",
    role: "finance",
    school: "SmartCanteen HQ",
    phone: "+256 700 000 011",
    createdAt: ANCHOR - 150 * 86400000,
    active: true,
  },
  {
    id: "acc-agent-1",
    name: "Moses Kigozi",
    email: "agent@smartcanteen.app",
    password: "agent1234",
    role: "agent",
    school: "Kampala Central zone",
    phone: "+256 700 000 020",
    createdAt: ANCHOR - 100 * 86400000,
    active: true,
  },
  {
    id: "acc-agent-2",
    name: "Sarah Kembabazi",
    email: "sarah.agent@smartcanteen.app",
    password: "agent1234",
    role: "agent",
    school: "Wakiso zone",
    phone: "+256 700 000 021",
    createdAt: ANCHOR - 40 * 86400000,
    active: true,
  },
  {
    id: "acc-op-1",
    name: "Talemwa Raymond",
    email: "operator@smartcanteen.app",
    password: "canteen1234",
    role: "operator",
    school: "Kampala Parents SS",
    phone: "+256 700 000 002",
    createdAt: ANCHOR - 120 * 86400000,
    active: true,
  },
  {
    id: "acc-op-2",
    name: "Grace Nabirye",
    email: "grace@smartcanteen.app",
    password: "canteen1234",
    role: "operator",
    school: "St. Mary's SS",
    phone: "+256 700 000 003",
    createdAt: ANCHOR - 90 * 86400000,
    active: true,
  },
  {
    id: "acc-op-3",
    name: "Peter Wanyama",
    email: "peter@smartcanteen.app",
    password: "canteen1234",
    role: "operator",
    school: "Kololo High",
    phone: "+256 700 000 004",
    createdAt: ANCHOR - 60 * 86400000,
    active: true,
  },
];

type Ctx = {
  accounts: Account[];
  user: Account | null;
  ready: boolean;
  login: (email: string, password: string) => { ok: boolean; role?: Role; error?: string };
  logout: () => void;
  /** Creates an operator account; it appears in the admin dashboard immediately. */
  createOperator: (input: {
    name: string;
    email: string;
    password: string;
    school: string;
    phone?: string;
  }) => { ok: boolean; error?: string; account?: Account };
  /** Creates any account (agent, support staff, finance, operator). */
  createAccount: (input: {
    name: string;
    email: string;
    password: string;
    school: string;
    phone?: string;
    role: Role;
  }) => { ok: boolean; error?: string; account?: Account };
  toggleAccount: (id: string) => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AuthState>({ accounts: seedAccounts, sessionId: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AuthState>;
        setData({
          accounts: parsed.accounts?.length ? parsed.accounts : seedAccounts,
          sessionId: parsed.sessionId ?? null,
        });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, ready]);

  const login = useCallback<Ctx["login"]>(
    (email, password) => {
      const acc = data.accounts.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
      );
      if (!acc) return { ok: false, error: "Email or password is not correct." };
      if (!acc.active) return { ok: false, error: "This account has been paused by the administrator." };
      setData((d) => ({ ...d, sessionId: acc.id }));
      return { ok: true, role: acc.role };
    },
    [data.accounts],
  );

  const logout = useCallback(() => setData((d) => ({ ...d, sessionId: null })), []);

  const createAccount = useCallback<Ctx["createAccount"]>(
    (input) => {
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim() || !email || input.password.length < 6) {
        return { ok: false, error: "Name, email and a password of at least 6 characters are required." };
      }
      if (data.accounts.some((a) => a.email.toLowerCase() === email)) {
        return { ok: false, error: "An account with that email already exists." };
      }
      const account: Account = {
        id: uid(),
        name: input.name.trim(),
        email,
        password: input.password,
        role: input.role,
        school: input.school.trim(),
        ...(input.phone ? { phone: input.phone } : {}),
        createdAt: Date.now(),
        active: true,
      };
      setData((d) => ({ ...d, accounts: [...d.accounts, account] }));
      return { ok: true, account };
    },
    [data.accounts],
  );

  const createOperator = useCallback<Ctx["createOperator"]>(
    (input) => createAccount({ ...input, role: "operator" }),
    [createAccount],
  );

  const toggleAccount = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      accounts: d.accounts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
    }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      accounts: data.accounts,
      user: data.accounts.find((a) => a.id === data.sessionId) ?? null,
      ready,
      login,
      logout,
      createOperator,
      createAccount,
      toggleAccount,
    }),
    [data, ready, login, logout, createOperator, createAccount, toggleAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
