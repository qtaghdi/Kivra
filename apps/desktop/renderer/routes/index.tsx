import { motion } from "framer-motion";
import { Activity, AlertTriangle, FolderKanban, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  GitHubProjectImport,
  ProjectRegistration,
  ProjectTable,
  useProjects
} from "@/features/project";
import { useRunMetrics } from "@/features/run";
import { Skeleton } from "@/shared/ui/skeleton";

export const DashboardRoute = () => {
  const { t } = useTranslation();
  const projects = useProjects();
  const [projectQuery, setProjectQuery] = useState("");
  const importedRepositoryUrls = useMemo(
    () =>
      new Set(
        (projects.data ?? [])
          .map((project) => project.repositoryUrl)
          .filter((url): url is string => Boolean(url))
      ),
    [projects.data]
  );
  const filteredProjects = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects.data ?? [];
    }

    return (projects.data ?? []).filter((project) =>
      [
        project.name,
        project.path,
        project.framework,
        project.runtime,
        project.packageManager,
        project.branch
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [projectQuery, projects.data]);
  const projectIds = projects.data?.map((project) => project.id) ?? [];
  const runMetrics = useRunMetrics(projectIds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="space-y-4 p-4"
    >
      <header>
        <div>
          <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.description")}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-[minmax(360px,440px)_1fr] gap-4">
        <ProjectRegistration />
        <GitHubProjectImport importedRepositoryUrls={importedRepositoryUrls} />
      </section>

      <section className="grid grid-cols-3 overflow-hidden rounded-md border bg-card">
        <MetricPanel>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            {t("dashboard.projects")}
          </div>
          {projects.isLoading ? (
            <Skeleton className="mt-2 h-7 w-14" />
          ) : (
            <div className="mt-1 text-lg font-semibold">
              {projects.data?.length ?? 0}
            </div>
          )}
        </MetricPanel>
        <MetricPanel>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4" />
            {t("dashboard.runsToday")}
          </div>
          {projects.isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-1 text-lg font-semibold">{runMetrics.runsToday}</div>
          )}
        </MetricPanel>
        <MetricPanel>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            {t("dashboard.openErrors")}
          </div>
          {projects.isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-1 text-lg font-semibold">{runMetrics.openErrors}</div>
          )}
        </MetricPanel>
      </section>

      <section className="space-y-3">
        <div className="flex h-9 items-center gap-2 rounded-md border bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={projectQuery}
            onChange={(event) => setProjectQuery(event.target.value)}
            placeholder={t("dashboard.projectSearchPlaceholder")}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {!projects.isLoading && (
            <span className="font-mono text-xs text-muted-foreground">
              {filteredProjects.length}/{projects.data?.length ?? 0}
            </span>
          )}
        </div>
        <ProjectTable
          projects={filteredProjects}
          isLoading={projects.isLoading}
          emptyMessage={
            projectQuery.trim()
              ? t("dashboard.projectSearchEmpty")
              : undefined
          }
        />
      </section>
    </motion.div>
  );
};

type metricPanelProps = {
  children: ReactNode;
};

const MetricPanel = ({ children }: metricPanelProps) => (
  <div className="border-r p-3 last:border-r-0">{children}</div>
);
