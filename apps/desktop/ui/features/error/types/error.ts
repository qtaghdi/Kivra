export type detectedError = {
  id: string;
  errorCode: string;
  message: string;
  stackTrace: string;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  projectId: string;
  runId: string;
  createdAt: string;
};
