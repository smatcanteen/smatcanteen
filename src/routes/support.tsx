import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Icon } from "@/components/Icon";
import { Card, Field, PrimaryButton, SectionTitle } from "@/components/ui-kit";
import { useAuth } from "@/lib/auth";
import { fmtDate, usePlatform } from "@/lib/platform";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Help & Feedback — SmartCanteen" },
      {
        name: "description",
        content: "Message the SmartCanteen support team straight from your cash book and follow the reply thread.",
      },
      { property: "og:title", content: "Help & Feedback — SmartCanteen" },
      { property: "og:description", content: "Stuck? Send a message and get a recorded answer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { user } = useAuth();
  const { s, openTicket, replyTicket } = usePlatform();
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});

  const mine = useMemo(() => s.tickets.filter((t) => t.accountId === user?.id), [s.tickets, user]);

  return (
    <AppLayout title="Help & feedback" back>
      <Card className="space-y-sm">
        <SectionTitle>Send a message to support</SectionTitle>
        <Field label="Subject" placeholder="What is happening?" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label className="block text-sm font-bold text-on-surface-variant">
          Message
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full rounded-md border-2 border-outline-variant bg-surface-lowest p-3 text-sm font-normal text-on-surface"
          />
        </label>
        <PrimaryButton
          onClick={() => {
            if (!subject.trim() || !text.trim() || !user) return;
            openTicket(user.id, user.name, subject.trim(), text.trim());
            setSubject("");
            setText("");
          }}
        >
          <Icon name="send" /> Send to admin
        </PrimaryButton>
      </Card>

      <SectionTitle>Your conversations</SectionTitle>
      {mine.length === 0 ? <Card>No messages yet.</Card> : null}
      {mine.map((t) => (
        <Card key={t.id} className="space-y-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-bold text-on-surface">{t.subject}</p>
            <span className="text-xs font-semibold text-on-surface-variant">{t.status.replace("_", " ")}</span>
          </div>
          {t.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-md p-2 text-sm ${
                m.from === "operator" ? "ml-auto bg-primary text-on-primary" : "bg-surface-lowest text-on-surface"
              }`}
            >
              {m.text}
              <span className="mt-0.5 block text-[10px] opacity-70">{fmtDate(m.ts)}</span>
            </div>
          ))}
          {t.status !== "resolved" ? (
            <div className="flex gap-2">
              <input
                aria-label="Reply"
                value={reply[t.id] ?? ""}
                onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })}
                placeholder="Add to this conversation…"
                className="h-12 flex-1 rounded-md border-2 border-outline-variant bg-surface-lowest px-3 text-sm"
              />
              <button
                onClick={() => {
                  const v = (reply[t.id] ?? "").trim();
                  if (!v) return;
                  replyTicket(t.id, "operator", v);
                  setReply({ ...reply, [t.id]: "" });
                }}
                aria-label="Send message"
                className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-on-primary"
              >
                <Icon name="send" />
              </button>
            </div>
          ) : null}
        </Card>
      ))}
    </AppLayout>
  );
}
