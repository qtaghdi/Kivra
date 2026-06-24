import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getErrorNote,
  saveErrorNote
} from "@/features/docs/services/note-service";
import type { detectedError } from "@/features/error";
import { Button } from "@/shared/ui/button";

type resolutionNotesProps = {
  error: detectedError | null;
  onNoteSaved?: () => void;
  projectId: string;
};

export function ResolutionNotes({
  error,
  onNoteSaved,
  projectId
}: resolutionNotesProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(() =>
    error ? getErrorNote({ errorId: error.id, projectId })?.content ?? "" : ""
  );

  useEffect(() => {
    setContent(error ? getErrorNote({ errorId: error.id, projectId })?.content ?? "" : "");
  }, [error, projectId]);

  function handleSave() {
    if (!error) {
      return;
    }

    saveErrorNote({
      content,
      errorId: error.id,
      projectId
    });
    onNoteSaved?.();
  }

  if (!error) {
    return (
      <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
        {t("notes.selectError")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-3"
    >
      <section className="rounded-md border bg-white p-4">
        <div className="text-xs font-medium uppercase text-muted-foreground">
          {t("errors.detail")}
        </div>
        <h2 className="mt-2 text-sm font-medium">{error.message}</h2>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <DetailItem
            label={t("errors.filePath")}
            value={error.filePath ?? t("errors.rawOutput")}
          />
          <DetailItem label={t("errors.line")} value={error.lineNumber ?? "-"} />
          <DetailItem
            label={t("errors.column")}
            value={error.columnNumber ?? "-"}
          />
        </div>
        {error.stackTrace.trim().length > 0 && (
          <pre className="mt-3 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
            {error.stackTrace}
          </pre>
        )}
      </section>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={t("notes.placeholder")}
        className="min-h-[320px] w-full resize-none rounded-md border bg-white p-3 text-sm outline-none focus:border-primary"
      />
      <Button type="button" variant="primary" onClick={handleSave}>
        <Save className="h-4 w-4" />
        {t("notes.save")}
      </Button>
    </motion.div>
  );
}

type detailItemProps = {
  label: string;
  value: number | string;
};

function DetailItem({ label, value }: detailItemProps) {
  return (
    <div className="min-w-0 rounded bg-muted px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-mono">{value}</div>
    </div>
  );
}
