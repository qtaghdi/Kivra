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
      className="space-y-5 p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.description")}
          </p>
        </div>
        <ProjectRegistration />
      </header>

      <section className="grid grid-cols-3 gap-3">
        <MetricCard delay={0.02}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            {t("dashboard.projects")}
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {projects.data?.length ?? 0}
          </div>
        </MetricCard>
        <MetricCard delay={0.06}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            {t("dashboard.runsToday")}
          </div>
          <div className="mt-2 text-2xl font-semibold">{runMetrics.runsToday}</div>
        </MetricCard>
        <MetricCard delay={0.1}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            {t("dashboard.openErrors")}
          </div>
          <div className="mt-2 text-2xl font-semibold">{runMetrics.openErrors}</div>
        </MetricCard>
      </section>

      <ProjectTable projects={projects.data ?? []} />
    </motion.div>
  );
}

type metricCardProps = {
  children: ReactNode;
  delay: number;
};

function MetricCard({ children, delay }: metricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="rounded-md border bg-white p-4 shadow-sm"
    >
      {children}
    </motion.div>
  );
}
