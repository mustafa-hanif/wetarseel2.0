// @ts-nocheck
import React from "react";
import { Button } from "../ui/button.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.react";
import { PlusCircle } from "lucide-react";

export function FlowsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">Create Automation Flows</h1>
        <p className="text-muted-foreground mt-2">
          Create automated replies or interactive flows based on what customers
          message you. You can create generalized flows for any message or
          create different flows for each campaign.
        </p>
      </div>

      {/* Automation Selector */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">
          Choose an Automation Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {automationTypes.map((automation) => (
            <Card
              key={automation.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="mb-4 text-4xl">{automation.icon}</div>
                <CardTitle className="text-lg">{automation.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{automation.description}</CardDescription>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  disabled={automation.comingSoon}
                >
                  {automation.comingSoon ? "Coming Soon" : "Select"}
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Create from scratch option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed">
            <CardHeader>
              <div className="mb-4 text-4xl">
                <PlusCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Create from scratch</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build a custom automation flow tailored to your needs
              </CardDescription>
              <Button className="mt-4 w-full" variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign Automation */}
      <div className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Campaign-Specific Automation</CardTitle>
            <CardDescription>
              Create automations that only trigger when users reply to specific
              campaign templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Select a campaign template to create an automation specific to
              that campaign.
            </p>
            <Button className="mt-4" variant="outline">
              Select Campaign Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Automations */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Active Automations</CardTitle>
            <CardDescription>
              Manage and monitor your currently active automation flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No active automations yet. Create your first automation to get
              started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const automationTypes = [
  {
    id: "out-of-office",
    icon: "🏖️",
    title: "Out of Office",
    description: "Automatically respond when you're away",
    comingSoon: true,
  },
  {
    id: "meeting-scheduler",
    icon: "📅",
    title: "Meeting Scheduler",
    description: "Let customers book appointments",
    comingSoon: true,
  },
  {
    id: "customer-support",
    icon: "🎧",
    title: "Customer Support Triage",
    description: "Route inquiries to the right team",
    comingSoon: true,
  },
  {
    id: "follow-up",
    icon: "🔔",
    title: "Follow-up Reminder",
    description: "Send timely follow-up messages",
    comingSoon: true,
  },
];
