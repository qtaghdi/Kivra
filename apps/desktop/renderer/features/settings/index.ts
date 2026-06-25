export {
  useInstallJetBrainsPlugin,
  useInstallMissingJetBrainsPlugins,
  useInstallShellCapture,
  useInstallVsCodeExtension,
  useIntegrationStatus,
  useUninstallShellCapture
} from "@/features/settings/hooks/use-integrations";
export type {
  integrationInstallResult,
  integrationStatus,
  jetBrainsPluginStatus
} from "@/features/settings/services/integration-service";
