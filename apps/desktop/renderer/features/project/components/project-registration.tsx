import { FolderOpen, FolderPlus, Github, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useGithubRepositories } from "@/features/project/hooks/use-github-repositories";
import {
  useImportGithubProject,
  useRegisterProject
} from "@/features/project/hooks/use-projects";
import { selectProjectFolder } from "@/features/project/services/project-dialog-service";
import type { githubRepository } from "@/features/project/services/github-project-service";
import { Button } from "@/shared/ui/button";

export function ProjectRegistration() {
  const { t } = useTranslation();
  const [projectPath, setProjectPath] = useState("");
  const registerProject = useRegisterProject();
  const importGithubProject = useImportGithubProject();
  const githubRepositories = useGithubRepositories();
  const canUseNativeActions = isTauriRuntime();
  const [folderPickerError, setFolderPickerError] = useState<string | null>(null);
  const [showGithubRepos, setShowGithubRepos] = useState(false);

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

  async function handleLoadGithubRepos() {
    setShowGithubRepos(true);
    await githubRepositories.refetch();
  }

  function handleImportGithubProject(repo: githubRepository) {
    importGithubProject.mutate(repo);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={projectPath}
          onChange={(event) => setProjectPath(event.target.value)}
          placeholder={t("project.pathPlaceholder")}
          className="h-8 min-w-[360px] rounded-md border bg-background px-3 font-mono text-xs outline-none focus:border-foreground disabled:bg-muted"
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
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={githubRepositories.isFetching}
          onClick={handleLoadGithubRepos}
        >
          {githubRepositories.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Github className="h-4 w-4" />
          )}
          {t("project.loadGithubProjects")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("project.githubImportDetail")}
        </p>
      </div>
      {showGithubRepos && (
        <div className="max-h-72 overflow-auto rounded-md border bg-card">
          {githubRepositories.isFetching && (
            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("project.loadingGithubProjects")}
            </div>
          )}
          {githubRepositories.error instanceof Error && (
            <p className="p-3 text-xs text-destructive">
              {githubRepositories.error.message === "GITHUB_TOKEN_REQUIRED"
                ? t("project.githubTokenRequired")
                : githubRepositories.error.message}
            </p>
          )}
          {!githubRepositories.isFetching &&
            githubRepositories.data?.map((repo) => (
              <button
                key={repo.id}
                type="button"
                className="flex w-full items-center justify-between gap-4 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted"
                disabled={importGithubProject.isPending}
                onClick={() => handleImportGithubProject(repo)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Github className="h-4 w-4 shrink-0" />
                    <span className="truncate">{repo.fullName}</span>
                    {repo.private && (
                      <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        private
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {repo.description ?? repo.htmlUrl}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
                  <div>{repo.defaultBranch}</div>
                  <div>{repo.language ?? "repo"}</div>
                </div>
              </button>
            ))}
          {!githubRepositories.isFetching && githubRepositories.data?.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">
              {t("project.githubProjectsEmpty")}
            </p>
          )}
        </div>
      )}
      {importGithubProject.error instanceof Error && (
        <p className="text-xs text-destructive">
          {importGithubProject.error.message}
        </p>
      )}
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
