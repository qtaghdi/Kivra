import type { captureStream } from "./protocol";

export type dapOutput = {
  stream: captureStream;
  data: string;
};

export const parseDebugAdapterOutput = (message: unknown): dapOutput | null => {
  if (!isRecord(message) || message.event !== "output" || !isRecord(message.body)) {
    return null;
  }

  const output = message.body.output;

  if (typeof output !== "string" || output.length === 0) {
    return null;
  }

  return {
    stream: message.body.category === "stderr" ? "stderr" : "stdout",
    data: output
  };
};

export const parseDebugAdapterExitCode = (message: unknown) => {
  if (!isRecord(message) || message.event !== "exited" || !isRecord(message.body)) {
    return null;
  }

  return typeof message.body.exitCode === "number" ? message.body.exitCode : null;
};

export const isDebugAdapterTerminated = (message: unknown) =>
  isRecord(message) && message.event === "terminated";

export const isNodeTerminalSession = (session: {
  type: string;
}) => session.type === "node-terminal";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
