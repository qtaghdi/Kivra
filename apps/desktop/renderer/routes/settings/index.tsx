import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleAlert,
  Code2,
  Download,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Trash2
} from "lucide-react";
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
      className="flex h-screen min-h-0 flex-col overflow-hidden"
    >
      <header className="shrink-0 border-b px-4 py-4">
        <h1 className="text-lg font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {t("settings.description")}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
        <section className="max-w-6xl space-y-3">
          <IntegrationRow
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
          <InfoNote icon={<ShieldCheck className="h-4 w-4" />} title={t("settings.shell.permissionTitle")}>
            {t("settings.shell.permissionDetail")}
          </InfoNote>
          </IntegrationRow>

          <IntegrationRow
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
          <InfoNote icon={<RefreshCw className="h-4 w-4" />} title={t("settings.jetbrains.restartTitle")}>
            {t("settings.jetbrains.restartDetail")}
          </InfoNote>
            <JetBrainsPluginList
              plugins={integrationStatus.data?.jetbrainsPlugins ?? []}
              installedLabel={t("settings.jetbrains.linked")}
              missingLabel={t("settings.jetbrains.missing")}
              emptyLabel={t("settings.jetbrains.emptyDetected")}
            />
          </IntegrationRow>

          <IntegrationRow
            icon={<Code2 className="h-5 w-5" />}
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
          <InfoNote icon={<RefreshCw className="h-4 w-4" />} title={t("settings.vscode.restartTitle")}>
            {t("settings.vscode.restartDetail")}
          </InfoNote>
          </IntegrationRow>
        </section>
      </div>
    </motion.div>
  );
};

type integrationRowProps = {
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

const IntegrationRow = ({
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
}: integrationRowProps) => (
  <article className="rounded-md border bg-card p-4">
    <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground">
        {icon}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            <StatusBadge isInstalled={isInstalled} label={statusLabel} />
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {children}
        {detail && (
          <code className="block overflow-hidden text-ellipsis whitespace-nowrap rounded-md border bg-background px-2.5 py-2 text-xs text-muted-foreground">
            {detail}
          </code>
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
      </div>

      <div className="flex w-[220px] flex-col items-stretch gap-2">
        <Button
          type="button"
          onClick={onInstall}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isPending ? installingLabel : buttonLabel}</span>
        </Button>
        {secondaryButtonLabel && onSecondaryAction && (
          <Button
            type="button"
            variant="danger"
          onClick={onSecondaryAction}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
            <Trash2 className="h-4 w-4" />
            <span>{secondaryButtonLabel}</span>
          </Button>
        )}
      </div>
    </div>
  </article>
);

const StatusBadge = ({
  isInstalled,
  label
}: {
  isInstalled: boolean;
  label: string;
}) => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
    {isInstalled ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
    )}
    {label}
  </span>
);

const InfoNote = ({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) => (
  <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted text-foreground">
      {icon}
    </div>
    <div>
      <div className="font-medium text-foreground">{title}</div>
      <p>{children}</p>
    </div>
  </div>
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
    return (
      <div className="rounded-md border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background text-xs">
      {plugins.map((plugin) => (
        <div
          key={plugin.path}
          className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0"
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
