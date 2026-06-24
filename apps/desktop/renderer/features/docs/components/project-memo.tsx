import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getMergedProjectNotes,
  getProjectMemo,
  saveProjectMemo
} from "@/features/docs/services/note-service";
import { Button } from "@/shared/ui/button";

type projectMemoProps = {
  onMemoSaved?: () => void;
  projectId: string;
};

export const ProjectMemo = ({ onMemoSaved, projectId }: projectMemoProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(
    () => getProjectMemo(projectId)?.content ?? ""
  );

  useEffect(() => {
    let isActive = true;

    setContent(getProjectMemo(projectId)?.content ?? "");

    const loadMemo = async () => {
      await getMergedProjectNotes(projectId);

      if (isActive) {
        setContent(getProjectMemo(projectId)?.content ?? "");
      }
    };

    void loadMemo();

    return () => {
      isActive = false;
    };
  }, [projectId]);

  const handleSave = () => {
    saveProjectMemo({
      content,
      projectId
    });
    onMemoSaved?.();
  };

  return (
    <section className="rounded-md border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{t("notes.projectMemo")}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("notes.projectMemoDetail")}
          </div>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={handleSave}>
          <Save className="h-4 w-4" />
          {t("notes.save")}
        </Button>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={t("notes.projectMemoPlaceholder")}
        className="mt-3 min-h-32 w-full resize-none rounded-md border bg-background p-3 text-sm outline-none focus:border-foreground"
      />
    </section>
  );
};
