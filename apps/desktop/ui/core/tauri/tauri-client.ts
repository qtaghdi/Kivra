import { invoke } from "@tauri-apps/api/core";

export function isTauriRuntime() {
  const runtimeWindow = globalThis as typeof globalThis & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  };

  return Boolean(runtimeWindow.__TAURI__ || runtimeWindow.__TAURI_INTERNALS__);
}

export async function invokeCommand<TResult>(
  command: string,
  args?: Record<string, unknown>
): Promise<TResult> {
  if (!isTauriRuntime()) {
    throw new Error("DESKTOP_RUNTIME_REQUIRED");
  }

  return invoke<TResult>(command, args);
}
