import type { detectedError } from "@/features/error/types/error";

export type runStatus = "SUCCESS" | "FAILED";

export type runResult = {
  id: string;
  projectId: string;
  command: string;
  status: runStatus;
  duration: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  errors: detectedError[];
  createdAt: string;
};
