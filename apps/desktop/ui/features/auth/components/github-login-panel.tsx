import { Github, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { hasSupabaseConfig } from "@/core/config/env";
import {
  useAuthUser,
  useGithubLogin,
  useSignOut
} from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";

export function GithubLoginPanel() {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const githubLogin = useGithubLogin();
  const signOut = useSignOut();
  const isConfigured = hasSupabaseConfig();

  if (!isConfigured) {
    return (
      <div className="rounded-md border bg-white p-6">
        <div className="text-sm font-medium">{t("auth.configRequired")}</div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.configRequiredDetail")}
        </p>
      </div>
    );
  }

  if (authUser.data) {
    return (
      <div className="rounded-md border bg-white p-6">
        <div className="flex items-center gap-3">
          {authUser.data.avatarUrl && (
            <img
              src={authUser.data.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          )}
          <div>
            <div className="text-sm font-medium">{authUser.data.username}</div>
            <div className="text-xs text-muted-foreground">{t("auth.signedIn")}</div>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          <LogOut className="h-4 w-4" />
          {t("auth.signOut")}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white p-6">
      <div className="text-sm font-medium">{t("auth.title")}</div>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.description")}</p>
      <Button
        type="button"
        variant="primary"
        className="mt-4"
        onClick={() => githubLogin.mutate()}
        disabled={githubLogin.isPending}
      >
        <Github className="h-4 w-4" />
        {t("auth.githubLogin")}
      </Button>
      {githubLogin.error instanceof Error && (
        <p className="mt-3 text-xs text-destructive">
          {githubLogin.error.message === "SUPABASE_CONFIG_REQUIRED"
            ? t("auth.configRequired")
            : githubLogin.error.message}
        </p>
      )}
    </div>
  );
}
