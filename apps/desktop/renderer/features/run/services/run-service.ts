import { invokeCommand } from "@/core/tauri/tauri-client";
import type { runResult } from "@/features/run/types/run";

type nativeRunResult = Omit<runResult, "id" | "projectId" | "errors"> & {
  errors: Array<
    Omit<
      runResult["errors"][number],
      "createdAt" | "id" | "projectId" | "runId"
    >
  >;
};

type nativeCapturedRunResult = Omit<runResult, "projectId" | "errors"> & {
  errors: Array<
    Omit<
      runResult["errors"][number],
      "createdAt" | "id" | "projectId" | "runId"
    >
  >;
};

export const runProjectCommand = async (args: {
  projectId: string;
  projectPath: string;
  command: string;
}): Promise<runResult> => {
  const run = await invokeCommand<nativeRunResult>("run_project_command", {
    projectPath: args.projectPath,
    command: args.command
  });
  const runId = crypto.randomUUID();

  return {
    ...run,
    id: runId,
    projectId: args.projectId,
    errors: run.errors.map((error) => ({
      ...error,
      id: crypto.randomUUID(),
      projectId: args.projectId,
      runId,
      createdAt: run.createdAt
    }))
  };
};

export const readCapturedRuns = async (args: {
  projectId: string;
  projectPath: string;
}): Promise<runResult[]> => {
  const capturedRuns = await invokeCommand<nativeCapturedRunResult[]>(
    "read_captured_runs",
    {
      projectPath: args.projectPath
    }
  );

  return capturedRuns.map((run) => ({
    ...run,
    id: `captured:${run.id}`,
    projectId: args.projectId,
    errors: run.errors.map((error) => ({
      ...error,
      id: crypto.randomUUID(),
      projectId: args.projectId,
      runId: `captured:${run.id}`,
      createdAt: run.createdAt
    }))
  }));
};
