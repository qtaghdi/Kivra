import { useCallback, useEffect, useMemo, useState } from "react";

import type { codeNodeCategory, codeNodeGraph } from "@/features/project/services/node-graph-service";
import {
  buildNodeFlow,
  getCodeNodeById,
  type nodeGraphViewState
} from "@/features/project/services/node-layout-service";

export const useNodeGraph = (graph: codeNodeGraph) => {
  const defaultExpandedGroups = graph.isLargeFile
    ? new Set<codeNodeCategory>()
    : new Set<codeNodeCategory>();
  const [expandedGroups, setExpandedGroups] =
    useState<Set<codeNodeCategory>>(defaultExpandedGroups);
  const [expandedMoreGroups, setExpandedMoreGroups] =
    useState<Set<codeNodeCategory>>(new Set());
  const [pinnedGroups, setPinnedGroups] = useState<Set<codeNodeCategory>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState(graph.fileNode.id);

  useEffect(() => {
    setExpandedGroups(new Set());
    setExpandedMoreGroups(new Set());
    setPinnedGroups(new Set());
    setSearchQuery("");
    setSelectedNodeId(graph.fileNode.id);
  }, [graph.fileNode.id]);

  const viewState: nodeGraphViewState = useMemo(
    () => ({
      expandedGroups,
      expandedMoreGroups,
      pinnedGroups,
      searchQuery,
      selectedNodeId
    }),
    [expandedGroups, expandedMoreGroups, pinnedGroups, searchQuery, selectedNodeId]
  );
  const flow = useMemo(
    () => buildNodeFlow({ graph, viewState }),
    [graph, viewState]
  );

  const selectNode = useCallback(
    (nodeId: string) => {
      if (nodeId.startsWith("category:")) {
        const category = nodeId.replace("category:", "") as codeNodeCategory;
        setSelectedNodeId(nodeId);
        setExpandedGroups((current) => expandOnlyCategory(current, pinnedGroups, category));
        return;
      }

      if (nodeId.startsWith("more:")) {
        const category = nodeId.replace("more:", "") as codeNodeCategory;
        setExpandedMoreGroups((current) => new Set(current).add(category));
        setExpandedGroups((current) => expandOnlyCategory(current, pinnedGroups, category));
        setSelectedNodeId(`category:${category}`);
        return;
      }

      setSelectedNodeId(nodeId);
    },
    [pinnedGroups]
  );

  const toggleGroup = useCallback(
    (category: codeNodeCategory) => {
      setExpandedGroups((current) => {
        if (current.has(category)) {
          const next = new Set(current);
          next.delete(category);
          return next;
        }

        return expandOnlyCategory(current, pinnedGroups, category);
      });
      setSelectedNodeId(`category:${category}`);
    },
    [pinnedGroups]
  );

  const togglePinnedGroup = useCallback((category: codeNodeCategory) => {
    setPinnedGroups((current) => {
      const next = new Set(current);

      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }

      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedGroups(new Set(graph.groups.map((group) => group.id)));
  }, [graph.groups]);

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
    setExpandedMoreGroups(new Set());
    setSelectedNodeId(graph.fileNode.id);
  }, [graph.fileNode.id]);

  const resetOverview = useCallback(() => {
    setExpandedGroups(new Set());
    setExpandedMoreGroups(new Set());
    setSearchQuery("");
    setSelectedNodeId(graph.fileNode.id);
  }, [graph.fileNode.id]);

  const selectedCodeNode =
    getCodeNodeById(graph, selectedNodeId) ?? flow.selectedCodeNode;

  return {
    ...flow,
    collapseAll,
    expandAll,
    expandedGroups,
    pinnedGroups,
    resetOverview,
    searchQuery,
    selectNode,
    selectedCodeNode,
    selectedNodeId,
    setSearchQuery,
    toggleGroup,
    togglePinnedGroup
  };
};

const expandOnlyCategory = (
  current: Set<codeNodeCategory>,
  pinnedGroups: Set<codeNodeCategory>,
  category: codeNodeCategory
) => {
  const next = new Set<codeNodeCategory>(pinnedGroups);

  if (current.has(category) && !pinnedGroups.has(category)) {
    return next;
  }

  next.add(category);
  return next;
};
