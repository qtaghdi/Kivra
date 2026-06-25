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

const CHILD_ARCS: Record<codeNodeCategory, { end: number; radius: number; start: number }> = {
  imports: { end: -30, radius: 155, start: -150 },
  exports: { end: 90, radius: 145, start: -80 },
  declarations: { end: 210, radius: 150, start: -30 },
  hooks: { end: 80, radius: 140, start: -100 },
  functions: { end: 120, radius: 150, start: -80 },
  constants: { end: 150, radius: 138, start: -40 }
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
  const arc = CHILD_ARCS[groupId];
  const progress = total <= 1 ? 0.5 : index / (total - 1);
  const angle = degreesToRadians(arc.start + (arc.end - arc.start) * progress);

  return {
    x: Math.cos(angle) * arc.radius,
    y: Math.sin(angle) * arc.radius
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
    "border font-mono text-[11px] shadow-lg shadow-black/20 transition-colors";
  const highlight = searchMatch ? " ring-2 ring-primary/70" : "";

  if (type === "file") {
    return `${base} min-w-36 border-primary bg-primary px-4 py-3 text-primary-foreground${highlight}`;
  }

  if (type === "category") {
    return `${base} min-w-32 border-teal-300/30 bg-teal-400/14 px-3 py-2 text-teal-100${highlight}`;
  }

  if (type === "more") {
    return `${base} min-w-24 border-border bg-muted px-3 py-2 text-muted-foreground${highlight}`;
  }

  return `${base} min-w-28 border-sky-300/24 bg-sky-400/12 px-3 py-2 text-sky-100${highlight}`;
};

const isSearchMatch = (value: string, query: string) => {
  return query.length > 0 && value.toLowerCase().includes(query);
};

const degreesToRadians = (value: number) => (value / 180) * Math.PI;
