import type { runResult } from "@/features/run/types/run";

const storagePrefix = "kivra.runs";

const getStorageKey = (projectId: string) => `${storagePrefix}.${projectId}`;

const parseRuns = (rawRuns: string | null): runResult[] => {
  if (!rawRuns) {
    return [];
  }

  try {
    return (JSON.parse(rawRuns) as Partial<runResult>[]).map(normalizeRun);
  } catch {
    return [];
  }
};

const normalizeRun = (run: Partial<runResult>): runResult => {
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
};

export const getStoredRuns = (projectId: string): runResult[] =>
  parseRuns(window.localStorage.getItem(getStorageKey(projectId)));

export const getAllStoredRuns = (projectIds: string[]): runResult[] =>
  projectIds.flatMap((projectId) => getStoredRuns(projectId));

export const writeStoredRuns = (projectId: string, runs: runResult[]) => {
  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(runs));
};

export const deleteStoredRuns = (projectId: string) => {
  window.localStorage.removeItem(getStorageKey(projectId));
};

export const mergeRuns = (localRuns: runResult[], syncedRuns: runResult[]) => {
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
};

export const saveProjectRun = (
  projectId: string,
  run: runResult
): runResult[] => {
  const runs = getStoredRuns(projectId);
  const nextRuns = [normalizeRun({ ...run, projectId }), ...runs].slice(0, 200);

  writeStoredRuns(projectId, nextRuns);

  return nextRuns;
};

export function saveProjectRuns(projectId: string, nextRuns: runResult[]): runResult[] {
  const runMap = new Map<string, runResult>();

  for (const run of getStoredRuns(projectId)) {
    const normalizedRun = normalizeRun(run);
    runMap.set(normalizedRun.id, normalizedRun);
  }

  for (const run of nextRuns) {
    const normalizedRun = normalizeRun({ ...run, projectId });
    runMap.set(normalizedRun.id, normalizedRun);
  }

  const runs = Array.from(runMap.values())
    .sort(
      (firstRun, secondRun) =>
        new Date(secondRun.createdAt).getTime() -
        new Date(firstRun.createdAt).getTime()
    )
    .slice(0, 200);

  writeStoredRuns(projectId, runs);

  return runs;
}
