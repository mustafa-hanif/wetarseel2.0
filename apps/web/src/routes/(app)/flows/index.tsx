import { createFileRoute } from "@tanstack/solid-router";
import { AutomationSelector } from "@/components/flows/AutomationSelector";
import { CampaignAutomation } from "@/components/flows/CampaignAutomation";
import { ActiveAutomations, type IAutomation } from "@/components/flows/ActiveAutomations";
import { createResource } from "solid-js";

export const Route = createFileRoute("/(app)/flows/")({
  component: RouteComponent,
});

// Mock data for now - replace with actual API calls
const mockTemplates = [
  { id: "1", template_name: "Welcome Message", category: "Marketing" },
  { id: "2", template_name: "Order Confirmation", category: "Sales" },
  { id: "3", template_name: "Support Inquiry", category: "Support" },
];

const mockAutomations: IAutomation[] = [
  {
    id: "1",
    name: "Welcome Flow",
    description: "Greets new customers",
    isActive: true,
    template: "Welcome Message",
  },
  {
    id: "2", 
    name: "Support Triage",
    description: "Routes support requests",
    isActive: false,
  },
];

function RouteComponent() {
  return (
    <div class="container mx-auto px-4 py-8">
      <div class="mb-12">
        <h1 class="text-3xl font-bold">Create Automation Flows</h1>
        <p class="text-muted-foreground mt-2">
          Create automated replies or interactive flows based on what customers
          message you. You can create generalized flows for any message or
          create different flows for each campaign.
        </p>
      </div>
      
      <AutomationSelector />
      <CampaignAutomation templates={mockTemplates} />
      <ActiveAutomations automations={mockAutomations} />
    </div>
  );
}
