import { invokeCommand } from "@/core/tauri/tauri-client";
import { readGithubProjectFile } from "@/features/project/services/github-project-service";
import type { project, projectFile } from "@/features/project/types/project";

export async function readProjectFile(args: {
  filePath: string;
  project: project;
}): Promise<projectFile> {
  if (args.project.source === "github") {
    return readGithubProjectFile({
      filePath: args.filePath,
      project: args.project
    });
  }

  return invokeCommand<projectFile>("read_project_file", {
    filePath: args.filePath,
    projectPath: args.project.path
  });
}
