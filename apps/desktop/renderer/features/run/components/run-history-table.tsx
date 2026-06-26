import { motion } from "framer-motion";
import { Clock3, TerminalSquare, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { runResult } from "@/features/run/types/run";
import { cn } from "@/shared/lib/utils";

type runHistoryTableProps = {
  onSelectRun: (run: runResult) => void;
  runs: runResult[];
  selectedRun: runResult | null;
};

export const RunHistoryTable = ({
  onSelectRun,
  runs,
  selectedRun
}: runHistoryTableProps) => {
  const { t } = useTranslation();

  if (runs.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4">
        <div className="text-sm font-medium">{t("runs.empty")}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("runs.emptyDetail")}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border bg-card"
    >
      <div className="border-b px-3 py-3">
        <div className="text-sm font-medium">{t("runs.history")}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("runs.historyCount", { count: runs.length })}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <div className="grid gap-2">
          {runs.map((run, index) => (
            <motion.button
              key={run.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.18,
                delay: Math.min(index * 0.025, 0.18),
                ease: "easeOut"
              }}
              className={cn(
                "rounded-md border bg-background p-3 text-left transition hover:border-foreground/20 hover:bg-muted",
                selectedRun?.id === run.id && "border-foreground/20 bg-muted"
              )}
              onClick={() => onSelectRun(run)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="truncate font-mono text-xs"
                    title={run.command}
                  >
                    {run.command}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <RunMetaChip
                      icon={<TerminalSquare className="h-3.5 w-3.5" />}
                      value={run.status}
                      tone={run.status === "FAILED" ? "danger" : "default"}
                    />
                    <RunMetaChip
                      icon={<Timer className="h-3.5 w-3.5" />}
                      value={`${run.duration} ms`}
                    />
                    <RunMetaChip
                      icon={<Clock3 className="h-3.5 w-3.5" />}
                      value={new Date(run.createdAt).toLocaleTimeString()}
                    />
                  </div>
                </div>
                {run.errors.length > 0 && (
                  <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
                    {t("runs.errorCount", { count: run.errors.length })}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const RunMetaChip = ({
  icon,
  tone = "default",
  value
}: {
  icon: ReactNode;
  tone?: "default" | "danger";
  value: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]",
      tone === "danger"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-border bg-card text-muted-foreground"
    )}
  >
    {icon}
    {value}
  </span>
);
