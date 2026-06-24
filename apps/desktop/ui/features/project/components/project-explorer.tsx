import { ChevronRight, File, Folder } from "lucide-react";
import { useState } from "react";

import type { projectNode } from "@/features/project/types/project";
import { cn } from "@/shared/lib/utils";

type projectExplorerProps = {
  onSelectFile: (filePath: string) => void;
  selectedFilePath: string | null;
  tree: projectNode;
};

type projectNodeRowProps = {
  node: projectNode;
  depth: number;
  onSelectFile: (filePath: string) => void;
  selectedFilePath: string | null;
};

function ProjectNodeRow({
  node,
  depth,
  onSelectFile,
  selectedFilePath
}: projectNodeRowProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex h-8 w-full items-center gap-1 border-b px-2 text-left text-sm transition hover:bg-muted",
          selectedFilePath === node.path && "bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (node.type === "file") {
            onSelectFile(node.path);
          } else {
            setIsOpen((value) => !value);
          }
        }}
      >
        {node.type === "folder" ? (
          <span className="flex h-6 w-6 items-center justify-center">
            <ChevronRight
              className={cn("h-4 w-4 transition", isOpen && "rotate-90")}
            />
          </span>
        ) : (
          <span className="h-6 w-6" />
        )}
        {node.type === "folder" ? (
          <Folder className="h-4 w-4 text-primary" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen &&
        node.children?.map((childNode) => (
          <ProjectNodeRow
            key={childNode.id}
            node={childNode}
            depth={depth + 1}
            onSelectFile={onSelectFile}
            selectedFilePath={selectedFilePath}
          />
        ))}
    </div>
  );
}

export function ProjectExplorer({
  onSelectFile,
  selectedFilePath,
  tree
}: projectExplorerProps) {
  return (
    <div className="h-full overflow-auto rounded-md border bg-white">
      <ProjectNodeRow
        node={tree}
        depth={0}
        onSelectFile={onSelectFile}
        selectedFilePath={selectedFilePath}
      />
    </div>
  );
}
