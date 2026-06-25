#!/usr/bin/env node
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";

const [mode, ...args] = process.argv.slice(2);
const CAPTURE_PROTOCOL_VERSION = 1;
const KIVRA_HOME_DIRECTORY = ".kivra";
const CAPTURED_RUNS_DIRECTORY = "captured-runs";
const CAPTURE_START_FILE = "start.json";
const CAPTURE_EVENTS_FILE = "events.jsonl";
const CAPTURE_INDEX_FILE = "index.jsonl";

if (mode === "start") {
  const [cwd, command, projectsFile] = args;
  const project = findProject(cwd, projectsFile);

  if (!project) {
    process.exit(0);
  }

  const id = `${Date.now()}-${process.pid}`;
  const runDir = join(homedir(), KIVRA_HOME_DIRECTORY, CAPTURED_RUNS_DIRECTORY, projectKey(project), id);
  mkdirSync(runDir, { recursive: true });
  const startedAt = new Date().toISOString();
  writeFileSync(
    join(runDir, CAPTURE_START_FILE),
    `${JSON.stringify(
      {
        type: "start",
        protocolVersion: CAPTURE_PROTOCOL_VERSION,
        id,
        projectPath: project,
        leaderPid: process.ppid,
        command,
        startedAt,
        captureMode: "shell"
      },
      null,
      2
    )}\n`
  );
  appendFileSync(
    join(dirname(runDir), CAPTURE_INDEX_FILE),
    `${JSON.stringify({
      protocolVersion: CAPTURE_PROTOCOL_VERSION,
      id,
      projectPath: project,
      command,
      startedAt,
      captureMode: "shell"
    })}\n`
  );
  process.stdout.write(runDir);
  process.exit(0);
}

if (mode === "stream") {
  const [runDir, stream] = args;

  if (!runDir || !stream) {
    process.exit(1);
  }

  process.stdin.on("data", (chunk) => {
    const rawData = chunk.toString("utf8");
    const data = sanitizeStoredData(rawData);

    if (data) {
      appendFileSync(
        join(runDir, CAPTURE_EVENTS_FILE),
        `${JSON.stringify({
          type: "output",
          protocolVersion: CAPTURE_PROTOCOL_VERSION,
          time: new Date().toISOString(),
          pid: null,
          ppid: null,
          execname: null,
          stream,
          data
        })}\n`
      );
    }

    process.stdout.write(rawData);
  });
  process.stdin.resume();
} else {
  process.stderr.write("Usage: kivra-shell-stream.mjs start <cwd> <command> <projects-file> | stream <run-dir> <stdout|stderr>\n");
  process.exit(1);
}

function findProject(cwd, projectsFile) {
  if (!cwd || !projectsFile || !existsSync(projectsFile)) {
    return null;
  }

  const currentPath = realpathOrSelf(cwd);
  const projects = JSON.parse(readFileSync(projectsFile, "utf8"));

  if (!Array.isArray(projects)) {
    return null;
  }

  return projects
    .map((project) => (typeof project === "string" ? project : project?.path))
    .filter(Boolean)
    .map(realpathOrSelf)
    .find((project) => isInside(currentPath, project)) ?? null;
}

function isInside(childPath, rootPath) {
  const diff = relative(rootPath, childPath);

  return diff === "" || (!diff.startsWith("..") && !diff.startsWith("/"));
}

function realpathOrSelf(path) {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

function projectKey(projectPath) {
  const name = projectPath.split(/[\\/]/).filter(Boolean).at(-1) ?? "project";
  const digest = createHash("sha1").update(projectPath).digest("hex").slice(0, 12);

  return `${name}-${digest}`;
}

function sanitizeStoredData(value) {
  return value
    .replace(/\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g, "")
    .replace(/\]1341;[^\u0007]*\u0007/g, "")
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
