import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getIntegrationStatus,
  installJetBrainsPlugin,
  installMissingJetBrainsPlugins,
  installShellCapture,
  installVsCodeExtension,
  uninstallShellCapture
} from "@/features/settings/services/integration-service";

const integrationStatusQueryKey = ["integrations"];

export const useIntegrationStatus = () =>
  useQuery({
    queryKey: integrationStatusQueryKey,
    queryFn: getIntegrationStatus
  });

export const useInstallShellCapture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: installShellCapture,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationStatusQueryKey });
    }
  });
};

export const useInstallJetBrainsPlugin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: installJetBrainsPlugin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationStatusQueryKey });
    }
  });
};

export const useInstallMissingJetBrainsPlugins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: installMissingJetBrainsPlugins,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationStatusQueryKey });
    }
  });
};

export const useInstallVsCodeExtension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: installVsCodeExtension,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationStatusQueryKey });
    }
  });
};

export const useUninstallShellCapture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uninstallShellCapture,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: integrationStatusQueryKey });
    }
  });
};
