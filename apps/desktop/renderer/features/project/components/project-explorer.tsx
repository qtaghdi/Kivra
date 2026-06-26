import { ChevronRight, File, Folder, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { projectNode } from "@/features/project/types/project";
import { updateNodeChildren } from "@/features/project/utils/project-tree";
import { cn } from "@/shared/lib/utils";

type projectExplorerProps = {
  onLoadDirectory?: (directoryPath: string) => Promise<projectNode[]>;
  onSelectFile: (filePath: string) => void;
  selectedFilePath: string | null;
  tree: projectNode;
};

type projectNodeRowProps = {
  node: projectNode;
  depth: number;
  forceOpen?: boolean;
  loadingPath: string | null;
  onLoadDirectory?: (directoryPath: string) => Promise<void>;
  onSelectFile: (filePath: string) => void;
  selectedFilePath: string | null;
};

const ProjectNodeRow = ({
  node,
  depth,
  forceOpen = false,
  loadingPath,
  onLoadDirectory,
  onSelectFile,
  selectedFilePath
}: projectNodeRowProps) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isLoading = loadingPath === node.path;

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen, node]);

  const handleNodeClick = async () => {
    if (node.type === "file") {
      onSelectFile(node.path);
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (!node.children && onLoadDirectory) {
      await onLoadDirectory(node.path);
    }

    setIsOpen(true);
  };

  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex h-7 w-full items-center gap-1 border-b px-2 text-left text-xs transition hover:bg-muted",
          selectedFilePath === node.path && "bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        disabled={isLoading}
        onClick={() => {
          void handleNodeClick();
        }}
      >
        {node.type === "folder" ? (
          <span className="flex h-6 w-6 items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight
                className={cn("h-4 w-4 transition", isOpen && "rotate-90")}
              />
            )}
          </span>
        ) : (
          <span className="h-6 w-6" />
        )}
        {node.type === "folder" ? (
          <Folder className="h-4 w-4 text-muted-foreground" />
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
            forceOpen={forceOpen}
            loadingPath={loadingPath}
            onLoadDirectory={onLoadDirectory}
            onSelectFile={onSelectFile}
            selectedFilePath={selectedFilePath}
          />
        ))}
    </div>
  );
};

export const ProjectExplorer = ({
  onLoadDirectory,
  onSelectFile,
  selectedFilePath,
  tree
}: projectExplorerProps) => {
  const { t } = useTranslation();
  const [visibleTree, setVisibleTree] = useState(tree);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setVisibleTree(tree);
  }, [tree]);

  const filteredTree = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return visibleTree;
    }

    return filterProjectTree(visibleTree, normalizedQuery);
  }, [query, visibleTree]);
  const isSearching = query.trim().length > 0;

  const handleLoadDirectory = async (directoryPath: string) => {
    if (!onLoadDirectory) {
      return;
    }

    setLoadingPath(directoryPath);

    try {
      const children = await onLoadDirectory(directoryPath);

      setVisibleTree((currentTree) =>
        updateNodeChildren(currentTree, directoryPath, children)
      );
    } finally {
      setLoadingPath(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border bg-card">
      <div className="border-b p-3">
        <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("explorer.searchPlaceholder")}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {filteredTree ? (
          <ProjectNodeRow
            node={filteredTree}
            depth={0}
            forceOpen={isSearching}
            loadingPath={loadingPath}
            onLoadDirectory={handleLoadDirectory}
            onSelectFile={onSelectFile}
            selectedFilePath={selectedFilePath}
          />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            {t("explorer.searchEmpty")}
          </div>
        )}
      </div>
    </div>
  );
};

const filterProjectTree = (
  node: projectNode,
  normalizedQuery: string
): projectNode | null => {
  const matchesSelf = node.name.toLowerCase().includes(normalizedQuery);
  const matchingChildren =
    node.children
      ?.map((childNode) => filterProjectTree(childNode, normalizedQuery))
      .filter((childNode): childNode is projectNode => childNode !== null) ?? [];

  if (!matchesSelf && matchingChildren.length === 0) {
    return null;
  }

  return {
    ...node,
    children: node.type === "folder" ? matchingChildren : node.children
  };
};
