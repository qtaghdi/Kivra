import { supabase } from "@/core/supabase/supabase-client";
import type { resolutionNote } from "@/features/docs";
import type { project } from "@/features/project";
import type { runResult } from "@/features/run";

type syncUserProfileArgs = {
  avatarUrl: string | null;
  githubId: string;
  id: string;
  username: string;
};

async function getUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function syncUserProfile(args: syncUserProfileArgs): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("users").upsert(
    {
      id: args.id,
      github_id: args.githubId,
      username: args.username,
      avatar_url: args.avatarUrl,
      created_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  return !error;
}

export async function syncProject(project: project): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const ownerId = await getUserId();

  if (!ownerId) {
    return false;
  }

  const { error } = await supabase.from("projects").upsert(
    {
      id: project.id,
      owner_id: ownerId,
      name: project.name,
      runtime: project.runtime,
      framework: project.framework,
      package_manager: project.packageManager,
      branch: project.branch,
      repository_url: project.repositoryUrl,
      created_at: project.createdAt
    },
    { onConflict: "id" }
  );

  return !error;
}

export async function syncRun(run: runResult): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { error: runError } = await supabase.from("runs").upsert(
    {
      id: run.id,
      project_id: run.projectId,
      command: run.command,
      status: run.status,
      duration: run.duration,
      created_at: run.createdAt
    },
    { onConflict: "id" }
  );

  if (runError) {
    return false;
  }

  const logRows = [
    {
      run_id: run.id,
      level: "INFO",
      content: run.stdout || "",
      created_at: run.createdAt
    },
    {
      run_id: run.id,
      level: "ERROR",
      content: run.stderr || "",
      created_at: run.createdAt
    }
  ].filter((row) => row.content.trim().length > 0);

  if (logRows.length > 0) {
    const { error: logError } = await supabase.from("logs").insert(logRows);

    if (logError) {
      return false;
    }
  }

  if (run.errors.length > 0) {
    const { error: errorInsertError } = await supabase.from("errors").upsert(
      run.errors.map((error) => ({
        id: error.id,
        project_id: error.projectId,
        run_id: error.runId,
        error_code: error.errorCode,
        message: error.message,
        file_path: error.filePath,
        line_number: error.lineNumber,
        column_number: error.columnNumber,
        stack_trace: error.stackTrace,
        created_at: error.createdAt
      })),
      { onConflict: "id" }
    );

    if (errorInsertError) {
      return false;
    }
  }

  return true;
}

export async function syncNote(note: resolutionNote): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from("notes").upsert(
    {
      id: note.id,
      error_id: note.errorId,
      content: note.content,
      created_at: note.createdAt
    },
    { onConflict: "id" }
  );

  return !error;
}

export async function fetchSyncedProjects(): Promise<project[]> {
  if (!supabase) {
    return [];
  }

  const ownerId = await getUserId();

  if (!ownerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    path: item.repository_url ?? item.name,
    runtime: item.runtime,
    framework: item.framework,
    packageManager: item.package_manager,
    branch: item.branch,
    repositoryUrl: item.repository_url,
    createdAt: item.created_at,
    tree: {
      id: item.id,
      name: item.name,
      path: item.repository_url ?? item.name,
      type: "folder"
    }
  }));
}

export async function fetchSyncedRuns(projectId: string): Promise<runResult[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("runs")
    .select(
      "id, project_id, command, status, duration, created_at, logs(level, content), errors(id, project_id, run_id, error_code, message, file_path, line_number, column_number, stack_trace, created_at)"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => {
    const logs = item.logs ?? [];
    const stdout = logs
      .filter((log) => log.level === "INFO")
      .map((log) => log.content)
      .join("\n");
    const stderr = logs
      .filter((log) => log.level === "ERROR")
      .map((log) => log.content)
      .join("\n");

    return {
      id: item.id,
      projectId: item.project_id,
      command: item.command,
      status: item.status,
      duration: item.duration,
      stdout,
      stderr,
      exitCode: item.status === "SUCCESS" ? 0 : 1,
      createdAt: item.created_at,
      errors: (item.errors ?? []).map((error) => ({
        id: error.id,
        projectId: error.project_id,
        runId: error.run_id,
        errorCode: error.error_code,
        message: error.message,
        filePath: error.file_path,
        lineNumber: error.line_number,
        columnNumber: error.column_number,
        stackTrace: error.stack_trace,
        createdAt: error.created_at
      }))
    };
  });
}

export async function fetchSyncedNotes(projectId: string): Promise<resolutionNote[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("notes")
    .select("id, error_id, content, created_at, errors(project_id)")
    .eq("errors.project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .filter((item) => item.errors)
    .map((item) => ({
      id: item.id,
      errorId: item.error_id,
      projectId,
      content: item.content,
      createdAt: item.created_at,
      updatedAt: item.created_at
    }));
}
