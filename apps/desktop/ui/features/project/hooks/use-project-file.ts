import { useQuery } from "@tanstack/react-query";

import { readProjectFile } from "@/features/project/services/project-file-service";

export function useProjectFile(args: {
  filePath: string | null;
  projectPath: string;
}) {
  return useQuery({
    queryKey: ["project-file", args.projectPath, args.filePath],
    queryFn: () =>
      readProjectFile({
        projectPath: args.projectPath,
        filePath: args.filePath ?? ""
      }),
    enabled: Boolean(args.filePath)
  });
}
