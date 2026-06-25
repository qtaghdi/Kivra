import { motion } from "framer-motion";
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
      className="overflow-hidden rounded-md border bg-card"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{t("runs.command")}</th>
            <th className="px-3 py-2 font-medium">{t("runs.status")}</th>
            <th className="px-3 py-2 font-medium">{t("runs.duration")}</th>
            <th className="px-3 py-2 font-medium">{t("runs.timestamp")}</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, index) => (
            <motion.tr
              key={run.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: "easeOut" }}
              className={cn(
                "h-10 cursor-pointer border-t transition hover:bg-muted",
                selectedRun?.id === run.id && "bg-muted"
              )}
              onClick={() => onSelectRun(run)}
            >
              <td className="px-3 py-2 font-mono text-xs">{run.command}</td>
              <td className="px-3 py-2">{run.status}</td>
              <td className="px-3 py-2">{run.duration} ms</td>
              <td className="px-3 py-2">{new Date(run.createdAt).toLocaleString()}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};
