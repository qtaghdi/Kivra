import { create } from "zustand";
import { persist } from "zustand/middleware";

type projectStore = {
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
};

export const useProjectStore = create<projectStore>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId })
    }),
    {
      name: "kivra.selected-project"
    }
  )
);
