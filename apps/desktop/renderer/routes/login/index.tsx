import { motion } from "framer-motion";
import { Github, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { hasSupabaseConfig } from "@/core/config/env";
import { useAuthUser, useGithubLogin } from "@/features/auth";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/ui/logo";

export const LoginRoute = () => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const githubLogin = useGithubLogin();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="grid min-h-screen grid-cols-[1fr_380px] bg-background"
    >
      <section className="flex min-h-screen flex-col justify-between border-r p-8">
        <Logo size="md" showTagline />

        <div className="max-w-2xl">
          <div className="font-mono text-xs uppercase text-muted-foreground">
            {t("auth.contextLabel")}
          </div>
          <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight">
            {t("auth.heroTitle")}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            {t("auth.heroDescription")}
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 overflow-hidden rounded-md border bg-card">
            <AuthPrinciple label="Build" detail={t("auth.buildDetail")} />
            <AuthPrinciple label="Fail" detail={t("auth.failDetail")} />
            <AuthPrinciple label="Remember" detail={t("auth.rememberDetail")} />
          </div>
        </div>

        <div className="font-mono text-xs text-muted-foreground">
          GitHub OAuth only
        </div>
      </section>

      <aside className="flex min-h-screen items-center p-6">
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-base font-semibold">{t("auth.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {authUser.data ? t("auth.redirecting") : t("auth.description")}
            </p>
          </div>
          <div className="rounded-md border bg-card p-4">
            {!isConfigured ? (
              <>
                <div className="text-sm font-medium">{t("auth.configRequired")}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("auth.configRequiredDetail")}
                </p>
              </>
            ) : authUser.isLoading ? (
              <>
                <div className="text-sm font-medium">{t("auth.loading")}</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("auth.description")}
                </p>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
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
                {isLoginInProgress && <LoginProgress />}
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("auth.oauthOnly")}
                </p>
                {githubLogin.error instanceof Error && (
                  <p className="mt-3 text-xs text-destructive">
                    {githubLogin.error.message === "SUPABASE_CONFIG_REQUIRED"
                      ? t("auth.configRequired")
                      : githubLogin.error.message}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </motion.div>
  );
};

const LoginProgress = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        {t("auth.progressTitle")}
      </div>
      <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
        <LoginProgressStep active>{t("auth.progressPreparing")}</LoginProgressStep>
        <LoginProgressStep>{t("auth.progressGithub")}</LoginProgressStep>
        <LoginProgressStep>{t("auth.progressSession")}</LoginProgressStep>
      </ol>
    </div>
  );
};

type loginProgressStepProps = {
  active?: boolean;
  children: string;
};

const LoginProgressStep = ({
  active = false,
  children
}: loginProgressStepProps) => {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-primary" : "bg-muted-foreground/40"
        }`}
      />
      {children}
    </li>
  );
};

type authPrincipleProps = {
  detail: string;
  label: string;
};

const AuthPrinciple = ({ detail, label }: authPrincipleProps) => {
  return (
    <div className="border-r p-3 last:border-r-0">
      <div className="font-mono text-xs text-foreground">{label}</div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</div>
    </div>
  );
};
