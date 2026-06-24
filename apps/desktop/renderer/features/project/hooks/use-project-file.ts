import { useQuery } from "@tanstack/react-query";

import { readProjectFile } from "@/features/project/services/project-file-service";
import type { project } from "@/features/project/types/project";

export function useProjectFile(args: {
  filePath: string | null;
  project: project;
}) {
  return useQuery({
    queryKey: ["project-file", args.project.id, args.project.branch, args.filePath],
    queryFn: () =>
      readProjectFile({
        project: args.project,
        filePath: args.filePath ?? ""
      }),
    enabled: Boolean(args.filePath)
  });
}
