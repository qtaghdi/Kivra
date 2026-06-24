import { useQuery } from "@tanstack/react-query";

import { fetchGithubRepositories } from "@/features/project/services/github-project-service";

export function useGithubRepositories() {
  return useQuery({
    queryKey: ["github-repositories"],
    queryFn: fetchGithubRepositories,
    enabled: false
  });
}
