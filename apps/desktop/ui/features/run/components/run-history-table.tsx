import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { runResult } from "@/features/run/types/run";
import { cn } from "@/shared/lib/utils";

type runHistoryTableProps = {
  onSelectRun: (run: runResult) => void;
  runs: runResult[];
  selectedRun: runResult | null;
};

export function RunHistoryTable({
  onSelectRun,
  runs,
  selectedRun
}: runHistoryTableProps) {
  const { t } = useTranslation();

  if (runs.length === 0) {
    return (
      <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
        {t("runs.empty")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden rounded-md border bg-white shadow-sm"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">{t("runs.command")}</th>
            <th className="px-4 py-3 font-medium">{t("runs.status")}</th>
            <th className="px-4 py-3 font-medium">{t("runs.duration")}</th>
            <th className="px-4 py-3 font-medium">{t("runs.timestamp")}</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, index) => (
            <motion.tr
              key={`${run.createdAt}-${run.command}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: "easeOut" }}
              className={cn(
                "cursor-pointer border-t transition hover:bg-muted/70",
                selectedRun?.createdAt === run.createdAt &&
                  selectedRun.command === run.command &&
                  "bg-muted"
              )}
              onClick={() => onSelectRun(run)}
            >
              <td className="px-4 py-3 font-mono text-xs">{run.command}</td>
              <td className="px-4 py-3">{run.status}</td>
              <td className="px-4 py-3">{run.duration} ms</td>
              <td className="px-4 py-3">{new Date(run.createdAt).toLocaleString()}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
