// @ts-nocheck
import { Edge, Node } from "@xyflow/react";

export interface ExecutionContext {
  userId: string;
  input: string;
  variables: Record<string, any>;
  visited: Set<string>;
  shouldHalt: boolean;
}

export const compileGraph = (
  nodes: Node[],
  edges: Edge[]
): Record<string, any> => {
  const graph: Record<string, any> = {};

  nodes.forEach((node) => {
    graph[node.id] = {
      ...node,
      connections: edges
        .filter((edge) => edge.source === node.id)
        .map((edge) => edge.target),
    };
  });

  return graph;
};

export const findStartNode = (
  graph: Record<string, any>,
  input: string
): any => {
  // Find the first trigger node that matches the input
  const nodes = Object.values(graph);
  return nodes.find(
    (node: any) =>
      node.type === "On Message" || node.data?.label === "On Message"
  );
};

export async function* executeFlowGenerator(
  graph: Record<string, any>,
  nodeId: string,
  ctx: ExecutionContext
): AsyncGenerator<any> {
  const node = graph[nodeId];
  if (!node || ctx.visited.has(nodeId)) {
    return;
  }

  ctx.visited.add(nodeId);

  // Simulate node execution
  yield { node, ctx, promptOptions: null };

  // Continue to next nodes
  for (const nextNodeId of node.connections || []) {
    yield* executeFlowGenerator(graph, nextNodeId, ctx);
  }
}
