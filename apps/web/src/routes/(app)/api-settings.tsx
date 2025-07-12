import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/api-settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/api-settings"!</div>;
}
