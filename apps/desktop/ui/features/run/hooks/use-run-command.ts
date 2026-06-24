import { useMutation } from "@tanstack/react-query";

import { runProjectCommand } from "@/features/run/services/run-service";

export function useRunCommand() {
  return useMutation({
    mutationFn: runProjectCommand
  });
}
