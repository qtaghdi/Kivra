import { invokeCommand } from "@/core/tauri/tauri-client";

export type integrationInstallResult = {
  messageKey: string;
  paths: string[];
  restartRequired: boolean;
};

export type integrationStatus = {
  shellInstalled: boolean;
  shellIntegrationPath: string;
  jetbrainsInstalled: boolean;
  jetbrainsPartiallyInstalled: boolean;
  jetbrainsInstallPaths: string[];
  jetbrainsMissingInstallPaths: string[];
  jetbrainsPlugins: jetBrainsPluginStatus[];
  vscodeInstalled: boolean;
  vscodeCliPath: string | null;
};

export type jetBrainsPluginStatus = {
  displayName: string;
  path: string;
  installed: boolean;
};

export const getIntegrationStatus = () =>
  invokeCommand<integrationStatus>("get_integration_status");

export const installShellCapture = () =>
  invokeCommand<integrationInstallResult>("install_shell_capture");

export const uninstallShellCapture = () =>
  invokeCommand<integrationInstallResult>("uninstall_shell_capture");

export const installJetBrainsPlugin = () =>
  invokeCommand<integrationInstallResult>("install_jetbrains_plugin");

export const installMissingJetBrainsPlugins = () =>
  invokeCommand<integrationInstallResult>("install_missing_jetbrains_plugins");

export const installVsCodeExtension = () =>
  invokeCommand<integrationInstallResult>("install_vscode_extension");
