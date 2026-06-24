import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getProject,
  getProjects,
  registerProject
} from "@/features/project/services/project-service";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: getProjects
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId)
  });
}

export function useRegisterProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}
