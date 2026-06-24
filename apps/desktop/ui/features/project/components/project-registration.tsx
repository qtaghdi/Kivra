import { FolderOpen, FolderPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useRegisterProject } from "@/features/project/hooks/use-projects";
import { selectProjectFolder } from "@/features/project/services/project-dialog-service";
import { Button } from "@/shared/ui/button";

export function ProjectRegistration() {
  const { t } = useTranslation();
  const [projectPath, setProjectPath] = useState("");
  const registerProject = useRegisterProject();
  const canUseNativeActions = isTauriRuntime();
  const [folderPickerError, setFolderPickerError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectPath.trim() || !canUseNativeActions) {
      return;
    }

    registerProject.mutate(projectPath.trim(), {
      onSuccess: () => setProjectPath("")
    });
  }

  async function handleSelectFolder() {
    setFolderPickerError(null);

    try {
      const selectedPath = await selectProjectFolder();

      if (selectedPath) {
        setProjectPath(selectedPath);
        registerProject.mutate(selectedPath, {
          onSuccess: () => setProjectPath("")
        });
      }
    } catch (error) {
      setFolderPickerError(
        error instanceof Error ? error.message : "PROJECT_FOLDER_SELECT_FAILED"
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={projectPath}
          onChange={(event) => setProjectPath(event.target.value)}
          placeholder={t("project.pathPlaceholder")}
          className="h-9 min-w-[360px] rounded-md border bg-white px-3 text-sm outline-none focus:border-primary disabled:bg-muted"
          disabled={!canUseNativeActions}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={registerProject.isPending || !canUseNativeActions}
          onClick={handleSelectFolder}
        >
          <FolderOpen className="h-4 w-4" />
          {t("project.browseFolder")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={registerProject.isPending || !canUseNativeActions}
        >
          <FolderPlus className="h-4 w-4" />
          {t("project.addProject")}
        </Button>
      </div>
      {!canUseNativeActions && (
        <p className="text-xs text-muted-foreground">
          {t("runtime.desktopRequiredDetail")}
        </p>
      )}
      {registerProject.error instanceof Error && (
        <p className="text-xs text-destructive">
          {registerProject.error.message === "DESKTOP_RUNTIME_REQUIRED"
            ? t("runtime.desktopRequired")
            : registerProject.error.message}
        </p>
      )}
      {folderPickerError && (
        <p className="text-xs text-destructive">
          {folderPickerError === "DESKTOP_RUNTIME_REQUIRED"
            ? t("runtime.desktopRequired")
            : folderPickerError}
        </p>
      )}
    </form>
  );
}
