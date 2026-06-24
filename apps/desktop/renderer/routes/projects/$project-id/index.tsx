import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { KnowledgeList, ResolutionNotes } from "@/features/docs";
import { getResolvedErrorIds } from "@/features/docs/services/note-service";
import { ErrorTable, type detectedError } from "@/features/error";
import { ProjectExplorer, ProjectFileViewer, useProject } from "@/features/project";
import { useProjectStore } from "@/features/project/stores/project-store";
import {
  CommandRunner,
  RunHistoryTable,
  RunLogPanel,
  useRunHistory
} from "@/features/run";
import type { runResult } from "@/features/run";
import { cn } from "@/shared/lib/utils";

type projectTab = "explorer" | "runs" | "errors" | "knowledge" | "settings";

const tabs: projectTab[] = ["explorer", "runs", "errors", "knowledge", "settings"];

export function ProjectRoute() {
  const { t } = useTranslation();
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const search = useSearch({ from: "/projects/$projectId" });
  const navigate = useNavigate({ from: "/projects/$projectId" });
  const project = useProject(projectId);
  const setSelectedProjectId = useProjectStore((store) => store.setSelectedProjectId);
  const activeTab = search.tab;
  const { runs, addRun } = useRunHistory(projectId);
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

  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId, setSelectedProjectId]);

  useEffect(() => {
    setSelectedRun(runs[0] ?? null);
  }, [runs]);

  useEffect(() => {
    setSelectedError(errors[0] ?? null);
  }, [errors]);

  function handleTabChange(tab: projectTab) {
    void navigate({ search: { tab } });
  }

  if (project.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">{t("project.loading")}</div>;
  }

  if (!project.data) {
    return <div className="p-6 text-sm text-muted-foreground">{t("project.notFound")}</div>;
  }

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
            <h1 className="text-lg font-semibold">{project.data.name}</h1>
            <p className="font-mono text-xs text-muted-foreground">
              {project.data.path}
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <Metadata label={t("project.runtime")} value={project.data.runtime} />
            <Metadata label={t("project.framework")} value={project.data.framework} />
            <Metadata label={t("project.package")} value={project.data.packageManager} />
            <Metadata label={t("project.branch")} value={project.data.branch} />
            <Metadata
              label={t("project.source")}
              value={
                project.data.source === "github"
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
          {project.data.source === "local" ? (
            <CommandRunner
              projectId={project.data.id}
              projectPath={project.data.path}
              onRunComplete={(result) => {
                addRun(result);
                setSelectedRun(result);
                void navigate({ search: { tab: "runs" } });
              }}
            />
          ) : (
            <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
              {t("project.githubRunDisabled")}
            </div>
          )}
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mb-3 rounded-md border bg-card px-3 py-2">
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
            className="h-full"
          >
            {activeTab === "explorer" && (
              <div className="grid h-full grid-cols-[minmax(280px,360px)_1fr] gap-4">
                <ProjectExplorer
                  tree={project.data.tree}
                  selectedFilePath={selectedFilePath}
                  onSelectFile={setSelectedFilePath}
                />
                <ProjectFileViewer
                  filePath={selectedFilePath}
                  project={project.data}
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
                  projectId={project.data.id}
                />
              </div>
            )}
            {activeTab === "knowledge" && (
              <KnowledgeList
                errors={errors}
                refreshKey={notesVersion}
                projectId={project.data.id}
              />
            )}
            {activeTab === "settings" && (
              <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
                {t("project.settingsMessage")}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.div>
  );
}

type metadataProps = {
  label: string;
  value: string;
};

function Metadata({ label, value }: metadataProps) {
  return (
    <div className="min-w-[110px] rounded-md border bg-background px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-mono">{value}</div>
    </div>
  );
}
