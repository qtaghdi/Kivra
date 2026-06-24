import { projectsSchema } from "@/features/project/schemas/project-schema";
import type { project } from "@/features/project/types/project";

const storageKey = "kivra.projects";

export const readStoredProjects = (): project[] => {
  const rawProjects = window.localStorage.getItem(storageKey);

  if (!rawProjects) {
    return [];
  }

  try {
    const parsedProjects = JSON.parse(rawProjects);
    const normalizedProjects = Array.isArray(parsedProjects)
      ? parsedProjects.map(normalizeProject)
      : [];
    const result = projectsSchema.safeParse(normalizedProjects);

    return result.success ? result.data : [];
  } catch {
    return [];
  }
};

export const writeStoredProjects = (projects: project[]) => {
  window.localStorage.setItem(storageKey, JSON.stringify(projects));
};

export const mergeProjects = (
  localProjects: project[],
  syncedProjects: project[]
) => {
  const projectMap = new Map<string, project>();

  for (const syncedProject of syncedProjects) {
    projectMap.set(syncedProject.id, syncedProject);
  }

  for (const localProject of localProjects) {
    projectMap.set(localProject.id, localProject);
  }

  return Array.from(projectMap.values()).sort(
    (firstProject, secondProject) =>
      new Date(secondProject.createdAt).getTime() -
      new Date(firstProject.createdAt).getTime()
  );
};

export const normalizeProject = (project: project): project => ({
  ...project,
  source: project.source ?? "local"
});
