import { invokeCommand } from "@/core/tauri/tauri-client";
import { fetchSyncedProjects, syncProject } from "@/core/supabase/sync-service";
import type { project } from "@/features/project/types/project";
import {
  createGithubProject,
  hydrateGithubProjectTree,
  type githubRepository
} from "@/features/project/services/github-project-service";

const storageKey = "kivra.projects";

type scannedProject = Omit<project, "id" | "createdAt" | "source">;

function readStoredProjects(): project[] {
  const rawProjects = window.localStorage.getItem(storageKey);

  if (!rawProjects) {
    return [];
  }

  try {
    return (JSON.parse(rawProjects) as project[]).map(normalizeProject);
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

function normalizeProject(project: project): project {
  return {
    ...project,
    source: project.source ?? "local"
  };
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
    createdAt: existingProject?.createdAt ?? new Date().toISOString(),
    source: "local"
  };
  const nextProjects = [
    nextProject,
    ...projects.filter((item) => item.path !== scannedProject.path)
  ];

  writeStoredProjects(nextProjects);
  void syncProject(nextProject);

  return nextProject;
}

export async function importGithubProject(repo: githubRepository): Promise<project> {
  const githubProject = await createGithubProject(repo);
  const projects = readStoredProjects();
  const existingProject = projects.find((item) => item.repositoryUrl === repo.htmlUrl);
  const nextProject = {
    ...githubProject,
    id: existingProject?.id ?? githubProject.id,
    createdAt: existingProject?.createdAt ?? githubProject.createdAt
  };
  const nextProjects = [
    nextProject,
    ...projects.filter((item) => item.id !== nextProject.id)
  ];

  writeStoredProjects(nextProjects);
  void syncProject(nextProject);

  return nextProject;
}

export async function getProjects(): Promise<project[]> {
  const localProjects = readStoredProjects();
  const syncedProjects = (await fetchSyncedProjects()).map(normalizeProject);
  const projects = mergeProjects(localProjects, syncedProjects);

  if (syncedProjects.length > 0) {
    writeStoredProjects(projects);
  }

  return projects;
}

export async function getProject(projectId: string): Promise<project | null> {
  const project = (await getProjects()).find((item) => item.id === projectId) ?? null;

  if (!project || project.source !== "github" || project.tree.children?.length) {
    return project;
  }

  const hydratedProject = await hydrateGithubProjectTree(project);
  const projects = readStoredProjects();
  const hasStoredProject = projects.some((item) => item.id === hydratedProject.id);

  writeStoredProjects(
    hasStoredProject
      ? projects.map((item) => (item.id === hydratedProject.id ? hydratedProject : item))
      : [hydratedProject, ...projects]
  );

  return hydratedProject;
}
