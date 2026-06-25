import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Box, FolderOpen, LogOut, RefreshCw, Settings, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  type appLanguage,
  useSettingsStore
} from "@/core/settings/settings-store";
import { supabase } from "@/core/supabase/supabase-client";
import { useAuthUser, useSignOut } from "@/features/auth";
import { useProjects } from "@/features/project";
import { useProjectStore } from "@/features/project/stores/project-store";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";
import { Select, type selectOption } from "@/shared/ui/select";

type appShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: appShellProps) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const signOut = useSignOut();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const language = useSettingsStore((store) => store.language);
  const setLanguage = useSettingsStore((store) => store.setLanguage);
  const selectedProjectId = useProjectStore((store) => store.selectedProjectId);
  const projects = useProjects();
  const selectedProject =
    projects.data?.find((project) => project.id === selectedProjectId) ?? null;

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
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedProject?.name ?? t("nav.selectProject")}
            </span>
          </NavProjectLink>
          <Link
            to="/settings"
            className="group relative flex h-8 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <Settings className="h-4 w-4" />
            {t("nav.settings")}
          </Link>
        </nav>
        <div className="border-t p-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition hover:bg-muted"
              title={authUser.data?.username ?? t("auth.profile")}
              onClick={() => setIsProfileOpen(true)}
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
      {isProfileOpen && (
        <ProfileModal
          projectCount={projects.data?.length ?? 0}
          username={authUser.data?.username ?? t("auth.profile")}
          avatarUrl={authUser.data?.avatarUrl ?? null}
          isRefreshing={authUser.isFetching || projects.isFetching}
          isSigningOut={signOut.isPending}
          language={language}
          onClose={() => setIsProfileOpen(false)}
          onLanguageChange={setLanguage}
          onRefresh={() => {
            void authUser.refetch();
            void projects.refetch();
          }}
          onSignOut={() => signOut.mutate()}
        />
      )}
    </div>
  );
};

type profileModalProps = {
  avatarUrl: string | null;
  isRefreshing: boolean;
  isSigningOut: boolean;
  language: appLanguage;
  onClose: () => void;
  onLanguageChange: (language: appLanguage) => void;
  onRefresh: () => void;
  onSignOut: () => void;
  projectCount: number;
  username: string;
};

const ProfileModal = ({
  avatarUrl,
  isRefreshing,
  isSigningOut,
  language,
  onClose,
  onLanguageChange,
  onRefresh,
  onSignOut,
  projectCount,
  username
}: profileModalProps) => {
  const { t } = useTranslation();
  const languageOptions = getLanguageOptions(t);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="button"
      tabIndex={-1}
      className="fixed inset-0 z-50 grid cursor-default place-items-center bg-background/70 p-4 text-left backdrop-blur-sm"
      aria-label={t("profile.close")}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="w-full max-w-sm overflow-hidden rounded-md border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-semibold">{t("profile.title")}</div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t("profile.close")}
            title={t("profile.close")}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-12 w-12 rounded-md" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-md border bg-background">
                <User className="h-5 w-5 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{username}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {supabase ? t("profile.syncEnabled") : t("profile.localOnly")}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-md border bg-background px-3 py-2">
            <div className="text-xs text-muted-foreground">
              {t("profile.projects")}
            </div>
            <div className="mt-1 font-mono text-sm">
              {projectCount.toLocaleString()}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <ProfileSelect
              label={t("profile.language")}
              value={language}
              options={languageOptions}
              onChange={(value) => onLanguageChange(value as appLanguage)}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
              {t("profile.refreshNow")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSigningOut}
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              {t("auth.signOut")}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileSelect = ({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: selectOption[];
  value: string;
}) => (
  <label className="grid grid-cols-[1fr_160px] items-center gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <Select
      size="sm"
      value={value}
      options={options}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const getLanguageOptions = (
  t: ReturnType<typeof useTranslation>["t"]
): selectOption[] => [
  { label: t("profile.languageSystem"), value: "system" },
  { label: "English", value: "en" },
  { label: "한국어", value: "ko" }
];

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
