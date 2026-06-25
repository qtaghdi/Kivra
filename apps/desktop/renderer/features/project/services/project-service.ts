import { invokeCommand } from "@/core/tauri/tauri-client";
import {
  deleteSyncedProject,
  fetchSyncedProjects,
  syncProject
} from "@/core/supabase/sync-service";
import { scannedProjectSchema } from "@/features/project/schemas/project-schema";
import type { githubBranch, project } from "@/features/project/types/project";
import { deleteStoredRuns } from "@/features/run/services/run-history-service";
import {
  createGithubProject,
  fetchGithubProjectBranches,
  hydrateGithubProjectBranch,
  hydrateGithubProjectTree,
  type githubRepository
} from "@/features/project/services/github-project-service";
import {
  mergeProjects,
  readStoredProjects,
  writeStoredProjects
} from "@/features/project/services/project-storage";

type scannedProject = Omit<project, "id" | "createdAt" | "source">;

const scanProject = async (projectPath: string): Promise<scannedProject> => {
  const result = scannedProjectSchema.safeParse(
    await invokeCommand<scannedProject>("scan_project", {
      projectPath
    })
  );

  if (!result.success) {
    throw new Error("PROJECT_STRUCTURE_UNREADABLE");
  }

  return result.data;
};

const syncTraceProjectList = async (projects: project[]) => {
  const localProjectPaths = projects
    .filter((project) => project.source === "local")
    .map((project) => project.path);

  if (localProjectPaths.length === 0) {
    return;
  }

  try {
    await invokeCommand("sync_trace_projects", {
      projectPaths: localProjectPaths
    });
  } catch {
    // External capture is best-effort. The app still works without it.
  }
};

const startExternalLogCapture = async (projects: project[]) => {
  const localProjectPaths = projects
    .filter((project) => project.source === "local")
    .map((project) => project.path);

  if (localProjectPaths.length === 0) {
    return;
  }

  try {
    await invokeCommand<void>("start_trace_agent", {
      projectPaths: localProjectPaths
    });
  } catch {
    // Shell and IDE capture are best-effort. The app still works without them.
  }
};

export const registerProject = async (projectPath: string): Promise<project> => {
  const scannedProject = await scanProject(projectPath);
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
  void startExternalLogCapture(nextProjects);
  void syncProject(nextProject);

  return nextProject;
};

export const importGithubProject = async (
  repo: githubRepository
): Promise<project> => {
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
};

export const connectGithubProjectToLocalFolder = async (args: {
  projectId: string;
  projectPath: string;
}): Promise<project> => {
  const scannedProject = await scanProject(args.projectPath);
  const projects = readStoredProjects();
  const existingProject = projects.find((item) => item.id === args.projectId);

  if (!existingProject) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const nextProject: project = {
    ...scannedProject,
    id: existingProject.id,
    createdAt: existingProject.createdAt,
    repositoryUrl:
      scannedProject.repositoryUrl ?? existingProject.repositoryUrl,
    source: "local"
  };

  writeStoredProjects(
    projects.map((item) => (item.id === nextProject.id ? nextProject : item))
  );
  void startExternalLogCapture([nextProject]);
  void syncProject(nextProject);

  return nextProject;
};

export const getGithubProjectBranches = async (
  projectId: string
): Promise<githubBranch[]> => {
  const project = await getProject(projectId);

  if (!project || project.source !== "github") {
    return [];
  }

  return fetchGithubProjectBranches(project);
};

export const switchGithubProjectBranch = async (args: {
  branch: string;
  projectId: string;
}): Promise<project> => {
  const project = await getProject(args.projectId);

  if (!project || project.source !== "github") {
    throw new Error("GITHUB_PROJECT_REQUIRED");
  }

  const nextProject = await hydrateGithubProjectBranch({
    branch: args.branch,
    project
  });
  const projects = readStoredProjects();

  writeStoredProjects(
    projects.map((item) => (item.id === nextProject.id ? nextProject : item))
  );
  void syncProject(nextProject);

  return nextProject;
};

export const getProjects = async (): Promise<project[]> => {
  const localProjects = readStoredProjects();
  const syncedProjects = await fetchSyncedProjects();
  const projects = mergeProjects(localProjects, syncedProjects);

  if (syncedProjects.length > 0) {
    writeStoredProjects(projects);
  }

  void syncTraceProjectList(projects);

  return projects;
};

export const deleteProject = async (projectId: string): Promise<string> => {
  const projects = readStoredProjects();

  writeStoredProjects(projects.filter((project) => project.id !== projectId));
  deleteStoredRuns(projectId);
  await deleteSyncedProject(projectId);

  return projectId;
};

export const getProject = async (projectId: string): Promise<project | null> => {
  const project = (await getProjects()).find((item) => item.id === projectId) ?? null;

  if (project?.source === "local") {
    void startExternalLogCapture([project]);
  }

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
};
