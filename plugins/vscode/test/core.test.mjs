import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { CapturedRunWriter } from "../out/captured-run-writer.js";
import { isNodeTerminalSession, parseDebugAdapterExitCode, parseDebugAdapterOutput } from "../out/dap.js";
import { findRegisteredProject } from "../out/project-matcher.js";
import { sanitizeOutput } from "../out/sanitizer.js";

test("sanitizes terminal control sequences", () => {
  assert.equal(
    sanitizeOutput("\u001b[31mred\u001b[0m\r\n]1341;command_started;command=abc\u0007ok\u0000"),
    "red\nok"
  );
});

test("matches registered parent project", () => {
  const root = mkdtempSync(join(tmpdir(), "kivra-vscode-project-"));
  const child = join(root, "packages", "web");
  const projectsFile = join(root, "trace-projects.json");
  mkdirSync(child, { recursive: true });
  writeFileSync(projectsFile, JSON.stringify([root]));

  assert.equal(findRegisteredProject([child], projectsFile), realpathSync(root));
});

test("parses debug adapter output and exit messages", () => {
  assert.deepEqual(
    parseDebugAdapterOutput({
      event: "output",
      body: { category: "stderr", output: "failed\n" }
    }),
    { stream: "stderr", data: "failed\n" }
  );
  assert.equal(
    parseDebugAdapterExitCode({
      event: "exited",
      body: { exitCode: 2 }
    }),
    2
  );
});

test("detects node terminal debug sessions", () => {
  assert.equal(
    isNodeTerminalSession({
      type: "node-terminal",
      configuration: { request: "attach" }
    }),
    true
  );
  assert.equal(
    isNodeTerminalSession({
      type: "node",
      configuration: { request: "attach" }
    }),
    false
  );
  assert.equal(
    isNodeTerminalSession({
      type: "node",
      configuration: { request: "launch" }
    }),
    false
  );
});

test("writes captured run protocol files", () => {
  const root = mkdtempSync(join(tmpdir(), "kivra-vscode-writer-"));
  const originalHome = process.env.HOME;
  process.env.HOME = root;

  try {
    const writer = CapturedRunWriter.start(root, "Debug (node:launch)");
    writer.append("stdout", "hello\u001b[0m\n");
    writer.finish(0);

    const capturedRoot = join(root, ".kivra", "captured-runs");
    const projectKey = readdirSync(capturedRoot)[0];
    const runId = readdirSync(join(capturedRoot, projectKey)).find((entry) => entry !== "index.jsonl");
    assert.ok(runId);

    const indexContent = readFileSync(join(capturedRoot, projectKey, "index.jsonl"), "utf8");
    const eventsContent = readFileSync(join(capturedRoot, projectKey, runId, "events.jsonl"), "utf8");
    assert.match(indexContent, /"captureMode":"vscode"/);
    assert.match(eventsContent, /"data":"hello\\n"/);
    assert.equal(existsSync(join(capturedRoot, projectKey, runId, "end.json")), true);
  } finally {
    if (originalHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
  }
});
