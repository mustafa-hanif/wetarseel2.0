// @ts-nocheck
import { onCleanup, onMount } from "solid-js";
import { createRoot } from "react-dom/client";
import React from "react";

interface ReactBridgeProps {
  component: any;
  props?: Record<string, any>;
}

export function ReactBridge(props: ReactBridgeProps) {
  let containerRef: HTMLDivElement | undefined;
  let root: ReturnType<typeof createRoot> | null = null;

  onMount(() => {
    if (containerRef) {
      try {
        root = createRoot(containerRef);
        const Component = props.component;
        // Use React.createElement to ensure proper React element creation
        const element = React.createElement(Component, props.props || {});
        root.render(element);
      } catch (error) {
        console.error("ReactBridge error:", error);
      }
    }
  });

  onCleanup(() => {
    if (root) {
      try {
        root.unmount();
      } catch (error) {
        console.error("ReactBridge cleanup error:", error);
      }
    }
  });

  return <div ref={containerRef}></div>;
}
