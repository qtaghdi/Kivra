import {
  invokeCommand,
  listenToEvent
} from "@/core/tauri/tauri-client";
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

type nativeRunStreamEvent = {
  runId: string;
  stream: "stdout" | "stderr";
  chunk: string;
};

type nativeRunCompletedEvent = {
  result: nativeRunResult;
  runId: string;
};

type nativeRunFailedEvent = {
  message: string;
  runId: string;
};

type runProjectCommandArgs = {
  command: string;
  onUpdate?: (run: runResult) => void;
  projectId: string;
  projectPath: string;
};

const runOutputEventName = "kivra://run-output";
const runCompletedEventName = "kivra://run-completed";
const runFailedEventName = "kivra://run-failed";

export const runProjectCommand = async (
  args: runProjectCommandArgs
): Promise<runResult> => {
  const runId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const startedAt = Date.now();
  let stdout = "";
  let stderr = "";

  const emitPartialRun = () => {
    args.onUpdate?.({
      id: runId,
      projectId: args.projectId,
      command: args.command,
      status: "RUNNING",
      duration: Date.now() - startedAt,
      stdout,
      stderr,
      exitCode: null,
      createdAt,
      errors: []
    });
  };

  emitPartialRun();

  const unlistenOutput = await listenToEvent<nativeRunStreamEvent>(
    runOutputEventName,
    (payload) => {
      if (payload.runId !== runId) {
        return;
      }

      if (payload.stream === "stdout") {
        stdout += payload.chunk;
      } else {
        stderr += payload.chunk;
      }

      emitPartialRun();
    }
  );

  try {
    return await new Promise<runResult>(async (resolve, reject) => {
      const unlistenCompleted = await listenToEvent<nativeRunCompletedEvent>(
        runCompletedEventName,
        (payload) => {
          if (payload.runId !== runId) {
            return;
          }

          unlistenCompleted();
          unlistenFailed();
          resolve({
            ...payload.result,
            id: runId,
            projectId: args.projectId,
            errors: payload.result.errors.map((error) => ({
              ...error,
              id: crypto.randomUUID(),
              projectId: args.projectId,
              runId,
              createdAt: payload.result.createdAt
            }))
          });
        }
      );
      const unlistenFailed = await listenToEvent<nativeRunFailedEvent>(
        runFailedEventName,
        (payload) => {
          if (payload.runId !== runId) {
            return;
          }

          unlistenCompleted();
          unlistenFailed();
          reject(new Error(payload.message));
        }
      );

      try {
        await invokeCommand<void>("start_run_project_command", {
          runId,
          createdAt,
          projectPath: args.projectPath,
          command: args.command
        });
      } catch (error) {
        unlistenCompleted();
        unlistenFailed();
        reject(error);
      }
    });
  } finally {
    unlistenOutput();
  }
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
