import { Play } from "lucide-react";
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
  onRunComplete: (result: runResult) => void;
};

export function CommandRunner({
  projectId,
  projectPath,
  onRunComplete
}: commandRunnerProps) {
  const { t } = useTranslation();
  const [command, setCommand] = useState("pnpm build");
  const runCommand = useRunCommand();
  const canUseNativeActions = isTauriRuntime();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!command.trim() || !canUseNativeActions) {
      return;
    }

    runCommand.mutate(
      { projectId, projectPath, command: command.trim() },
      { onSuccess: onRunComplete }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          className="h-9 min-w-[360px] rounded-md border bg-white px-3 font-mono text-sm outline-none focus:border-primary disabled:bg-muted"
          disabled={!canUseNativeActions}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={runCommand.isPending || !canUseNativeActions}
        >
          <Play className="h-4 w-4" />
          {t("runs.run")}
        </Button>
      </div>
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
}
