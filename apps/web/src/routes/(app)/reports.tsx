import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/reports")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/reports"!</div>;
}
