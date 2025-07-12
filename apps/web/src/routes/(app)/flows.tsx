import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/flows")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/flows"!</div>;
}
