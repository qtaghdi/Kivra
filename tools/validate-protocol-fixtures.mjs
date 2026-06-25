#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CAPTURE_PROTOCOL_VERSION = 1;
const fixtureRoot = join(process.cwd(), "packages", "protocol", "fixtures", "captured-run");

const start = readJson(join(fixtureRoot, "start.json"));
const end = readJson(join(fixtureRoot, "end.json"));
const events = readFileSync(join(fixtureRoot, "events.jsonl"), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

assertEqual(start.type, "start", "start.type");
assertEqual(start.protocolVersion, CAPTURE_PROTOCOL_VERSION, "start.protocolVersion");
assertString(start.id, "start.id");
assertString(start.projectPath, "start.projectPath");
assertString(start.command, "start.command");
assertString(start.startedAt, "start.startedAt");
assertOneOf(start.captureMode, ["shell", "jetbrains", "vscode"], "start.captureMode");

for (const [index, event] of events.entries()) {
  assertEqual(event.type, "output", `events[${index}].type`);
  assertEqual(event.protocolVersion, CAPTURE_PROTOCOL_VERSION, `events[${index}].protocolVersion`);
  assertOneOf(event.stream, ["stdout", "stderr"], `events[${index}].stream`);
  assertString(event.data, `events[${index}].data`);
}

assertEqual(end.type, "end", "end.type");
assertEqual(end.protocolVersion, CAPTURE_PROTOCOL_VERSION, "end.protocolVersion");
assertString(end.finishedAt, "end.finishedAt");
assertNumber(end.durationMs, "end.durationMs");

console.log("protocol fixtures are valid");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label}: expected string`);
  }
}

function assertNumber(value, label) {
  if (typeof value !== "number") {
    throw new Error(`${label}: expected number`);
  }
}

function assertOneOf(value, allowedValues, label) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${label}: expected one of ${allowedValues.join(", ")}`);
  }
}
