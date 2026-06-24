export type noteKind = "error" | "project";

export type resolutionNote = {
  id: string;
  errorId: string | null;
  projectId: string;
  content: string;
  kind: noteKind;
  createdAt: string;
  updatedAt: string;
};
