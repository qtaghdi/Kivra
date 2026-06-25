import { motion } from "framer-motion";
import { CheckCircle2, CircleAlert, PlugZap, RefreshCw, ShieldCheck, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useInstallJetBrainsPlugin,
  useInstallMissingJetBrainsPlugins,
  useInstallShellCapture,
  useInstallVsCodeExtension,
  useIntegrationStatus,
  useUninstallShellCapture,
  type integrationInstallResult,
  type jetBrainsPluginStatus
} from "@/features/settings";
import { Button } from "@/shared/ui/button";

export const SettingsRoute = () => {
  const { t } = useTranslation();
  const integrationStatus = useIntegrationStatus();
  const installShell = useInstallShellCapture();
  const uninstallShell = useUninstallShellCapture();
  const installJetBrains = useInstallJetBrainsPlugin();
  const installMissingJetBrains = useInstallMissingJetBrainsPlugins();
  const installVsCode = useInstallVsCodeExtension();
  const [shellAction, setShellAction] = useState<"install" | "uninstall" | null>(null);
  const [jetBrainsAction, setJetBrainsAction] = useState<"all" | "missing" | null>(null);
  const hasMissingJetBrainsPlugins = Boolean(
    integrationStatus.data?.jetbrainsMissingInstallPaths.length
  );
  const shellResult =
    shellAction === "install"
      ? installShell.data
      : shellAction === "uninstall"
        ? uninstallShell.data
        : undefined;
  const jetBrainsResult =
    jetBrainsAction === "all"
      ? installJetBrains.data
      : jetBrainsAction === "missing"
        ? installMissingJetBrains.data
        : undefined;
  const shellError =
    shellAction === "install" ? installShell.error : shellAction === "uninstall" ? uninstallShell.error : null;
  const jetBrainsError =
    jetBrainsAction === "all"
      ? installJetBrains.error
      : jetBrainsAction === "missing"
        ? installMissingJetBrains.error
        : null;
  const vscodeResult = installVsCode.data;
  const vscodeError = installVsCode.error;
  const handleInstallShell = () => {
    setShellAction("install");
    uninstallShell.reset();
    installShell.reset();
    installShell.mutate();
  };
  const handleUninstallShell = () => {
    setShellAction("uninstall");
    installShell.reset();
    uninstallShell.reset();
    uninstallShell.mutate();
  };
  const handleInstallJetBrains = () => {
    setJetBrainsAction("all");
    installMissingJetBrains.reset();
    installJetBrains.reset();
    installJetBrains.mutate();
  };
  const handleInstallMissingJetBrains = () => {
    setJetBrainsAction("missing");
    installJetBrains.reset();
    installMissingJetBrains.reset();
    installMissingJetBrains.mutate();
  };
  const handleInstallVsCode = () => {
    installVsCode.reset();
    installVsCode.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="flex h-screen flex-col overflow-auto p-4"
    >
      <header className="mb-4">
        <h1 className="text-lg font-semibold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
      </header>

      <section className="grid max-w-5xl grid-cols-2 gap-4">
        <IntegrationCard
          icon={<Terminal className="h-5 w-5" />}
          title={t("settings.shell.title")}
          description={t("settings.shell.description")}
          statusLabel={
            integrationStatus.data?.shellInstalled
              ? t("settings.installed")
              : t("settings.notInstalled")
          }
          detail={integrationStatus.data?.shellIntegrationPath}
          isInstalled={Boolean(integrationStatus.data?.shellInstalled)}
          isPending={installShell.isPending || uninstallShell.isPending}
          buttonLabel={
            integrationStatus.data?.shellInstalled
              ? t("settings.shell.reinstall")
              : t("settings.shell.install")
          }
          installingLabel={t("settings.installing")}
          onInstall={handleInstallShell}
          secondaryButtonLabel={
            integrationStatus.data?.shellInstalled
              ? t("settings.shell.uninstall")
              : undefined
          }
          onSecondaryAction={handleUninstallShell}
          result={shellResult}
          resultMessage={shellResult ? t(shellResult.messageKey) : undefined}
          error={shellError}
          errorFallback={t("settings.errorFallback")}
        >
          <div className="rounded-md border bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4" />
              {t("settings.shell.permissionTitle")}
            </div>
            <p>{t("settings.shell.permissionDetail")}</p>
          </div>
        </IntegrationCard>

        <IntegrationCard
          icon={<PlugZap className="h-5 w-5" />}
          title={t("settings.jetbrains.title")}
          description={t("settings.jetbrains.description")}
          statusLabel={
            integrationStatus.data?.jetbrainsInstalled
              ? t("settings.jetbrains.ready")
              : integrationStatus.data?.jetbrainsPartiallyInstalled
                ? t("settings.jetbrains.needsAttention")
              : t("settings.jetbrains.notLinked")
          }
          isInstalled={Boolean(integrationStatus.data?.jetbrainsInstalled)}
          isPending={installJetBrains.isPending || installMissingJetBrains.isPending}
          buttonLabel={
            integrationStatus.data?.jetbrainsInstalled || integrationStatus.data?.jetbrainsPartiallyInstalled
              ? t("settings.jetbrains.reinstall")
              : t("settings.jetbrains.install")
          }
          installingLabel={t("settings.installing")}
          onInstall={handleInstallJetBrains}
          secondaryButtonLabel={
            hasMissingJetBrainsPlugins
              ? t("settings.jetbrains.installMissing")
              : undefined
          }
          onSecondaryAction={handleInstallMissingJetBrains}
          result={jetBrainsResult}
          resultMessage={jetBrainsResult ? t(jetBrainsResult.messageKey) : undefined}
          error={jetBrainsError}
          errorFallback={t("settings.errorFallback")}
        >
          <div className="rounded-md border bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <RefreshCw className="h-4 w-4" />
              {t("settings.jetbrains.restartTitle")}
            </div>
            <p>{t("settings.jetbrains.restartDetail")}</p>
            <JetBrainsPluginList
              plugins={integrationStatus.data?.jetbrainsPlugins ?? []}
              installedLabel={t("settings.jetbrains.linked")}
              missingLabel={t("settings.jetbrains.missing")}
              emptyLabel={t("settings.jetbrains.emptyDetected")}
            />
          </div>
        </IntegrationCard>

        <IntegrationCard
          icon={<PlugZap className="h-5 w-5" />}
          title={t("settings.vscode.title")}
          description={t("settings.vscode.description")}
          statusLabel={
            integrationStatus.data?.vscodeInstalled
              ? t("settings.vscode.ready")
              : integrationStatus.data?.vscodeCliPath
                ? t("settings.vscode.notLinked")
                : t("settings.vscode.cliMissing")
          }
          detail={integrationStatus.data?.vscodeCliPath ?? undefined}
          isInstalled={Boolean(integrationStatus.data?.vscodeInstalled)}
          isPending={installVsCode.isPending}
          buttonLabel={
            integrationStatus.data?.vscodeInstalled
              ? t("settings.vscode.reinstall")
              : t("settings.vscode.install")
          }
          installingLabel={t("settings.installing")}
          onInstall={handleInstallVsCode}
          result={vscodeResult}
          resultMessage={vscodeResult ? t(vscodeResult.messageKey) : undefined}
          error={vscodeError}
          errorFallback={t("settings.errorFallback")}
        >
          <div className="rounded-md border bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <RefreshCw className="h-4 w-4" />
              {t("settings.vscode.restartTitle")}
            </div>
            <p>{t("settings.vscode.restartDetail")}</p>
          </div>
        </IntegrationCard>
      </section>
    </motion.div>
  );
};

type integrationCardProps = {
  buttonLabel: string;
  children: ReactNode;
  description: string;
  detail?: string;
  error: Error | null;
  icon: ReactNode;
  installingLabel: string;
  isInstalled: boolean;
  isPending: boolean;
  onInstall: () => void;
  onSecondaryAction?: () => void;
  result?: integrationInstallResult;
  resultMessage?: string;
  errorFallback: string;
  secondaryButtonLabel?: string;
  statusLabel: string;
  title: string;
};

const IntegrationCard = ({
  buttonLabel,
  children,
  description,
  detail,
  error,
  icon,
  installingLabel,
  isInstalled,
  isPending,
  onInstall,
  onSecondaryAction,
  result,
  resultMessage,
  errorFallback,
  secondaryButtonLabel,
  statusLabel,
  title
}: integrationCardProps) => (
  <article className="rounded-md border bg-card p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs">
        {isInstalled && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        {statusLabel}
      </span>
    </div>

    <div className="mt-4 space-y-3">
      {children}
      {detail && (
        <pre className="max-h-28 overflow-auto rounded-md border bg-background p-3 text-xs text-muted-foreground">
          {detail}
        </pre>
      )}
      {result && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700">
          {resultMessage}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error.message || errorFallback}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onInstall} disabled={isPending}>
          {isPending ? installingLabel : buttonLabel}
        </Button>
        {secondaryButtonLabel && onSecondaryAction && (
          <Button
            type="button"
            variant="danger"
            onClick={onSecondaryAction}
            disabled={isPending}
          >
            {secondaryButtonLabel}
          </Button>
        )}
      </div>
    </div>
  </article>
);

const JetBrainsPluginList = ({
  emptyLabel,
  installedLabel,
  missingLabel,
  plugins
}: {
  emptyLabel: string;
  installedLabel: string;
  missingLabel: string;
  plugins: jetBrainsPluginStatus[];
}) => {
  if (!plugins.length) {
    return <p className="mt-3 text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-3 space-y-1.5">
      {plugins.map((plugin) => (
        <div
          key={plugin.path}
          className="flex items-center justify-between gap-3 rounded-md border bg-background px-2.5 py-2"
        >
          <span className="min-w-0 truncate font-medium text-foreground">
            {plugin.displayName}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            {plugin.installed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
            )}
            {plugin.installed ? installedLabel : missingLabel}
          </span>
        </div>
      ))}
    </div>
  );
};
