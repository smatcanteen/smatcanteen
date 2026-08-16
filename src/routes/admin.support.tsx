import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Card, SectionTitle } from "@/components/ui-kit";
import { Pill } from "@/components/AdminShell";
import { useAuth } from "@/lib/auth";
import { fmtDate, usePlatform, type Ticket } from "@/lib/platform";

export const Route = createFileRoute("/admin/support")({
  head: () => ({
    meta: [
      { title: "Support Tickets — SmartCanteen Admin" },
      {
        name: "description",
        content: "A recorded ticket queue for operator issues: subject, thread, assignment and resolution status.",
      },
      { property: "og:title", content: "Support Tickets — SmartCanteen Admin" },
      { property: "og:description", content: "Support with a paper trail, not scattered WhatsApp messages." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Support,
});

const tone = (s: Ticket["status"]) => (s === "resolved" ? "good" : s === "open" ? "warn" : "info");

function Support() {
  const { user } = useAuth();
  const { s, replyTicket, setTicketStatus } = usePlatform();
  const [draft, setDraft] = useState<Record<string, string>>({});

  return (
    <>
      <SectionTitle>{s.tickets.filter((t) => t.status !== "resolved").length} open conversations</SectionTitle>
      {s.tickets.length === 0 ? <Card>No tickets yet.</Card> : null}
      {s.tickets.map((t) => (
        <Card key={t.id} className="space-y-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-bold text-on-surface">{t.subject}</p>
              <p className="text-xs text-on-surface-variant">
                {t.accountName} · opened {fmtDate(t.createdAt)}
                {t.assignedTo ? ` · assigned to ${t.assignedTo}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone={tone(t.status)}>{t.status.replace("_", " ")}</Pill>
              {t.status !== "resolved" ? (
                <button
                  onClick={() => setTicketStatus(t.id, "resolved", user?.name ?? "admin")}
                  className="text-xs font-bold text-primary underline"
                >
                  Resolve
                </button>
              ) : (
                <button onClick={() => setTicketStatus(t.id, "open")} className="text-xs font-bold text-primary underline">
                  Reopen
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {t.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-md p-2 text-sm ${
                  m.from === "admin"
                    ? "ml-auto bg-primary text-on-primary"
                    : "bg-surface-lowest text-on-surface"
                }`}
              >
                {m.text}
                <span className="mt-0.5 block text-[10px] opacity-70">{fmtDate(m.ts)}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              aria-label={`Reply to ${t.subject}`}
              value={draft[t.id] ?? ""}
              onChange={(e) => setDraft({ ...draft, [t.id]: e.target.value })}
              placeholder="Write a reply…"
              className="h-12 flex-1 rounded-md border-2 border-outline-variant bg-surface-lowest px-3 text-sm"
            />
            <button
              onClick={() => {
                const text = (draft[t.id] ?? "").trim();
                if (!text) return;
                replyTicket(t.id, "admin", text);
                setTicketStatus(t.id, "in_progress", user?.name ?? "admin");
                setDraft({ ...draft, [t.id]: "" });
              }}
              className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-on-primary"
              aria-label="Send reply"
            >
              <Icon name="send" />
            </button>
          </div>
        </Card>
      ))}
    </>
  );
}
