import { open } from "@tauri-apps/plugin-dialog";

import { isTauriRuntime } from "@/core/tauri/tauri-client";

export async function selectProjectFolder(): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw new Error("DESKTOP_RUNTIME_REQUIRED");
  }

  const selectedPath = await open({
    directory: true,
    multiple: false,
    title: "Select project folder"
  });

  return typeof selectedPath === "string" ? selectedPath : null;
}
