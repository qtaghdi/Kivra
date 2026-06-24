import { invokeCommand } from "@/core/tauri/tauri-client";
import { projectFileSchema } from "@/features/project/schemas/project-schema";
import { readGithubProjectFile } from "@/features/project/services/github-project-service";
import type { project, projectFile } from "@/features/project/types/project";

export const readProjectFile = async (args: {
  filePath: string;
  project: project;
}): Promise<projectFile> => {
  if (args.project.source === "github") {
    return readGithubProjectFile({
      filePath: args.filePath,
      project: args.project
    });
  }

  return projectFileSchema.parse(
    await invokeCommand<projectFile>("read_project_file", {
      filePath: args.filePath,
      projectPath: args.project.path
    })
  );
};
