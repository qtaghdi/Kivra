import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getMergedProjectNotes,
  getProjectNotes
} from "@/features/docs/services/note-service";
import type { resolutionNote } from "@/features/docs/types/note";
import type { detectedError } from "@/features/error";

type knowledgeListProps = {
  errors: detectedError[];
  refreshKey?: number;
  projectId: string;
};

export const KnowledgeList = ({
  errors,
  refreshKey = 0,
  projectId
}: knowledgeListProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<resolutionNote[]>(() =>
    getProjectNotes(projectId)
  );

  useEffect(() => {
    let isActive = true;

    setNotes(getProjectNotes(projectId));

    const loadNotes = async () => {
      const nextNotes = await getMergedProjectNotes(projectId);

      if (isActive) {
        setNotes(nextNotes);
      }
    };

    void loadNotes();

    return () => {
      isActive = false;
    };
  }, [projectId, refreshKey]);

  const searchableItems = useMemo(
    () =>
      notes.map((note) => ({
        note,
        error:
          note.kind === "error"
            ? errors.find((error) => error.id === note.errorId) ?? null
            : null
      })),
    [errors, notes]
  );
  const filteredItems = searchableItems.filter((item) => {
    const haystack = [
      item.note.content,
      item.note.kind === "project" ? t("notes.projectMemo") : null,
      item.error?.message,
      item.error?.filePath
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-3">
      <div className="flex h-8 items-center gap-2 rounded-md border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("knowledge.searchPlaceholder")}
          className="h-full flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {filteredItems.length === 0 ? (
        <div className="rounded-md border bg-card p-4">
          <div className="text-sm font-medium">{t("knowledge.empty")}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("knowledge.emptyDetail")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <article key={item.note.id} className="rounded-md border bg-card p-3">
              <div className="text-sm font-medium">
                {item.note.kind === "project"
                  ? t("notes.projectMemo")
                  : item.error?.message ?? t("knowledge.unknownError")}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {item.note.kind === "project"
                  ? t("knowledge.projectWide")
                  : item.error?.filePath ?? "raw"}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{item.note.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
