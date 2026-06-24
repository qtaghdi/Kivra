import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { detectedError } from "@/features/error/types/error";

type errorTableProps = {
  errors: detectedError[];
  onSelectError: (error: detectedError) => void;
  resolvedErrorIds?: Set<string>;
  selectedError: detectedError | null;
};

export function ErrorTable({
  errors,
  onSelectError,
  resolvedErrorIds = new Set(),
  selectedError
}: errorTableProps) {
  const { t } = useTranslation();

  if (errors.length === 0) {
    return (
      <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
        {t("errors.empty")}
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
            <th className="px-4 py-3 font-medium">{t("errors.message")}</th>
            <th className="px-4 py-3 font-medium">{t("errors.filePath")}</th>
            <th className="px-4 py-3 font-medium">{t("errors.line")}</th>
            <th className="px-4 py-3 font-medium">{t("errors.status")}</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error, index) => {
            const isResolved = resolvedErrorIds.has(error.id);

            return (
              <motion.tr
                key={error.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: index * 0.025, ease: "easeOut" }}
                className={
                  selectedError?.id === error.id
                    ? "cursor-pointer border-t bg-muted"
                    : "cursor-pointer border-t transition hover:bg-muted/70"
                }
                onClick={() => onSelectError(error)}
              >
                <td className="max-w-[420px] px-4 py-3">{error.message}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {error.filePath ?? t("errors.rawOutput")}
                </td>
                <td className="px-4 py-3">{error.lineNumber ?? "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      isResolved
                        ? "rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                        : "rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
                    }
                  >
                    {isResolved ? t("errors.resolved") : t("errors.open")}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
