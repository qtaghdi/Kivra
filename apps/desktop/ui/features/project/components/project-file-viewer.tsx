import { motion } from "framer-motion";
import { FileCode } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useProjectFile } from "@/features/project/hooks/use-project-file";

type projectFileViewerProps = {
  filePath: string | null;
  projectPath: string;
};

export function ProjectFileViewer({ filePath, projectPath }: projectFileViewerProps) {
  const { t } = useTranslation();
  const file = useProjectFile({ filePath, projectPath });

  if (!filePath) {
    return (
      <EmptyState message={t("explorer.selectFile")} />
    );
  }

  if (!isTauriRuntime()) {
    return (
      <EmptyState message={t("runtime.desktopRequiredDetail")} />
    );
  }

  if (file.isLoading) {
    return <EmptyState message={t("explorer.loadingFile")} />;
  }

  if (file.isError || !file.data) {
    return <EmptyState message={t("explorer.fileReadFailed")} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="h-full overflow-hidden rounded-md border bg-white"
    >
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode className="h-4 w-4" />
            <span className="truncate">{file.data.path}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {file.data.size.toLocaleString()} bytes
          </div>
        </div>
        {file.data.truncated && (
          <div className="shrink-0 text-xs text-muted-foreground">
            {t("explorer.truncated")}
          </div>
        )}
      </div>
      <pre className="h-[calc(100%-65px)] overflow-auto p-4 font-mono text-xs">
        {file.data.content}
      </pre>
    </motion.div>
  );
}

type emptyStateProps = {
  message: string;
};

function EmptyState({ message }: emptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border bg-white p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
