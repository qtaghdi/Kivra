import { Loader2, Play } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useRunCommand } from "@/features/run/hooks/use-run-command";
import type { runResult } from "@/features/run/types/run";
import { Button } from "@/shared/ui/button";

type commandRunnerProps = {
  projectId: string;
  projectPath: string;
  onRunError?: () => void;
  onRunUpdate?: (result: runResult) => void;
  onRunComplete: (result: runResult) => void;
};

export const CommandRunner = ({
  projectId,
  projectPath,
  onRunError,
  onRunUpdate,
  onRunComplete
}: commandRunnerProps) => {
  const { t } = useTranslation();
  const [command, setCommand] = useState("pnpm build");
  const runCommand = useRunCommand();
  const canUseNativeActions = isTauriRuntime();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!command.trim() || !canUseNativeActions) {
      return;
    }

    runCommand.mutate(
      {
        projectId,
        projectPath,
        command: command.trim(),
        onUpdate: onRunUpdate
      },
      {
        onSuccess: onRunComplete,
        onError: () => onRunError?.()
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          className="h-8 min-w-[360px] rounded-md border bg-background px-3 font-mono text-xs outline-none focus:border-foreground disabled:bg-muted"
          disabled={!canUseNativeActions || runCommand.isPending}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={runCommand.isPending || !canUseNativeActions}
        >
          {runCommand.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {runCommand.isPending ? t("runs.running") : t("runs.run")}
        </Button>
      </div>
      {runCommand.isPending && (
        <p className="font-mono text-xs text-muted-foreground">
          {command.trim()}
        </p>
      )}
      {!canUseNativeActions && (
        <p className="text-xs text-muted-foreground">
          {t("runtime.desktopRequiredDetail")}
        </p>
      )}
      {runCommand.error instanceof Error && (
        <p className="text-xs text-destructive">
          {runCommand.error.message === "DESKTOP_RUNTIME_REQUIRED"
            ? t("runtime.desktopRequired")
            : runCommand.error.message}
        </p>
      )}
    </form>
  );
};
