import { invokeCommand } from "@/core/tauri/tauri-client";
import type { projectFile } from "@/features/project/types/project";

export async function readProjectFile(args: {
  filePath: string;
  projectPath: string;
}): Promise<projectFile> {
  return invokeCommand<projectFile>("read_project_file", args);
}
