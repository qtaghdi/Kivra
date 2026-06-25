import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, FolderGit2, GitBranch, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { KnowledgeList, ProjectMemo, ResolutionNotes } from "@/features/docs";
import { getResolvedErrorIds } from "@/features/docs/services/note-service";
import { ErrorTable, type detectedError } from "@/features/error";
import {
  ProjectExplorer,
  ProjectFileViewer,
  useConnectGithubProjectToLocalFolder,
  useDeleteProject,
  useGithubProjectBranches,
  useProject,
  useSwitchGithubProjectBranch
} from "@/features/project";
import { readProjectDirectory } from "@/features/project/services/project-directory-service";
import { selectProjectFolder } from "@/features/project/services/project-dialog-service";
import { useProjectStore } from "@/features/project/stores/project-store";
import {
  CommandRunner,
  RunHistoryTable,
  RunLogPanel,
  useRunHistory
} from "@/features/run";
import type { runResult } from "@/features/run";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Select, type selectOption } from "@/shared/ui/select";

type projectTab = "explorer" | "runs" | "errors" | "knowledge" | "settings";

const tabs: projectTab[] = ["explorer", "runs", "errors", "knowledge", "settings"];

export const ProjectRoute = () => {
  const { t } = useTranslation();
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const search = useSearch({ from: "/projects/$projectId" });
  const navigate = useNavigate({ from: "/projects/$projectId" });
  const project = useProject(projectId);
  const connectLocalFolder = useConnectGithubProjectToLocalFolder();
  const deleteProject = useDeleteProject();
  const switchGithubBranch = useSwitchGithubProjectBranch();
  const setSelectedProjectId = useProjectStore((store) => store.setSelectedProjectId);
  const activeTab = search.tab;
  const { runs, addRun } = useRunHistory(
    projectId,
    project.data?.source === "local" ? project.data.path : null
  );
  const [selectedRun, setSelectedRun] = useState<runResult | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<detectedError | null>(null);
  const [notesVersion, setNotesVersion] = useState(0);
  const errors = useMemo<detectedError[]>(
    () => runs.flatMap((run) => run.errors),
    [runs]
  );
  const resolvedErrorIds = useMemo(
    () => getResolvedErrorIds(projectId),
    [projectId, notesVersion]
  );
  const isGithubProject = project.data?.source === "github";
  const githubBranches = useGithubProjectBranches({
    enabled: Boolean(isGithubProject),
    projectId
  });

  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId, setSelectedProjectId]);

  useEffect(() => {
    setSelectedRun((currentRun) => {
      if (!currentRun) {
        return runs[0] ?? null;
      }

      return runs.find((run) => run.id === currentRun.id) ?? runs[0] ?? null;
    });
  }, [runs]);

  useEffect(() => {
    setSelectedError(errors[0] ?? null);
  }, [errors]);

  const handleTabChange = (tab: projectTab) => {
    void navigate({ search: { tab } });
  };

  const handleConnectLocalFolder = async () => {
    const selectedPath = await selectProjectFolder();

    if (!selectedPath) {
      return;
    }

    connectLocalFolder.mutate({
      projectId,
      projectPath: selectedPath
    });
  };

  const handleBranchChange = (branch: string) => {
    if (!branch || branch === project.data?.branch) {
      return;
    }

    setSelectedFilePath(null);
    switchGithubBranch.mutate({
      branch,
      projectId
    });
  };

  const handleDeleteProject = () => {
    if (!project.data) {
      return;
    }

    const shouldDelete = window.confirm(
      t("project.deleteConfirm", { name: project.data.name })
    );

    if (!shouldDelete) {
      return;
    }

    deleteProject.mutate(project.data.id, {
      onSuccess: () => {
        void navigate({ to: "/", search: {} });
      }
    });
  };

  if (project.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">{t("project.loading")}</div>;
  }

  if (!project.data) {
    return <div className="p-6 text-sm text-muted-foreground">{t("project.notFound")}</div>;
  }

  const projectData = project.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-screen flex-col overflow-hidden"
    >
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{projectData.name}</h1>
            <p className="font-mono text-xs text-muted-foreground">
              {projectData.path}
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <Metadata label={t("project.runtime")} value={projectData.runtime} />
            <Metadata label={t("project.framework")} value={projectData.framework} />
            <Metadata label={t("project.package")} value={projectData.packageManager} />
            {projectData.source === "github" ? (
              <BranchMetadata
                label={t("project.branch")}
                value={projectData.branch}
                isLoading={githubBranches.isLoading || switchGithubBranch.isPending}
                options={getBranchOptions({
                  currentBranch: projectData.branch,
                  branches: githubBranches.data ?? []
                })}
                onChange={handleBranchChange}
              />
            ) : (
              <Metadata label={t("project.branch")} value={projectData.branch} />
            )}
            <Metadata
              label={t("project.source")}
              value={
                projectData.source === "github"
                  ? t("project.githubSource")
                  : t("project.localSource")
              }
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex rounded-md border bg-background p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "h-7 rounded px-2 text-xs capitalize text-muted-foreground",
                  activeTab === tab && "bg-muted text-foreground"
                )}
                onClick={() => handleTabChange(tab)}
              >
                {t(`project.tabs.${tab}`)}
              </button>
            ))}
          </div>
          {projectData.source === "local" ? (
            <CommandRunner
              projectId={projectData.id}
              projectPath={projectData.path}
              onRunComplete={(result) => {
                addRun(result);
                setSelectedRun(result);
                void navigate({ search: { tab: "runs" } });
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "knowledge" ? "primary" : "secondary"}
                onClick={() => handleTabChange("knowledge")}
              >
                <BookOpenText className="h-4 w-4" />
                {t("project.openMemory")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={connectLocalFolder.isPending}
                onClick={() => void handleConnectLocalFolder()}
              >
                {connectLocalFolder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderGit2 className="h-4 w-4" />
                )}
                {t("project.connectLocalFolder")}
              </Button>
            </div>
          )}
        </div>
        {connectLocalFolder.error instanceof Error && (
          <p className="mt-2 text-xs text-destructive">
            {connectLocalFolder.error.message}
          </p>
        )}
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {projectData.source === "github" && (
          <section className="mb-3 shrink-0 rounded-md border bg-card p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpenText className="h-4 w-4" />
                  {t("project.githubMemoryTitle")}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("project.githubMemoryDetail")}
                </p>
              </div>
            </div>
            {switchGithubBranch.error instanceof Error && (
              <p className="mt-2 text-xs text-destructive">
                {switchGithubBranch.error.message}
              </p>
            )}
          </section>
        )}
        <div className="mb-3 shrink-0 rounded-md border bg-card px-3 py-2">
          <div className="text-xs font-medium">
            {t(`project.tabs.${activeTab}`)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t(`project.tabDescriptions.${activeTab}`)}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-0 flex-1"
          >
            {activeTab === "explorer" && (
              <div className="grid h-full min-h-0 grid-cols-[minmax(280px,360px)_1fr] gap-4">
                <ProjectExplorer
                  tree={projectData.tree}
                  selectedFilePath={selectedFilePath}
                  onLoadDirectory={
                    projectData.source === "local"
                      ? (directoryPath) =>
                          readProjectDirectory({
                            directoryPath,
                            projectPath: projectData.path
                          })
                      : undefined
                  }
                  onSelectFile={setSelectedFilePath}
                />
                <ProjectFileViewer
                  filePath={selectedFilePath}
                  project={projectData}
                />
              </div>
            )}
            {activeTab === "runs" && (
              <div className="grid gap-4">
                <RunHistoryTable
                  runs={runs}
                  selectedRun={selectedRun}
                  onSelectRun={setSelectedRun}
                />
                <RunLogPanel run={selectedRun} />
              </div>
            )}
            {activeTab === "errors" && (
              <div className="grid gap-4">
                <ErrorTable
                  errors={errors}
                  resolvedErrorIds={resolvedErrorIds}
                  selectedError={selectedError}
                  onSelectError={setSelectedError}
                />
                <ResolutionNotes
                  error={selectedError}
                  onNoteSaved={() =>
                    setNotesVersion((currentVersion) => currentVersion + 1)
                  }
                  projectId={projectData.id}
                />
              </div>
            )}
            {activeTab === "knowledge" && (
              <div className="grid gap-4">
                <ProjectMemo
                  onMemoSaved={() =>
                    setNotesVersion((currentVersion) => currentVersion + 1)
                  }
                  projectId={projectData.id}
                />
                <KnowledgeList
                  errors={errors}
                  refreshKey={notesVersion}
                  projectId={projectData.id}
                />
              </div>
            )}
            {activeTab === "settings" && (
              <div className="space-y-3">
                <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
                  {t("project.settingsMessage")}
                </div>
                <div className="rounded-md border border-destructive/30 bg-card p-4">
                  <div className="text-sm font-medium text-destructive">
                    {t("project.deleteProject")}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("project.deleteProjectDetail")}
                  </p>
                  <Button
                    type="button"
                    className="mt-3"
                    variant="danger"
                    disabled={deleteProject.isPending}
                    onClick={handleDeleteProject}
                  >
                    {deleteProject.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t("project.deleteProject")}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.div>
  );
};

type metadataProps = {
  label: string;
  value: string;
};

type branchMetadataProps = {
  isLoading: boolean;
  label: string;
  onChange: (branch: string) => void;
  options: selectOption[];
  value: string;
};

const BranchMetadata = ({
  isLoading,
  label,
  onChange,
  options,
  value
}: branchMetadataProps) => {
  return (
    <div className="min-w-[110px] rounded-md border bg-background px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <Select
        aria-label={label}
        value={value}
        options={options}
        icon={<GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />}
        isLoading={isLoading}
        size="sm"
        className="mt-1 h-7 w-full border-transparent bg-muted px-2"
        selectClassName="font-mono"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

const Metadata = ({ label, value }: metadataProps) => {
  return (
    <div className="min-w-[110px] rounded-md border bg-background px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-mono">{value}</div>
    </div>
  );
};

const getBranchOptions = ({
  branches,
  currentBranch
}: {
  branches: Array<{ name: string }>;
  currentBranch: string;
}): selectOption[] => {
  const branchNames = new Set([currentBranch, ...branches.map((branch) => branch.name)]);

  return Array.from(branchNames).map((branchName) => ({
    label: branchName,
    value: branchName
  }));
};
