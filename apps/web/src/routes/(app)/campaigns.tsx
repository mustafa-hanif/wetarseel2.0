import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/campaigns")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/campaigns"!</div>;
}
