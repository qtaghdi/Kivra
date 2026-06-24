import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { hasSupabaseConfig } from "@/core/config/env";
import { LoginRoute } from "@/routes/login";
import { useAuthUser } from "@/features/auth/hooks/use-auth";

type authGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: authGateProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isConfigured = hasSupabaseConfig();
  const isLoginRoute = location.pathname === "/login";

  useEffect(() => {
    if (!authUser.data || !isLoginRoute) {
      return;
    }

    void navigate({ to: "/" });
  }, [authUser.data, isLoginRoute, navigate]);

  if (isConfigured && authUser.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        {t("auth.loading")}
      </div>
    );
  }

  if (!authUser.data) {
    return <LoginRoute />;
  }

  return children;
}
