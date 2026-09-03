/**
 * Invite delivery — turns a new operator account into a ready-to-send
 * WhatsApp message or a formatted email, addressed to that exact person.
 */

export type InviteDetails = {
  name: string;
  /** Optional — many operators are onboarded on WhatsApp only. */
  email?: string;
  /** The one-time password the operator uses for their first login. */
  password: string;
  school?: string;
  phone?: string;
  capital?: number;
  termName?: string;
};

export const loginLink = "https://smatcanteen.lovable.app/login";

const money = (n: number) => n.toLocaleString("en-UG");

/** Fill {name} {phone} {email} {password} {link} {school} in an admin template. */
export function fillTemplate(template: string, d: InviteDetails) {
  return template
    .replaceAll("{name}", d.name.trim())
    .replaceAll("{phone}", d.phone ?? "")
    .replaceAll("{email}", (d.email ?? "").trim().toLowerCase())
    .replaceAll("{password}", d.password)
    .replaceAll("{school}", d.school ?? "")
    .replaceAll("{link}", loginLink);
}

/** Friendly default message used when no template is set. */
export function inviteMessage(d: InviteDetails) {
  const lines = [
    `Hello ${d.name.trim()},`,
    "",
    `Your SmartCanteen account for ${d.school || "your canteen"} is ready.`,
    "",
    `Open: ${loginLink}`,
    `Phone number to log in: ${d.phone ?? ""}`,
    `One-time password: ${d.password}`,
  ];
  if (d.email?.trim()) lines.push(`Email on file: ${d.email.trim().toLowerCase()}`);
  if (d.termName) lines.push(`Term: ${d.termName}`);
  if (d.capital) lines.push(`Opening cash entered for you: UGX ${money(d.capital)}`);
  lines.push(
    "",
    "After you log in, open Settings and set your private PIN.",
    "You will then unlock SmartCanteen with that PIN — keep it secret.",
    "SmartCanteen — the smarter way to run your canteen.",
  );
  return lines.join("\n");
}


/** wa.me deep link. Returns null when there is no usable phone number. */
export function whatsappLink(phone: string | undefined, message: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  const msisdn = digits.startsWith("0") ? `256${digits.slice(1)}` : digits;
  return `https://wa.me/${msisdn}?text=${encodeURIComponent(message)}`;
}

/** mailto link with subject + body, so the operator gets the same details. */
export function emailLink(email: string | undefined, message: string, subject = "Your SmartCanteen login") {
  const to = (email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return null;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
