import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Box, Database, Github, History, SearchCode } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useProjectStore } from "@/features/project/stores/project-store";
import { cn } from "@/shared/lib/utils";

type appShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: appShellProps) {
  const { t } = useTranslation();
  const selectedProjectId = useProjectStore((store) => store.selectedProjectId);

  return (
    <div className="grid min-h-screen grid-cols-[252px_1fr]">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="border-r bg-white"
      >
        <div className="border-b px-5 py-4">
          <div className="text-lg font-semibold">Kivra</div>
          <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
        </div>
        <nav className="space-y-1 p-3">
          <Link
            to="/"
            className="group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <Box className="h-4 w-4" />
            {t("nav.dashboard")}
          </Link>
          <Link
            to="/login"
            className="group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <Github className="h-4 w-4" />
            {t("nav.login")}
          </Link>
          <NavProjectLink
            projectId={selectedProjectId}
            search={{ tab: "runs" }}
            title={!selectedProjectId ? t("nav.openProjectFirst") : undefined}
          >
            <History className="h-4 w-4" />
            {t("nav.runs")}
          </NavProjectLink>
          <NavProjectLink
            projectId={selectedProjectId}
            search={{ tab: "knowledge" }}
            title={!selectedProjectId ? t("nav.openProjectFirst") : undefined}
          >
            <SearchCode className="h-4 w-4" />
            {t("nav.knowledge")}
          </NavProjectLink>
          <NavProjectLink
            projectId={selectedProjectId}
            search={{ tab: "explorer" }}
            title={!selectedProjectId ? t("nav.openProjectFirst") : undefined}
          >
            <Database className="h-4 w-4" />
            {t("nav.localMemory")}
          </NavProjectLink>
        </nav>
      </motion.aside>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="overflow-hidden"
      >
        {children}
      </motion.main>
    </div>
  );
}

type navProjectLinkProps = {
  children: ReactNode;
  projectId: string | null;
  search: { tab: projectTab };
  title?: string;
};

type projectTab = "explorer" | "runs" | "errors" | "knowledge" | "settings";

function NavProjectLink({
  children,
  projectId,
  search,
  title
}: navProjectLinkProps) {
  if (!projectId) {
    return (
      <div
        title={title}
        className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground"
      >
        {children}
      </div>
    );
  }

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId }}
      search={search}
      title={title}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted"
      activeProps={{ className: "bg-muted font-medium" }}
    >
      {children}
    </Link>
  );
}
