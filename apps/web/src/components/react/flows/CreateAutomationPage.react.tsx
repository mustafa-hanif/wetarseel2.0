// @ts-nocheck
import React, { useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.react";
import { Button } from "../ui/button.react";
import { Input, Textarea, Badge } from "../ui/form.react";

import "@xyflow/react/dist/style.css";
import "./styles.css";
import { actions, conditions, nodeTypes, triggers } from "./sidebar.react";
import { SaveButton } from "./SaveButton.react";
import useNodeUtils from "./useNodeUtils";
import { Conditions } from "./Conditions.react";
import { Actions } from "./Actions.react";
import { Triggers } from "./Triggers.react";
import { FlowProvider, IImageWithUrl, User } from "./FlowContext.react";

import {
  compileGraph,
  findStartNode,
  executeFlowGenerator,
  ExecutionContext,
} from "./flowSimulator";

// Simulator component
function SimulatorUI({
  sampleFlow = {
    nodes: [],
    edges: [],
  },
}: {
  sampleFlow: {
    nodes: Node[];
    edges: Edge<any>[];
  };
}) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const genRef = useRef<AsyncGenerator | null>(null);

  const handleStart = async () => {
    const graph = compileGraph(sampleFlow.nodes, sampleFlow.edges);
    const startNode = findStartNode(graph, input);
    if (!startNode) {
      setLog([`No matching start node for input: ${input}`]);
      return;
    }

    const ctx: ExecutionContext = {
      userId: "u1",
      input,
      variables: {},
      visited: new Set(),
      shouldHalt: false,
    };

    const gen = executeFlowGenerator(graph, startNode.id, ctx);
    genRef.current = gen;

    handleNextStep();
  };

  const handleNextStep = async (userInput?: string) => {
    const gen = genRef.current;
    if (!gen) return;

    const result = await gen.next(userInput);
    if (result.done || !result.value) {
      setLog((prev) => [...prev, "Flow ended."]);
      setOptions([]);
      return false;
    }

    const { node, ctx, promptOptions } = result.value;
    let msg = ``;
    if (node.type === "On Message") {
      msg = `Select Keywords: ${node.data.keywords?.map((k: any) => k.label.slice(0, 20)).join(", ") || "any"}`;
      setLog((prev) => [...prev, msg]);
    }
    if (node.type === "Send Message") {
      msg = `Send Message: ${node.data?.text?.slice(0, 50) || "No message set"}`;
      setLog((prev) => [...prev, msg]);
    }
    if (node.type === "Assign agent") {
      msg = `Assign Agent`;
      setLog((prev) => [...prev, msg]);
    }

    if (promptOptions) {
      setOptions(promptOptions);
      return false;
    } else {
      handleNextStep();
      return true;
    }
  };

  const handleOptionClick = (label: string) => {
    setOptions([]);
    handleNextStep(label);
  };

  const autoRun = async () => {
    while (await handleNextStep()) {
      // Keep stepping while no user input needed
    }
  };

  return (
    <div className="p-4 space-y-2">
      <input
        className="border p-2 w-full rounded"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message (e.g. 'tire')"
      />
      <div className="space-x-2">
        <button
          onClick={handleStart}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Start
        </button>
        {log?.[log.length - 1] !== "Flow ended." ? (
          <button
            className="bg-purple-500 text-white px-3 py-1 rounded"
            onClick={() => {
              handleNextStep();
            }}
          >
            Next
          </button>
        ) : null}
        {options.length === 0 && log?.[log.length - 1] !== "Flow ended." && (
          <button
            onClick={autoRun}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Continue
          </button>
        )}
      </div>
      <div className="space-y-2">
        {options.length > 0 && (
          <div className="space-x-2">
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleOptionClick(opt.value)}
                className="bg-purple-500 text-white px-2 py-1 rounded"
              >
                {opt.value}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bg-gray-100 p-3 rounded text-sm">
        {log.map((l, i) => (
          <div key={i}>• {l}</div>
        ))}
      </div>
    </div>
  );
}

// Main Flow Component
export const FlowComponent = ({
  selectedAutomation,
  initialNodes = [],
  initialEdges = [],
  accountId,
  templateName,
  templates,
}: {
  templateName?: string;
  selectedAutomation?: {
    template?: string;
    name?: string;
    description?: string;
    expand?: {
      template: {
        template_name: string;
      };
    };
  };
  templates?: Record<string, any>;
  initialNodes: Node[];
  initialEdges: Edge<any>[];
  accountId: string;
}) => {
  const { onEdgeClick, onConnect } = useNodeUtils();
  const { fitView } = useReactFlow();

  const handleCenterView = () => {
    fitView({ padding: 0.2, duration: 800 });
  };

  return (
    <div className="w-full px-10">
      <div className="text-blue-600 underline">
        <a href={`/flows`}>Back to automations</a>
      </div>
      <div className="mb-8">
        <CardTitle>Automation Workspace</CardTitle>
        <CardDescription>
          Use the drag and drop UI to create an automation whenever there is a
          message by the user
        </CardDescription>
        <SimulatorUI
          sampleFlow={{
            nodes: initialNodes,
            edges: initialEdges,
          }}
        />
      </div>
      <div>
        {selectedAutomation?.template ? (
          <div>
            <div>
              This automation will only run when a user responds to a
              conversation in which the template
              <Badge className="mx-2">
                {selectedAutomation?.expand?.template.template_name}
              </Badge>{" "}
              was sent
            </div>
          </div>
        ) : null}
        {/* Add name and description */}
        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              defaultValue={selectedAutomation?.name}
              type="text"
              name="name"
              id="name"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <Textarea
              defaultValue={selectedAutomation?.description}
              id="description"
              name="description"
              rows={1}
            ></Textarea>
          </div>
          <div className="py-5">
            <SaveButton
              accountId={accountId}
              selectedAutomation={selectedAutomation}
            />
          </div>
        </div>
      </div>
      <div
        className="flex gap-2 w-full"
        style={{ height: "calc(100% - 230px)" }}
      >
        <div>
          {/* Triggers */}
          <Triggers triggers={triggers} />

          {/* Actions */}
          <Actions actions={actions} />

          {/* Conditions */}
          <Conditions conditions={conditions} />
        </div>
        <div className="ml-7 w-full relative">
          <button
            onClick={handleCenterView}
            className="absolute top-4 right-4 z-10 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg shadow-sm text-sm font-medium text-gray-700 flex items-center gap-2"
            title="Center view"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Center
          </button>
          <ReactFlow
            defaultNodes={initialNodes}
            defaultEdges={initialEdges}
            nodeTypes={nodeTypes}
            onEdgeClick={onEdgeClick}
            onConnect={onConnect}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

// Main CreateAutomationPage component (wrapper with providers)
export function CreateAutomationPage() {
  // Mock data - in real implementation, this would come from props/API
  const mockImages: IImageWithUrl[] = [];
  const mockAgents: Partial<User>[] = [
    { id: "1", name: "Agent 1" },
    { id: "2", name: "Agent 2" },
  ];
  const mockUser: User = { id: "user1", name: "Current User" };
  const accountId = "account1";

  const initialNodes: Node[] = [];
  const initialEdges: Edge<any>[] = [];

  return (
    <ReactFlowProvider>
      <FlowProvider
        images={mockImages}
        agents={mockAgents}
        accountId={accountId}
        currentUser={mockUser}
      >
        <FlowComponent
          templateName={undefined}
          selectedAutomation={undefined}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          accountId={accountId}
          templates={{}}
        />
      </FlowProvider>
    </ReactFlowProvider>
  );
}
