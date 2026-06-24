import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { project } from "@/features/project/types/project";
import { useProjectStore } from "@/features/project/stores/project-store";

type projectTableProps = {
  projects: project[];
};

export function ProjectTable({ projects }: projectTableProps) {
  const { t } = useTranslation();
  const setSelectedProjectId = useProjectStore((store) => store.setSelectedProjectId);

  if (projects.length === 0) {
    return (
      <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
        {t("project.empty")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="overflow-hidden rounded-md border bg-white shadow-sm"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">{t("project.tableProject")}</th>
            <th className="px-4 py-3 font-medium">{t("project.runtime")}</th>
            <th className="px-4 py-3 font-medium">{t("project.framework")}</th>
            <th className="px-4 py-3 font-medium">{t("project.packageManager")}</th>
            <th className="px-4 py-3 font-medium">{t("project.branch")}</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <motion.tr
              key={project.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: "easeOut" }}
              className="border-t"
            >
              <td className="px-4 py-3">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  search={{ tab: "explorer" }}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="font-medium text-primary hover:underline"
                >
                  {project.name}
                </Link>
                <div className="text-xs text-muted-foreground">{project.path}</div>
              </td>
              <td className="px-4 py-3">{project.runtime}</td>
              <td className="px-4 py-3">{project.framework}</td>
              <td className="px-4 py-3">{project.packageManager}</td>
              <td className="px-4 py-3">{project.branch}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
