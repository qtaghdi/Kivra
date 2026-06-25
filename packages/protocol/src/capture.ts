export const CAPTURE_PROTOCOL_VERSION = 1;

export const KIVRA_HOME_DIRECTORY = ".kivra";
export const CAPTURED_RUNS_DIRECTORY = "captured-runs";
export const CAPTURE_START_FILE = "start.json";
export const CAPTURE_EVENTS_FILE = "events.jsonl";
export const CAPTURE_END_FILE = "end.json";
export const CAPTURE_INDEX_FILE = "index.jsonl";

export type CaptureMode = "shell" | "jetbrains" | "vscode";
export type CaptureStream = "stdout" | "stderr";

export type CapturedRunStart = {
  type: "start";
  protocolVersion: typeof CAPTURE_PROTOCOL_VERSION;
  id: string;
  projectPath: string;
  command: string;
  startedAt: string;
  captureMode: CaptureMode;
};

export type CapturedRunIndex = Omit<CapturedRunStart, "type">;

export type CapturedRunEvent = {
  type: "output";
  protocolVersion: typeof CAPTURE_PROTOCOL_VERSION;
  time: string;
  pid: number | null;
  ppid: number | null;
  execname: string | null;
  stream: CaptureStream;
  data: string;
};

export type CapturedRunEnd = {
  type: "end";
  protocolVersion: typeof CAPTURE_PROTOCOL_VERSION;
  finishedAt: string;
  exitCode: number | null;
  durationMs: number;
};
