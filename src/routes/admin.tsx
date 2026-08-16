import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin Console — SmartCanteen" },
      {
        name: "description",
        content:
          "Run the SmartCanteen portfolio: subscriptions, onboarding funnel, field agents, commissions, support tickets and broadcasts.",
      },
      { property: "og:title", content: "Super Admin Console — SmartCanteen" },
      { property: "og:description", content: "One console for a thousand canteen accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
