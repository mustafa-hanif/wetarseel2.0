import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/messaging-limits")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/messaging-limits"!</div>;
}
