import { createFileRoute } from "@tanstack/solid-router";

export const Route = createFileRoute("/(app)/office-settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/office-settings"!</div>;
}
