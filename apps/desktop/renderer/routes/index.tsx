import { motion } from "framer-motion";
import { Activity, AlertTriangle, FolderKanban } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ProjectRegistration, ProjectTable, useProjects } from "@/features/project";
import { useRunMetrics } from "@/features/run";

export function DashboardRoute() {
  const { t } = useTranslation();
  const projects = useProjects();
  const projectIds = projects.data?.map((project) => project.id) ?? [];
  const runMetrics = useRunMetrics(projectIds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="space-y-4 p-4"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.description")}
          </p>
        </div>
        <ProjectRegistration />
      </header>

      <section className="grid grid-cols-3 overflow-hidden rounded-md border bg-card">
        <MetricPanel>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            {t("dashboard.projects")}
          </div>
          <div className="mt-1 text-lg font-semibold">
            {projects.data?.length ?? 0}
          </div>
        </MetricPanel>
        <MetricPanel>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4" />
            {t("dashboard.runsToday")}
          </div>
          <div className="mt-1 text-lg font-semibold">{runMetrics.runsToday}</div>
        </MetricPanel>
        <MetricPanel>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            {t("dashboard.openErrors")}
          </div>
          <div className="mt-1 text-lg font-semibold">{runMetrics.openErrors}</div>
        </MetricPanel>
      </section>

      <ProjectTable projects={projects.data ?? []} />
    </motion.div>
  );
}

type metricPanelProps = {
  children: ReactNode;
};

function MetricPanel({ children }: metricPanelProps) {
  return <div className="border-r p-3 last:border-r-0">{children}</div>;
}
