import { useEffect, useMemo, useState } from "react";

import { fetchSyncedRuns, syncRun } from "@/core/supabase/sync-service";
import { getResolvedErrorIds } from "@/features/docs/services/note-service";
import {
  getAllStoredRuns,
  getStoredRuns,
  mergeRuns,
  saveProjectRun,
  saveProjectRuns,
  writeStoredRuns
} from "@/features/run/services/run-history-service";
import { readCapturedRuns } from "@/features/run/services/run-service";
import type { runResult } from "@/features/run/types/run";

const autoRefreshIntervalMs = 300_000;

export const useRunHistory = (projectId: string, projectPath?: string | null) => {
  const [runs, setRuns] = useState<runResult[]>(() => getStoredRuns(projectId));

  useEffect(() => {
    let isActive = true;

    const loadRuns = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const localRuns = getStoredRuns(projectId);
      const syncedRuns = await fetchSyncedRuns(projectId);
      const nextRuns = mergeRuns(localRuns, syncedRuns);

      if (syncedRuns.length > 0) {
        writeStoredRuns(projectId, nextRuns);
      }

      if (isActive) {
        setRuns(nextRuns);
      }
    };

    void loadRuns();
    const intervalId = window.setInterval(loadRuns, autoRefreshIntervalMs);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectPath) {
      return;
    }

    let isActive = true;
    const capturedProjectPath = projectPath;

    const loadCapturedRuns = async () => {
      try {
        const capturedRuns = await readCapturedRuns({
          projectId,
          projectPath: capturedProjectPath
        });

        if (isActive && capturedRuns.length > 0) {
          setRuns(saveProjectRuns(projectId, capturedRuns));
        }
      } catch {
        // Captured runs are best-effort; browser preview and missing folders ignore this path.
      }
    };

    void loadCapturedRuns();
    const intervalId = window.setInterval(loadCapturedRuns, 2500);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [projectId, projectPath]);

  const addRun = (run: runResult) => {
    setRuns(saveProjectRun(projectId, run));
    void syncRun(run);
  };

  return {
    runs,
    addRun
  };
};

export const useRunMetrics = (projectIds: string[]) =>
  useMemo(() => {
    const runs = getAllStoredRuns(projectIds);
    const resolvedErrorIds = new Set(
      projectIds.flatMap((projectId) => Array.from(getResolvedErrorIds(projectId)))
    );
    const today = new Date().toDateString();

    return {
      runsToday: runs.filter((run) => new Date(run.createdAt).toDateString() === today)
        .length,
      openErrors: runs
        .flatMap((run) => run.errors)
        .filter((error) => !resolvedErrorIds.has(error.id)).length
    };
  }, [projectIds]);
