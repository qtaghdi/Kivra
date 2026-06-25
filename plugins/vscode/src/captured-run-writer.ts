import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { projectKey, capturedRunsRoot } from "./paths";
import {
  CAPTURE_END_FILE,
  CAPTURE_EVENTS_FILE,
  CAPTURE_INDEX_FILE,
  CAPTURE_PROTOCOL_VERSION,
  CAPTURE_START_FILE,
  type capturedRunEnd,
  type capturedRunEvent,
  type capturedRunIndex,
  type capturedRunStart,
  type captureStream
} from "./protocol";
import { sanitizeOutput } from "./sanitizer";

export class CapturedRunWriter {
  private readonly runDirectory: string;
  private readonly startedAtMillis: number;
  private closed = false;

  private constructor(runDirectory: string, startedAtMillis: number) {
    this.runDirectory = runDirectory;
    this.startedAtMillis = startedAtMillis;
  }

  static start(projectPath: string, command: string) {
    const id = `${Date.now()}-${randomUUID()}`;
    const startedAtMillis = Date.now();
    const startedAt = new Date(startedAtMillis).toISOString();
    const runDirectory = join(capturedRunsRoot(), projectKey(projectPath), id);

    mkdirSync(runDirectory, { recursive: true });
    const start: capturedRunStart = {
      type: "start",
      protocolVersion: CAPTURE_PROTOCOL_VERSION,
      id,
      projectPath,
      command,
      startedAt,
      captureMode: "vscode"
    };
    const index: capturedRunIndex = {
      protocolVersion: CAPTURE_PROTOCOL_VERSION,
      id,
      projectPath,
      command,
      startedAt,
      captureMode: "vscode"
    };

    writeJson(join(runDirectory, CAPTURE_START_FILE), start);
    appendJsonLine(join(runDirectory, "..", CAPTURE_INDEX_FILE), index);

    return new CapturedRunWriter(runDirectory, startedAtMillis);
  }

  append(stream: captureStream, rawData: string) {
    if (this.closed) {
      return;
    }

    const data = sanitizeOutput(rawData);

    if (!data) {
      return;
    }

    const event: capturedRunEvent = {
      type: "output",
      protocolVersion: CAPTURE_PROTOCOL_VERSION,
      time: new Date().toISOString(),
      pid: null,
      ppid: null,
      execname: null,
      stream,
      data
    };

    appendJsonLine(join(this.runDirectory, CAPTURE_EVENTS_FILE), event);
  }

  finish(exitCode: number | null) {
    if (this.closed) {
      return;
    }

    this.closed = true;
    const finishedAtMillis = Date.now();
    const end: capturedRunEnd = {
      type: "end",
      protocolVersion: CAPTURE_PROTOCOL_VERSION,
      finishedAt: new Date(finishedAtMillis).toISOString(),
      exitCode,
      durationMs: finishedAtMillis - this.startedAtMillis
    };

    writeJson(join(this.runDirectory, CAPTURE_END_FILE), end);
  }
}

const writeJson = (path: string, value: unknown) => {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

const appendJsonLine = (path: string, value: unknown) => {
  appendFileSync(path, `${JSON.stringify(value)}\n`);
};
