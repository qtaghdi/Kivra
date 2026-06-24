import type { runResult } from "@/features/run/types/run";

const storagePrefix = "kivra.runs";

function getStorageKey(projectId: string) {
  return `${storagePrefix}.${projectId}`;
}

function parseRuns(rawRuns: string | null): runResult[] {
  if (!rawRuns) {
    return [];
  }

  try {
    return (JSON.parse(rawRuns) as Partial<runResult>[]).map(normalizeRun);
  } catch {
    return [];
  }
}

function normalizeRun(run: Partial<runResult>): runResult {
  const runId = run.id ?? crypto.randomUUID();
  const projectId = run.projectId ?? "local";
  const createdAt = run.createdAt ?? new Date().toISOString();

  return {
    id: runId,
    projectId,
    command: run.command ?? "",
    status: run.status ?? "FAILED",
    duration: run.duration ?? 0,
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? "",
    exitCode: run.exitCode ?? null,
    createdAt,
    errors: (run.errors ?? []).map((error) => ({
      id: error.id ?? crypto.randomUUID(),
      errorCode: error.errorCode ?? "RUN_FAILED",
      message: error.message ?? "",
      stackTrace: error.stackTrace ?? "",
      filePath: error.filePath ?? null,
      lineNumber: error.lineNumber ?? null,
      columnNumber: error.columnNumber ?? null,
      projectId,
      runId,
      createdAt
    }))
  };
}

export function getStoredRuns(projectId: string): runResult[] {
  return parseRuns(window.localStorage.getItem(getStorageKey(projectId)));
}

export function getAllStoredRuns(projectIds: string[]): runResult[] {
  return projectIds.flatMap((projectId) => getStoredRuns(projectId));
}

export function writeStoredRuns(projectId: string, runs: runResult[]) {
  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(runs));
}

export function mergeRuns(localRuns: runResult[], syncedRuns: runResult[]) {
  const runMap = new Map<string, runResult>();

  for (const syncedRun of syncedRuns) {
    runMap.set(syncedRun.id, normalizeRun(syncedRun));
  }

  for (const localRun of localRuns) {
    runMap.set(localRun.id, normalizeRun(localRun));
  }

  return Array.from(runMap.values()).sort(
    (firstRun, secondRun) =>
      new Date(secondRun.createdAt).getTime() - new Date(firstRun.createdAt).getTime()
  );
}

export function saveProjectRun(projectId: string, run: runResult): runResult[] {
  const runs = getStoredRuns(projectId);
  const nextRuns = [normalizeRun({ ...run, projectId }), ...runs].slice(0, 200);

  writeStoredRuns(projectId, nextRuns);

  return nextRuns;
}
