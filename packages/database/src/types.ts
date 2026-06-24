export type databaseUser = {
  id: string;
  github_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

export type databaseProject = {
  id: string;
  owner_id: string;
  name: string;
  runtime: string;
  framework: string;
  package_manager: string;
  branch: string;
  repository_url: string | null;
  created_at: string;
};

export type databaseRun = {
  id: string;
  project_id: string;
  command: string;
  status: "SUCCESS" | "FAILED";
  duration: number;
  created_at: string;
};

export type databaseLog = {
  id: string;
  run_id: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  content: string;
  created_at: string;
};

export type databaseError = {
  id: string;
  project_id: string;
  run_id: string;
  error_code: string;
  message: string;
  file_path: string | null;
  line_number: number | null;
  column_number: number | null;
  stack_trace: string;
  created_at: string;
};

export type databaseNote = {
  id: string;
  error_id: string;
  content: string;
  created_at: string;
};
