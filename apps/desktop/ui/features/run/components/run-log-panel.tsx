import { motion } from "framer-motion";
import { AlertTriangle, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { runResult } from "@/features/run/types/run";

type runLogPanelProps = {
  run: runResult | null;
};

export function RunLogPanel({ run }: runLogPanelProps) {
  const { t } = useTranslation();

  if (!run) {
    return (
      <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
        {t("runs.selectRun")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="grid gap-3"
    >
      <div className="rounded-md border bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Terminal className="h-4 w-4" />
              {t("runs.output")}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {run.command}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("runs.exitCode")}: {run.exitCode ?? "-"}
          </div>
        </div>
      </div>

      <OutputBlock label={t("runs.stdout")} value={run.stdout} />
      <OutputBlock label={t("runs.stderr")} value={run.stderr} tone="danger" />

      {run.errors.length > 0 && (
        <div className="rounded-md border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t("runs.detectedErrors")}
          </div>
          <div className="space-y-2">
            {run.errors.map((error, index) => (
              <div
                key={error.id}
                className="rounded-md border bg-muted p-3"
              >
                <div className="text-sm">{error.message}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {error.filePath ?? "raw"}:{error.lineNumber ?? "-"}:
                  {error.columnNumber ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

type outputBlockProps = {
  label: string;
  tone?: "default" | "danger";
  value: string;
};

function OutputBlock({ label, tone = "default", value }: outputBlockProps) {
  const { t } = useTranslation();
  const content = value.trim() || t("runs.noOutput");

  return (
    <div className="rounded-md border bg-white">
      <div className="border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <pre
        className={
          tone === "danger"
            ? "max-h-[260px] overflow-auto p-4 font-mono text-xs text-destructive"
            : "max-h-[260px] overflow-auto p-4 font-mono text-xs"
        }
      >
        {content}
      </pre>
    </div>
  );
}
