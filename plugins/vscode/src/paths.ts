import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  CAPTURED_RUNS_DIRECTORY,
  KIVRA_HOME_DIRECTORY
} from "./protocol";

export const kivraHome = () => join(homedir(), KIVRA_HOME_DIRECTORY);

export const projectsFile = () => join(kivraHome(), "trace-projects.json");

export const capturedRunsRoot = () => join(kivraHome(), CAPTURED_RUNS_DIRECTORY);

export const projectKey = (projectPath: string) => {
  const name = projectPath.split(/[\\/]/).filter(Boolean).at(-1) ?? "project";
  const digest = createHash("sha1").update(projectPath).digest("hex").slice(0, 12);

  return `${name}-${digest}`;
};
