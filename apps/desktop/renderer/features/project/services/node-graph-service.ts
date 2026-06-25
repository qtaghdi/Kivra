export type codeNodeCategory =
  | "imports"
  | "exports"
  | "declarations"
  | "hooks"
  | "functions"
  | "constants";

export type codeNodeType = codeNodeCategory | "file" | "more";

export type codeNode = {
  category: codeNodeCategory;
  codePreview: string;
  connectedNodeIds: string[];
  filePath: string;
  id: string;
  lineNumber: number;
  name: string;
  type: codeNodeType;
};

export type codeNodeGroup = {
  count: number;
  id: codeNodeCategory;
  label: string;
  nodes: codeNode[];
};

export type codeNodeGraph = {
  fileNode: codeNode;
  groups: codeNodeGroup[];
  isLargeFile: boolean;
  totalNodeCount: number;
};

export const NODE_GROUPS: Array<{
  id: codeNodeCategory;
  label: string;
}> = [
  { id: "imports", label: "Imports" },
  { id: "exports", label: "Exports" },
  { id: "declarations", label: "Declarations" },
  { id: "hooks", label: "Hooks" },
  { id: "functions", label: "Functions" },
  { id: "constants", label: "Constants" }
];

export const buildCodeNodeGraph = ({
  content,
  filePath,
  language
}: {
  content: string;
  filePath: string;
  language: string;
}): codeNodeGraph | null => {
  const groupedNodes = parseCodeNodes({ content, filePath, language });
  const groups = NODE_GROUPS.map((group) => ({
    ...group,
    count: groupedNodes[group.id].length,
    nodes: groupedNodes[group.id]
  }));
  const totalNodeCount = groups.reduce((total, group) => total + group.count, 0);

  if (totalNodeCount === 0) {
    return null;
  }

  return {
    fileNode: {
      category: "declarations",
      codePreview: "",
      connectedNodeIds: groups.map((group) => `category:${group.id}`),
      filePath,
      id: "file",
      lineNumber: 1,
      name: getFileName(filePath),
      type: "file"
    },
    groups,
    isLargeFile: totalNodeCount > 100,
    totalNodeCount
  };
};

const parseCodeNodes = ({
  content,
  filePath,
  language
}: {
  content: string;
  filePath: string;
  language: string;
}): Record<codeNodeCategory, codeNode[]> => {
  const groups: Record<codeNodeCategory, codeNode[]> = {
    imports: [],
    exports: [],
    declarations: [],
    hooks: [],
    functions: [],
    constants: []
  };

  content.split("\n").forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    const node = parseLine({
      filePath,
      language,
      lineNumber: index + 1,
      trimmedLine
    });

    if (!node) {
      return;
    }

    groups[node.category].push(node);
  });

  return linkRelatedNodes(groups);
};

const parseLine = ({
  filePath,
  language,
  lineNumber,
  trimmedLine
}: {
  filePath: string;
  language: string;
  lineNumber: number;
  trimmedLine: string;
}): codeNode | null => {
  const importMatch = trimmedLine.match(
    /^import\s+(?:(.+?)\s+from\s+)?["']([^"']+)["']/
  );
  const exportMatch = trimmedLine.match(/^export\s+(.+)/);

  if (importMatch) {
    return createCodeNode({
      category: "imports",
      codePreview: trimmedLine,
      filePath,
      lineNumber,
      name: importMatch[2] ?? importMatch[1] ?? "import"
    });
  }

  if (exportMatch) {
    return createCodeNode({
      category: "exports",
      codePreview: trimmedLine,
      filePath,
      lineNumber,
      name: getExportName(exportMatch[1])
    });
  }

  const hookMatch =
    trimmedLine.match(
      /^(?:const|let|var|function)\s+(use[A-Z][A-Za-z0-9_$]*)/
    ) ?? trimmedLine.match(/^(use[A-Z][A-Za-z0-9_$]*)\s*=/);

  if (hookMatch) {
    return createCodeNode({
      category: "hooks",
      codePreview: trimmedLine,
      filePath,
      lineNumber,
      name: hookMatch[1]
    });
  }

  const functionMatch =
    trimmedLine.match(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)/) ??
    trimmedLine.match(/^(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\(?[^=]*\)?\s*=>/) ??
    trimmedLine.match(/^(?:pub\s+)?fn\s+([A-Za-z0-9_]+)/);

  if (functionMatch) {
    return createCodeNode({
      category: "functions",
      codePreview: trimmedLine,
      filePath,
      lineNumber,
      name: functionMatch[1]
    });
  }

  const constantMatch = trimmedLine.match(/^(?:export\s+)?const\s+([A-Za-z0-9_$]+)/);

  if (constantMatch) {
    return createCodeNode({
      category: "constants",
      codePreview: trimmedLine,
      filePath,
      lineNumber,
      name: constantMatch[1]
    });
  }

  const declarationMatch =
    trimmedLine.match(
      /^(?:export\s+)?(?:type|class|interface|enum)\s+([A-Za-z0-9_$]+)/
    ) ??
    trimmedLine.match(/^(?:pub\s+)?(?:struct|enum|type|mod)\s+([A-Za-z0-9_]+)/);

  if (declarationMatch) {
    return createCodeNode({
      category: "declarations",
      codePreview: trimmedLine,
      filePath,
      lineNumber,
      name: declarationMatch[1]
    });
  }

  if (language === "JSON") {
    const jsonKeyMatch = trimmedLine.match(/^"([^"]+)":/);

    if (jsonKeyMatch) {
      return createCodeNode({
        category: "declarations",
        codePreview: trimmedLine,
        filePath,
        lineNumber,
        name: jsonKeyMatch[1]
      });
    }
  }

  if (language === "Markdown") {
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      return createCodeNode({
        category: "declarations",
        codePreview: trimmedLine,
        filePath,
        lineNumber,
        name: headingMatch[2]
      });
    }
  }

  return null;
};

const createCodeNode = ({
  category,
  codePreview,
  filePath,
  lineNumber,
  name
}: {
  category: codeNodeCategory;
  codePreview: string;
  filePath: string;
  lineNumber: number;
  name: string;
}): codeNode => ({
  category,
  codePreview,
  connectedNodeIds: [`category:${category}`],
  filePath,
  id: `${category}:${lineNumber}:${slugify(name)}`,
  lineNumber,
  name,
  type: category
});

const linkRelatedNodes = (
  groups: Record<codeNodeCategory, codeNode[]>
): Record<codeNodeCategory, codeNode[]> => {
  const allNodes = Object.values(groups).flat();

  for (const node of allNodes) {
    for (const candidate of allNodes) {
      if (node.id === candidate.id) {
        continue;
      }

      if (
        node.codePreview.includes(candidate.name) ||
        candidate.codePreview.includes(node.name)
      ) {
        node.connectedNodeIds.push(candidate.id);
      }
    }
  }

  return groups;
};

const getExportName = (value: string) => {
  const namedExport = value.match(/^(?:const|let|var|function|type|class|interface)\s+([A-Za-z0-9_$]+)/);

  if (namedExport) {
    return namedExport[1];
  }

  if (value.startsWith("{")) {
    return "named exports";
  }

  if (value.startsWith("default")) {
    return "default";
  }

  return value.slice(0, 40);
};

export const getFileName = (filePath: string) => {
  const parts = filePath.split(/[\\/]/);

  return parts[parts.length - 1] || filePath;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_$]+/gi, "-")
    .replace(/^-+|-+$/g, "");
