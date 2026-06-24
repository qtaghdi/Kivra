import { useEffect, useMemo, useState } from "react";

import { fetchSyncedRuns, syncRun } from "@/core/supabase/sync-service";
import { getResolvedErrorIds } from "@/features/docs/services/note-service";
import {
  getAllStoredRuns,
  getStoredRuns,
  mergeRuns,
  saveProjectRun,
  writeStoredRuns
} from "@/features/run/services/run-history-service";
import type { runResult } from "@/features/run/types/run";

export function useRunHistory(projectId: string) {
  const [runs, setRuns] = useState<runResult[]>(() => getStoredRuns(projectId));

  useEffect(() => {
    let isActive = true;

    async function loadRuns() {
      const localRuns = getStoredRuns(projectId);
      const syncedRuns = await fetchSyncedRuns(projectId);
      const nextRuns = mergeRuns(localRuns, syncedRuns);

      if (syncedRuns.length > 0) {
        writeStoredRuns(projectId, nextRuns);
      }

      if (isActive) {
        setRuns(nextRuns);
      }
    }

    void loadRuns();

    return () => {
      isActive = false;
    };
  }, [projectId]);

  function addRun(run: runResult) {
    setRuns(saveProjectRun(projectId, run));
    void syncRun(run);
  }

  return {
    runs,
    addRun
  };
}

export function useRunMetrics(projectIds: string[]) {
  return useMemo(() => {
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
}
