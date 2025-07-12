import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/contacts")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/contacts"!</div>;
}
