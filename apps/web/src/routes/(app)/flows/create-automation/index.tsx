import { createFileRoute } from "@tanstack/solid-router";
import { ReactBridge } from "@/components/ReactBridge";
import { CreateAutomationPage } from "@/components/react/flows/CreateAutomationPage.react";
export const Route = createFileRoute("/(app)/flows/create-automation/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ReactBridge component={CreateAutomationPage} />;
}
