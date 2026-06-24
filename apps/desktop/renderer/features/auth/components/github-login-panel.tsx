import { Github, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { hasSupabaseConfig } from "@/core/config/env";
import {
  useAuthUser,
  useGithubLogin,
  useSignOut
} from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";

export const GithubLoginPanel = () => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const githubLogin = useGithubLogin();
  const signOut = useSignOut();
  const isConfigured = hasSupabaseConfig();
  const [loginStarted, setLoginStarted] = useState(false);
  const isLoginInProgress = loginStarted || githubLogin.isPending;

  const handleGithubLogin = () => {
    setLoginStarted(true);
    githubLogin.mutate(undefined, {
      onSuccess: () => {
        setLoginStarted(false);
      },
      onError: () => {
        setLoginStarted(false);
      }
    });
  };

  if (!isConfigured) {
    return (
      <div className="rounded-md border bg-card p-4">
        <div className="text-sm font-medium">{t("auth.configRequired")}</div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.configRequiredDetail")}
        </p>
      </div>
    );
  }

  if (authUser.isLoading) {
    return (
      <div className="rounded-md border bg-card p-4">
        <div className="text-sm font-medium">{t("auth.loading")}</div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.description")}
        </p>
      </div>
    );
  }

  if (authUser.data) {
    return (
      <div className="rounded-md border bg-card p-4">
        <div className="flex items-center gap-3">
          {authUser.data.avatarUrl && (
            <img
              src={authUser.data.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-md"
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
    <div className="rounded-md border bg-card p-4">
      <div className="text-sm font-medium">{t("auth.title")}</div>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.description")}</p>
      <Button
        type="button"
        variant="primary"
        className="mt-4"
        onClick={handleGithubLogin}
        disabled={isLoginInProgress}
      >
        {isLoginInProgress ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Github className="h-4 w-4" />
        )}
        {isLoginInProgress ? t("auth.githubLoginPending") : t("auth.githubLogin")}
      </Button>
      {isLoginInProgress && (
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            {t("auth.progressTitle")}
          </div>
          <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>{t("auth.progressPreparing")}</li>
            <li>{t("auth.progressGithub")}</li>
            <li>{t("auth.progressSession")}</li>
          </ol>
        </div>
      )}
      {githubLogin.error instanceof Error && (
        <p className="mt-3 text-xs text-destructive">
          {githubLogin.error.message === "SUPABASE_CONFIG_REQUIRED"
            ? t("auth.configRequired")
            : githubLogin.error.message}
        </p>
      )}
    </div>
  );
};
