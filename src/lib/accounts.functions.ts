/**
 * Account provisioning for SmartCanteen.
 *
 * Operators and field agents are onboarded by phone number — an email is
 * optional, because many operators do not have one. Each new account gets a
 * one-time password that the admin forwards on WhatsApp; the operator then
 * sets a private PIN in Settings and uses that to unlock the app.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProvisionInput = {
  name: string;
  phone: string;
  role: "operator" | "agent" | "support" | "finance" | "admin";
  school: string;
  email?: string;
};

/** Digits only, Uganda-friendly: 0772… becomes 256772…. */
export function normalisePhone(raw: string) {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) return `256${d.slice(1)}`;
  if (d.startsWith("256")) return d;
  return d;
}

/** Login address derived from the phone number — never shown to the operator. */
export const phoneEmail = (phone: string) => `p${normalisePhone(phone)}@phone.smartcanteen.app`;

const otp = () => String(Math.floor(100000 + Math.random() * 900000));

async function hashPin(pin: string, saltHex?: string) {
  const { randomBytes, scryptSync } = await import("node:crypto");
  const salt = saltHex ?? randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}$${hash}`;
}

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("support")) throw new Error("Forbidden");
  return roles as string[];
}

/** Creates a working login for a new operator or field agent. */
export const provisionAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ProvisionInput) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as any);

    const phone = normalisePhone(data.phone);
    if (phone.length < 9) return { ok: false as const, error: "Enter a valid phone number." };
    const name = (data.name || "").trim();
    if (!name) return { ok: false as const, error: "Enter the person's full name." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin.from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (existing.data) return { ok: false as const, error: "That phone number already has an account." };

    const password = otp();
    const created = await supabaseAdmin.auth.admin.createUser({
      email: phoneEmail(phone),
      password,
      email_confirm: true,
      user_metadata: { full_name: name, phone },
    });
    if (created.error || !created.data.user) {
      return { ok: false as const, error: created.error?.message ?? "Could not create the account." };
    }
    const id = created.data.user.id;

    const prof = await supabaseAdmin.from("profiles").insert({
      id,
      full_name: name,
      phone,
      email: data.email?.trim() || null,
      school: (data.school || "").trim(),
      created_by: context.userId,
    });
    if (prof.error) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      return { ok: false as const, error: prof.error.message };
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: id, role: data.role });

    return { ok: true as const, id, phone, otp: password };
  });

/** Pause or restore access without losing any data. */
export const setAccountActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; active: boolean }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.active ? "none" : "876000h",
    });
    return { ok: true as const };
  });

/** Permanently removes an account and everything it owns. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context as any);
    if (!roles.includes("admin")) return { ok: false as const, error: "Only a super admin can delete accounts." };
    if (data.id === context.userId) return { ok: false as const, error: "You cannot delete your own account." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Issues a fresh one-time password when the operator lost the first one. */
export const resetOneTimePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertStaff(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = otp();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password });
    if (error) return { ok: false as const, error: error.message };
    await supabaseAdmin.from("profiles").update({ otp_pending: true, pin_hash: null }).eq("id", data.id);
    return { ok: true as const, otp: password };
  });

/** The signed-in operator chooses the PIN they will unlock the app with. */
export const setMyPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pin: string }) => data)
  .handler(async ({ data, context }) => {
    if (!/^\d{4,6}$/.test(data.pin)) return { ok: false as const, error: "Use a 4 to 6 digit PIN." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ pin_hash: await hashPin(data.pin), otp_pending: false })
      .eq("id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Unlock check used by the PIN screen. */
export const verifyMyPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { pin: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("profiles")
      .select("pin_hash")
      .eq("id", context.userId)
      .maybeSingle();
    const stored = row?.pin_hash as string | null | undefined;
    if (!stored) return { ok: false as const, error: "No PIN set yet." };
    const [salt] = stored.split("$");
    const candidate = await hashPin(data.pin, salt);
    return candidate === stored ? { ok: true as const } : { ok: false as const, error: "Wrong PIN." };
  });
