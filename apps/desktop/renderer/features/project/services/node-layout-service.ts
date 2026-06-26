import type { CSSProperties } from "react";

import type { Edge, Node } from "@xyflow/react";

import type {
  codeNode,
  codeNodeCategory,
  codeNodeGraph,
  codeNodeType
} from "@/features/project/services/node-graph-service";

export type nodeGraphViewState = {
  expandedGroups: Set<codeNodeCategory>;
  expandedMoreGroups: Set<codeNodeCategory>;
  pinnedGroups: Set<codeNodeCategory>;
  searchQuery: string;
  selectedNodeId: string;
};

export type nodeGraphNodeData = Record<string, unknown> & {
  category?: codeNodeCategory;
  codeNode?: codeNode;
  count?: number;
  label: string;
  lineNumber?: number;
  nodeType: codeNodeType | "category";
  searchMatch?: boolean;
};

export type nodeGraphFlowNode = Node<nodeGraphNodeData> & {
  className: string;
  style?: CSSProperties;
};

export type nodeGraphFlowEdge = Omit<Edge, "label"> & {
  className: string;
  label: string | undefined;
};

export const VISIBLE_CHILD_LIMIT = 8;

export const buildNodeFlow = ({
  graph,
  viewState
}: {
  graph: codeNodeGraph;
  viewState: nodeGraphViewState;
}): {
  edges: nodeGraphFlowEdge[];
  nodes: nodeGraphFlowNode[];
  selectedCodeNode: codeNode;
  visibleCodeNodes: codeNode[];
} => {
  const nodes: nodeGraphFlowNode[] = [];
  const edges: nodeGraphFlowEdge[] = [];
  const visibleCodeNodes: codeNode[] = [];
  const query = viewState.searchQuery.trim().toLowerCase();

  nodes.push({
    className: getNodeClassName("file", false),
    data: {
      codeNode: graph.fileNode,
      label: graph.fileNode.name,
      nodeType: "file"
    },
    id: graph.fileNode.id,
    position: { x: 0, y: 0 },
    style: getNodeStyle("file"),
    type: "default"
  });

  for (const group of graph.groups) {
    const groupPosition = CATEGORY_POSITIONS[group.id];
    const groupId = `category:${group.id}`;
    const groupIsExpanded = viewState.expandedGroups.has(group.id);
    const visibleChildren = groupIsExpanded
      ? group.nodes.slice(
          0,
          viewState.expandedMoreGroups.has(group.id)
            ? group.nodes.length
            : VISIBLE_CHILD_LIMIT
        )
      : [];
    const hiddenCount = Math.max(group.nodes.length - visibleChildren.length, 0);

    nodes.push({
      className: getNodeClassName("category", isSearchMatch(group.label, query)),
      data: {
        category: group.id,
        count: group.count,
        label: group.label,
        nodeType: "category",
        searchMatch: isSearchMatch(group.label, query)
      },
      id: groupId,
      position: groupPosition,
      style: getNodeStyle("category"),
      type: "default"
    });
    edges.push(createEdge("file", groupId));

    visibleChildren.forEach((child, index) => {
      const childPosition = getChildPosition({
        groupId: group.id,
        index,
        total: visibleChildren.length
      });
      const searchMatch = isSearchMatch(child.name, query) || isSearchMatch(child.codePreview, query);

      visibleCodeNodes.push(child);
      nodes.push({
        className: getNodeClassName(child.type, searchMatch),
        data: {
          category: group.id,
          codeNode: child,
          label: child.name,
          lineNumber: child.lineNumber,
          nodeType: child.type,
          searchMatch
        },
        id: child.id,
        position: {
          x: groupPosition.x + childPosition.x,
          y: groupPosition.y + childPosition.y
        },
        style: getNodeStyle(child.type),
        type: "default"
      });
      edges.push(createEdge(groupId, child.id));
    });

    if (hiddenCount > 0) {
      const morePosition = getChildPosition({
        groupId: group.id,
        index: visibleChildren.length,
        total: visibleChildren.length + 1
      });

      nodes.push({
        className: getNodeClassName("more", false),
        data: {
          category: group.id,
          count: hiddenCount,
          label: `+${hiddenCount} more`,
          nodeType: "more"
        },
        id: `more:${group.id}`,
        position: {
          x: groupPosition.x + morePosition.x,
          y: groupPosition.y + morePosition.y
        },
        style: getNodeStyle("more"),
        type: "default"
      });
      edges.push(createEdge(groupId, `more:${group.id}`));
    }
  }

  const selectedCodeNode =
    getCodeNodeById(graph, viewState.selectedNodeId) ?? graph.fileNode;

  return {
    edges,
    nodes,
    selectedCodeNode,
    visibleCodeNodes
  };
};

export const getCodeNodeById = (
  graph: codeNodeGraph,
  nodeId: string
): codeNode | null => {
  if (nodeId === graph.fileNode.id) {
    return graph.fileNode;
  }

  return graph.groups.flatMap((group) => group.nodes).find((node) => node.id === nodeId) ?? null;
};

export const getConnectedNodeIds = (node: codeNode): Set<string> => {
  return new Set([node.id, ...node.connectedNodeIds]);
};

const CATEGORY_POSITIONS: Record<codeNodeCategory, { x: number; y: number }> = {
  imports: { x: 0, y: -210 },
  exports: { x: 250, y: -60 },
  declarations: { x: 0, y: 220 },
  hooks: { x: -250, y: -70 },
  functions: { x: -250, y: 110 },
  constants: { x: 245, y: 150 }
};

const CHILD_LANES: Record<
  codeNodeCategory,
  {
    crossAxis: "x" | "y";
    crossStep: number;
    mainAxis: "x" | "y";
    mainStep: number;
    originX: number;
    originY: number;
    wrapAfter: number;
  }
> = {
  imports: {
    crossAxis: "x",
    crossStep: 178,
    mainAxis: "y",
    mainStep: 66,
    originX: -178,
    originY: -118,
    wrapAfter: 3
  },
  exports: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: 184,
    originX: 176,
    originY: -70,
    wrapAfter: 4
  },
  declarations: {
    crossAxis: "x",
    crossStep: 178,
    mainAxis: "y",
    mainStep: 66,
    originX: -178,
    originY: 98,
    wrapAfter: 3
  },
  hooks: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: -184,
    originX: -176,
    originY: -70,
    wrapAfter: 4
  },
  functions: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: -184,
    originX: -176,
    originY: -70,
    wrapAfter: 4
  },
  constants: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: 184,
    originX: 176,
    originY: -70,
    wrapAfter: 4
  }
};

const getChildPosition = ({
  groupId,
  index,
  total
}: {
  groupId: codeNodeCategory;
  index: number;
  total: number;
}) => {
  const lane = CHILD_LANES[groupId];
  const laneIndex = Math.floor(index / lane.wrapAfter);
  const itemIndex = index % lane.wrapAfter;
  const centeredOffset = itemIndex - (Math.min(total, lane.wrapAfter) - 1) / 2;
  const crossOffset = centeredOffset * lane.crossStep;
  const mainOffset = laneIndex * lane.mainStep;
  const x =
    lane.originX +
    (lane.mainAxis === "x" ? mainOffset : 0) +
    (lane.crossAxis === "x" ? crossOffset : 0);
  const y =
    lane.originY +
    (lane.mainAxis === "y" ? mainOffset : 0) +
    (lane.crossAxis === "y" ? crossOffset : 0);

  return {
    x,
    y
  };
};

const createEdge = (source: string, target: string): nodeGraphFlowEdge => ({
  animated: false,
  className: "stroke-border/70",
  id: `${source}->${target}`,
  label: undefined,
  source,
  target,
  type: "straight"
});

const getNodeClassName = (
  type: codeNodeType | "category",
  searchMatch: boolean
) => {
  const base =
    "flex items-center justify-center overflow-hidden border px-3 text-center font-mono text-[11px] shadow-lg shadow-black/20 transition-colors";
  const highlight = searchMatch ? " ring-2 ring-primary/70" : "";

  if (type === "file") {
    return `${base} border-primary bg-primary text-primary-foreground${highlight}`;
  }

  if (type === "category") {
    return `${base} border-teal-300/30 bg-teal-400/14 text-teal-100${highlight}`;
  }

  if (type === "more") {
    return `${base} border-border bg-muted text-muted-foreground${highlight}`;
  }

  return `${base} border-sky-300/24 bg-sky-400/12 text-sky-100${highlight}`;
};

const getNodeStyle = (
  type: codeNodeType | "category" | "file" | "more"
): CSSProperties => {
  if (type === "file") {
    return {
      borderRadius: 14,
      fontSize: 12,
      fontWeight: 600,
      height: 56,
      lineHeight: 1.3,
      paddingInline: 16,
      width: 176
    };
  }

  if (type === "category") {
    return {
      borderRadius: 12,
      fontWeight: 600,
      height: 40,
      lineHeight: 1.2,
      paddingInline: 12,
      width: 140
    };
  }

  if (type === "more") {
    return {
      borderRadius: 12,
      height: 40,
      lineHeight: 1.2,
      paddingInline: 12,
      width: 104
    };
  }

  return {
    borderRadius: 12,
    height: 48,
    lineHeight: 1.2,
    paddingInline: 12,
    width: 152
  };
};

const isSearchMatch = (value: string, query: string) => {
  return query.length > 0 && value.toLowerCase().includes(query);
};
