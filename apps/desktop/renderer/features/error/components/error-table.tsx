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
      <div className="rounded-md border bg-card p-4">
        <div className="text-sm font-medium">{t("errors.empty")}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("errors.emptyDetail")}
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
            <th className="px-3 py-2 font-medium">{t("errors.message")}</th>
            <th className="px-3 py-2 font-medium">{t("errors.filePath")}</th>
            <th className="px-3 py-2 font-medium">{t("errors.line")}</th>
            <th className="px-3 py-2 font-medium">{t("errors.status")}</th>
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
                    ? "h-10 cursor-pointer border-t bg-muted"
                    : "h-10 cursor-pointer border-t transition hover:bg-muted"
                }
                onClick={() => onSelectError(error)}
              >
                <td className="max-w-[420px] px-3 py-2">{error.message}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {error.filePath ?? t("errors.rawOutput")}
                </td>
                <td className="px-3 py-2">{error.lineNumber ?? "-"}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      isResolved
                        ? "rounded border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        : "rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
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
