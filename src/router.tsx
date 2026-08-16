import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Warm the next screen as soon as a link is hovered/touched so taps feel instant.
    defaultPreload: "intent",
    defaultPreloadDelay: 20,
    defaultPreloadStaleTime: 30_000,
    // Avoid a pending flash on screens that resolve immediately.
    defaultPendingMs: 400,
    defaultPendingMinMs: 200,
  });

  return router;
};
