import { invokeCommand } from "@/core/tauri/tauri-client";
import { fetchSyncedProjects, syncProject } from "@/core/supabase/sync-service";
import type { project } from "@/features/project/types/project";

const storageKey = "kivra.projects";

type scannedProject = Omit<project, "id" | "createdAt">;

function readStoredProjects(): project[] {
  const rawProjects = window.localStorage.getItem(storageKey);

  if (!rawProjects) {
    return [];
  }

  try {
    return JSON.parse(rawProjects) as project[];
  } catch {
    return [];
  }
}

function writeStoredProjects(projects: project[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(projects));
}

function mergeProjects(localProjects: project[], syncedProjects: project[]) {
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
}

export async function registerProject(projectPath: string): Promise<project> {
  const scannedProject = await invokeCommand<scannedProject>("scan_project", {
    projectPath
  });
  const projects = readStoredProjects();
  const existingProject = projects.find((item) => item.path === scannedProject.path);
  const nextProject: project = {
    ...scannedProject,
    id: existingProject?.id ?? crypto.randomUUID(),
    createdAt: existingProject?.createdAt ?? new Date().toISOString()
  };
  const nextProjects = [
    nextProject,
    ...projects.filter((item) => item.path !== scannedProject.path)
  ];

  writeStoredProjects(nextProjects);
  void syncProject(nextProject);

  return nextProject;
}

export async function getProjects(): Promise<project[]> {
  const localProjects = readStoredProjects();
  const syncedProjects = await fetchSyncedProjects();
  const projects = mergeProjects(localProjects, syncedProjects);

  if (syncedProjects.length > 0) {
    writeStoredProjects(projects);
  }

  return projects;
}

export async function getProject(projectId: string): Promise<project | null> {
  return (await getProjects()).find((item) => item.id === projectId) ?? null;
}
