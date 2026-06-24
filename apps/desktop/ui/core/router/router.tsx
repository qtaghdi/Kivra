import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet
} from "@tanstack/react-router";

import { AppShell } from "@/shared/ui/app-shell";
import { DashboardRoute } from "@/routes/index";
import { LoginRoute } from "@/routes/login/index";
import { ProjectRoute } from "@/routes/projects/$project-id/index";

const projectTabs = ["explorer", "runs", "errors", "knowledge", "settings"] as const;

type projectTab = (typeof projectTabs)[number];

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  )
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardRoute
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRoute
});

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  validateSearch: (search: Record<string, unknown>): { tab: projectTab } => ({
    tab: projectTabs.includes(search.tab as projectTab)
      ? (search.tab as projectTab)
      : "explorer"
  }),
  component: ProjectRoute
});

const routeTree = rootRoute.addChildren([dashboardRoute, loginRoute, projectRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
