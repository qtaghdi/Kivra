#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const projectPath = process.argv[2] ?? null;
const KIVRA_HOME_DIRECTORY = ".kivra";
const CAPTURED_RUNS_DIRECTORY = "captured-runs";
const CAPTURE_START_FILE = "start.json";
const CAPTURE_EVENTS_FILE = "events.jsonl";
const CAPTURE_INDEX_FILE = "index.jsonl";

const kivraHome = join(homedir(), KIVRA_HOME_DIRECTORY);
const projectsFile = join(kivraHome, "trace-projects.json");
const shellIntegrationFile = join(kivraHome, "shell", "zsh-integration.zsh");
const shellHelperFile = join(kivraHome, "trace-runtime", "shell-stream.mjs");
const zshrcFile = join(homedir(), ".zshrc");

printSection("shell integration");
printPath("zsh integration", shellIntegrationFile);
printPath("stream helper", shellHelperFile);
printZshrcStatus();

printSection("projects");
printFile("projects file", projectsFile);

if (projectPath) {
  printSection("captured runs");
  printCentralCapturedRuns(projectPath);
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

function printFile(label, path) {
  console.log(`${label}: ${path}`);

  if (!existsSync(path)) {
    console.log("(missing)");
    return;
  }

  console.log(readFileSync(path, "utf8").trim() || "(empty)");
}

function printPath(label, path) {
  console.log(`${label}: ${path}`);
  console.log(existsSync(path) ? "(installed)" : "(missing)");
}

function printZshrcStatus() {
  const sourceLine = `source '${shellIntegrationFile.replaceAll("'", "'\\''")}'`;
  const zshrc = existsSync(zshrcFile) ? readFileSync(zshrcFile, "utf8") : "";

  console.log(`zshrc: ${zshrcFile}`);
  console.log(zshrc.includes(sourceLine) ? "(source line installed)" : "(source line missing)");
}

function printCentralCapturedRuns(projectPath) {
  const rootPath = join(kivraHome, CAPTURED_RUNS_DIRECTORY);
  console.log(rootPath);

  if (!existsSync(rootPath)) {
    console.log("(missing)");
    return;
  }

  for (const name of readdirSync(rootPath)) {
    const runsPath = join(rootPath, name);

    if (existsSync(runsPath) && statSync(runsPath).isDirectory()) {
      printRunsInPath(runsPath, projectPath);
    }
  }
}

function printRunsInPath(runsPath, projectPath = null) {
  if (!existsSync(runsPath)) {
    console.log("(missing)");
    return;
  }

  const runs = readdirSync(runsPath)
    .filter((name) => name !== CAPTURE_INDEX_FILE)
    .map((name) => {
      const runPath = join(runsPath, name);
      const eventsPath = join(runPath, CAPTURE_EVENTS_FILE);
      const startPath = join(runPath, CAPTURE_START_FILE);
      const start = existsSync(startPath) ? JSON.parse(readFileSync(startPath, "utf8")) : {};
      return {
        name,
        protocolVersion: start.protocolVersion ?? "legacy",
        projectPath: start.projectPath ?? null,
        events: existsSync(eventsPath) ? readFileSync(eventsPath, "utf8").split(/\r?\n/).filter(Boolean).length : 0,
        modifiedAt: statSync(runPath).mtimeMs
      };
    })
    .filter((run) => !projectPath || run.projectPath === projectPath || run.projectPath === null)
    .sort((first, second) => second.modifiedAt - first.modifiedAt)
    .slice(0, 20);

  if (runs.length === 0) {
    console.log("(no captured runs)");
    return;
  }

  for (const run of runs) {
    console.log(`${run.name}: v${run.protocolVersion}, ${run.events} event(s)`);
  }
}
