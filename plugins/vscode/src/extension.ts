import * as vscode from "vscode";

import { CapturedRunWriter } from "./captured-run-writer";
import {
  isDebugAdapterTerminated,
  isNodeTerminalSession,
  parseDebugAdapterExitCode,
  parseDebugAdapterOutput
} from "./dap";
import { findRegisteredProject } from "./project-matcher";
import type { captureStream } from "./protocol";

const nodeTerminalGroups = new Map<string, nodeTerminalGroup>();
const NODE_TERMINAL_FINISH_DELAY_MS = 1500;

export const activate = (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterTrackerFactory("*", {
      createDebugAdapterTracker(session) {
        let capture: sessionCapture | null = null;
        let exitCode: number | null = null;

        const finish = () => {
          capture?.finish(exitCode);
          capture = null;
        };

        return {
          onWillStartSession() {
            capture = startCaptureForSession(session);
          },
          onDidSendMessage(message) {
            const output = parseDebugAdapterOutput(message);

            if (output) {
              capture?.append(output.stream, output.data);
              return;
            }

            const nextExitCode = parseDebugAdapterExitCode(message);

            if (nextExitCode !== null) {
              exitCode = nextExitCode;
            }

            if (isDebugAdapterTerminated(message)) {
              finish();
            }
          },
          onWillStopSession: finish,
          onError: finish,
          onExit(code) {
            exitCode = typeof code === "number" ? code : exitCode;
            finish();
          }
        };
      }
    })
  );
};

export const deactivate = () => {};

const startCaptureForSession = (session: vscode.DebugSession): sessionCapture | null => {
  const workspaceFolders = collectWorkspaceFolders(session);
  const projectPath = findRegisteredProject(workspaceFolders);

  if (!projectPath) {
    return null;
  }

  if (isNodeTerminalSession(session)) {
    return startNodeTerminalCapture(projectPath, session);
  }

  try {
    const writer = CapturedRunWriter.start(projectPath, commandLabel(session));
    return {
      append: (stream, data) => writer.append(stream, data),
      finish: (exitCode) => writer.finish(exitCode)
    };
  } catch (error) {
    console.warn("[kivra] unable to start VS Code capture", error);
    return null;
  }
};

const startNodeTerminalCapture = (
  projectPath: string,
  session: vscode.DebugSession
): sessionCapture | null => {
  try {
    const group = getOrCreateNodeTerminalGroup(projectPath, session);
    group.activeSessions += 1;

    if (group.finishTimer) {
      clearTimeout(group.finishTimer);
      group.finishTimer = null;
    }

    return {
      append: (stream, data) => group.writer.append(stream, data),
      finish: (exitCode) => {
        if (typeof exitCode === "number" && exitCode !== 0) {
          group.exitCode = exitCode;
        }

        group.activeSessions = Math.max(0, group.activeSessions - 1);

        if (group.activeSessions > 0) {
          return;
        }

        group.finishTimer = setTimeout(() => {
          group.writer.finish(group.exitCode);
          nodeTerminalGroups.delete(projectPath);
        }, NODE_TERMINAL_FINISH_DELAY_MS);
      }
    };
  } catch (error) {
    console.warn("[kivra] unable to start VS Code terminal capture", error);
    return null;
  }
};

const getOrCreateNodeTerminalGroup = (
  projectPath: string,
  session: vscode.DebugSession
) => {
  const existingGroup = nodeTerminalGroups.get(projectPath);

  if (existingGroup) {
    return existingGroup;
  }

  const group: nodeTerminalGroup = {
    activeSessions: 0,
    exitCode: null,
    finishTimer: null,
    writer: CapturedRunWriter.start(projectPath, nodeTerminalCommandLabel(session))
  };
  nodeTerminalGroups.set(projectPath, group);

  return group;
};

const collectWorkspaceFolders = (session: vscode.DebugSession) => {
  const folders = new Set<string>();

  if (session.workspaceFolder?.uri.scheme === "file") {
    folders.add(session.workspaceFolder.uri.fsPath);
  }

  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    if (folder.uri.scheme === "file") {
      folders.add(folder.uri.fsPath);
    }
  }

  return Array.from(folders);
};

const commandLabel = (session: vscode.DebugSession) => {
  const name = session.name || "Debug";
  const type = session.type || "debug";
  const request = typeof session.configuration.request === "string"
    ? session.configuration.request
    : "launch";

  return `${name} (${type}:${request})`;
};

const nodeTerminalCommandLabel = (session: vscode.DebugSession) =>
  `${session.name || "Node terminal"} (node-terminal:attach)`;

type sessionCapture = {
  append: (stream: captureStream, data: string) => void;
  finish: (exitCode: number | null) => void;
};

type nodeTerminalGroup = {
  activeSessions: number;
  exitCode: number | null;
  finishTimer: NodeJS.Timeout | null;
  writer: CapturedRunWriter;
};
