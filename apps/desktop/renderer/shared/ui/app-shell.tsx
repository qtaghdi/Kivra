import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Box, Database, LogOut, User } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useAuthUser, useSignOut } from "@/features/auth";
import { useProjectStore } from "@/features/project/stores/project-store";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

type appShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: appShellProps) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const signOut = useSignOut();
  const selectedProjectId = useProjectStore((store) => store.selectedProjectId);

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex min-h-screen flex-col border-r bg-card"
      >
        <div className="border-b px-4 py-3">
          <Logo size="sm" showTagline />
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <Link
            to="/"
            className="group relative flex h-8 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <Box className="h-4 w-4" />
            {t("nav.dashboard")}
          </Link>
          <NavProjectLink
            projectId={selectedProjectId}
            search={{ tab: "explorer" }}
            title={!selectedProjectId ? t("nav.openProjectFirst") : undefined}
          >
            <Database className="h-4 w-4" />
            {t("nav.currentProject")}
          </NavProjectLink>
        </nav>
        <div className="border-t p-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
              title={authUser.data?.username ?? t("auth.profile")}
            >
              {authUser.data?.avatarUrl ? (
                <img
                  src={authUser.data.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-md"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-background">
                  <User className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {authUser.data?.username ?? t("auth.profile")}
                </span>
              </span>
            </button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={t("auth.signOut")}
              aria-label={t("auth.signOut")}
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
};

type navProjectLinkProps = {
  children: ReactNode;
  projectId: string | null;
  search: { tab: projectTab };
  title?: string;
};

type projectTab = "explorer" | "runs" | "errors" | "knowledge" | "settings";

const NavProjectLink = ({
  children,
  projectId,
  search,
  title
}: navProjectLinkProps) => {
  if (!projectId) {
    return (
      <div
        title={title}
        className="flex h-8 cursor-not-allowed items-center gap-2 rounded-md px-2 text-sm text-muted-foreground"
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
      className="flex h-8 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted"
      activeProps={{ className: "bg-muted font-medium" }}
    >
      {children}
    </Link>
  );
};
