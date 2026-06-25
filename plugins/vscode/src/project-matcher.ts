import { existsSync, realpathSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import { projectsFile as defaultProjectsFile } from "./paths";

export const findRegisteredProject = (
  workspaceFolders: string[],
  projectsFile = defaultProjectsFile()
) => {
  if (!existsSync(projectsFile)) {
    return null;
  }

  const registeredProjects = readRegisteredProjects(projectsFile);

  for (const workspaceFolder of workspaceFolders) {
    const currentPath = realpathOrSelf(workspaceFolder);
    const match = registeredProjects.find((projectPath) => isInside(currentPath, projectPath));

    if (match) {
      return match;
    }
  }

  return null;
};

const readRegisteredProjects = (projectsFile: string) => {
  const parsed = JSON.parse(readFileSync(projectsFile, "utf8")) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((project) => {
      if (typeof project === "string") {
        return project;
      }

      if (project && typeof project === "object" && "path" in project) {
        const path = (project as { path?: unknown }).path;
        return typeof path === "string" ? path : null;
      }

      return null;
    })
    .filter((project): project is string => Boolean(project))
    .map(realpathOrSelf)
    .filter((project) => {
      try {
        return statSync(project).isDirectory();
      } catch {
        return false;
      }
    });
};

const isInside = (childPath: string, rootPath: string) => {
  const diff = relative(rootPath, childPath);

  return diff === "" || (!diff.startsWith("..") && !isAbsolute(diff));
};

const realpathOrSelf = (path: string) => {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
};
