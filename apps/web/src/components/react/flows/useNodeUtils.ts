// @ts-nocheck
import { addEdge, Edge, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { IImageWithUrl, User } from "./FlowContext";

export const HEIGHT = 160;
export const IMG_HEIGHT = 128;

export type ITrigger = "On Message";
export type IAction =
  | "Send Message"
  | "Assign agent"
  | "Save Data"
  | "Data Node";
export type ICondition = "Office Hours";

type IProps = {
  images?: IImageWithUrl[];
  agents?: Partial<User>[];
};

const useNodeUtils = (props?: IProps) => {
  const { images, agents } = props ?? {};
  const { getNodes, setNodes, setEdges, addNodes } = useReactFlow();

  const deleteNode = (id: string) => {
    setNodes((nodes) => {
      return nodes.filter((node) => node.id !== id);
    });
    setEdges((edges) => {
      return edges.filter((edge) => edge.source !== id && edge.target !== id);
    });
  };

  const addButtonNode = (id: string, parentId: string): void => {
    const x = 10;
    let y = 10;
    const textAreaHeight =
      document.getElementById(parentId)?.querySelector(`textarea`)
        ?.clientHeight ?? 0;
    const imageHeight =
      document.getElementById(parentId)?.querySelector(`img`)?.clientHeight ??
      0;
    const nodes = getNodes();
    // get the last child node of the parentNode parentId
    if (nodes.filter((node) => node.parentId === parentId).length === 0) {
      y = textAreaHeight + imageHeight + HEIGHT;
    } else {
      const lastNode = nodes.filter((node) => node.parentId === parentId).pop();
      y = (lastNode?.position.y ?? 0) + 90;
    }
    console.log(nodes, parentId, y);

    addNodes({
      id,
      position: { x, y },
      type: "button",
      extent: "parent",
      parentId,
      width: 174,
      height: 80,
      data: {
        label: "Button",
        parentId,
      },
    });
  };

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: any) => {
      setEdges((oldEdges) => addEdge(connection, oldEdges));
    },
    [setEdges]
  );

  const genericClick = (label: ITrigger | IAction) => {
    const nodes = getNodes();
    console.log(label, nodes);
    let y = 200;
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      y = lastNode.position.y + (lastNode.measured?.height ?? 0);
    }
    const node = {
      id: `${label}${nodes.length + 1}`,
      position: {
        x: 200,
        y,
      },
      type: label,
      data: { label },
    };
    addNodes(node);
  };

  return { deleteNode, addButtonNode, genericClick, onEdgeClick, onConnect };
};

export default useNodeUtils;
