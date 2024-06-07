import { ResourceIcon } from "@wingconsole/design-system";
import type { ExplorerItem } from "@wingconsole/server";
import type { ResourceRunningState } from "@winglang/sdk/lib/simulator/simulator.js";
import type { FunctionComponent } from "react";
import { useCallback, useEffect, useState } from "react";

import type { TreeMenuItem } from "../ui/use-tree-menu-items.js";
import { useTreeMenuItems } from "../ui/use-tree-menu-items.js";

import { trpc } from "./trpc.js";

interface RunningStateIndicatorProps {
  runningState: ResourceRunningState | undefined;
}

const RunningStateIndicator: FunctionComponent<RunningStateIndicatorProps> = ({
  runningState,
}) => {
  if (runningState === "error") {
    return <div className="size-2 rounded-full bg-red-500"></div>;
  }
  if (runningState === "starting") {
    return (
      <div className="relative">
        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></div>
        <div className="size-2 rounded-full bg-gray-400"></div>
      </div>
    );
  }
  return <div className="size-2"></div>;
};

const createTreeMenuItemFromExplorerTreeItem = (
  item: ExplorerItem,
): TreeMenuItem => {
  return {
    id: item.id,
    label: item.label,
    icon: item.type ? (
      <ResourceIcon
        resourceType={item.type}
        resourcePath={item.id}
        className="w-4 h-4"
        color={item.display?.color}
        icon={item.display?.icon}
      />
    ) : undefined,
    secondaryLabel: <RunningStateIndicator runningState={item.runningState} />,
    children: item.childItems?.map((item) =>
      createTreeMenuItemFromExplorerTreeItem(item),
    ),
  };
};

export const useExplorer = () => {
  const {
    items,
    setItems,
    selectedItems,
    setSelectedItems,
    expandedItems,
    setExpandedItems,
    expand,
    collapse,
    expandAll,
    collapseAll,
  } = useTreeMenuItems({
    selectedItemIds: ["root"],
  });

  const tree = trpc["app.explorerTree"].useQuery();

  const [selectedNode, setSelectedNode] = useState<string>("");

  const nodeIds = trpc["app.nodeIds"].useQuery();

  const onSelectedItemsChange = useCallback(
    (selectedItems: string[]) => {
      setSelectedItems(selectedItems);
      setSelectedNode(selectedItems[0] ?? "");
    },
    [setSelectedNode, setSelectedItems],
  );

  useEffect(() => {
    if (!tree.data) {
      return;
    }
    // Remove the root node by taking the children.
    const items = createTreeMenuItemFromExplorerTreeItem(tree.data).children;
    setItems(items ?? []);
  }, [tree.data, setItems]);

  useEffect(() => {
    if (!nodeIds.data) {
      return;
    }

    if (!selectedNode || !nodeIds.data?.includes(selectedNode)) {
      setSelectedNode("");
    }
  }, [selectedNode, nodeIds.data, setSelectedNode]);

  useEffect(() => {
    if (!selectedNode) {
      return;
    }
    setSelectedItems([selectedNode]);
  }, [selectedNode, setSelectedItems]);

  return {
    items,
    selectedItems,
    setSelectedItems: onSelectedItemsChange,
    expandedItems,
    setExpandedItems,
    expand,
    collapse,
    expandAll,
    collapseAll,
  };
};
