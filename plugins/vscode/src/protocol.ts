export const CAPTURE_PROTOCOL_VERSION = 1;

export const KIVRA_HOME_DIRECTORY = ".kivra";
export const CAPTURED_RUNS_DIRECTORY = "captured-runs";
export const CAPTURE_START_FILE = "start.json";
export const CAPTURE_EVENTS_FILE = "events.jsonl";
export const CAPTURE_END_FILE = "end.json";
export const CAPTURE_INDEX_FILE = "index.jsonl";

export type captureStream = "stdout" | "stderr";

export type capturedRunStart = {
  type: "start";
  protocolVersion: typeof CAPTURE_PROTOCOL_VERSION;
  id: string;
  projectPath: string;
  command: string;
  startedAt: string;
  captureMode: "vscode";
};

export type capturedRunIndex = Omit<capturedRunStart, "type">;

export type capturedRunEvent = {
  type: "output";
  protocolVersion: typeof CAPTURE_PROTOCOL_VERSION;
  time: string;
  pid: number | null;
  ppid: number | null;
  execname: string | null;
  stream: captureStream;
  data: string;
};

export type capturedRunEnd = {
  type: "end";
  protocolVersion: typeof CAPTURE_PROTOCOL_VERSION;
  finishedAt: string;
  exitCode: number | null;
  durationMs: number;
};
