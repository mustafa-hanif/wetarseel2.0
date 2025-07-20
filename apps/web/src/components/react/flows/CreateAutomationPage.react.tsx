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

export function CreateAutomationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Automation</h1>
        <p className="text-muted-foreground mt-2">
          Build automated flows to handle customer interactions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
              <CardDescription>Drag to add to your flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Triggers</h4>
                <div className="space-y-2">
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    📩 On Message
                  </div>
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    📧 On Template Reply
                  </div>
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    🌐 On Webhook
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    💬 Send Message
                  </div>
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    👤 Assign Agent
                  </div>
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    💾 Save Data
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Conditions</h4>
                <div className="space-y-2">
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    ❓ If/Then
                  </div>
                  <div className="p-2 border rounded cursor-pointer hover:bg-muted">
                    🔀 Switch
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle>Flow Canvas</CardTitle>
              <CardDescription>
                Your automation flow will appear here. This is a placeholder - 
                the full React Flow implementation from the legacy code needs to be integrated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    React Flow Canvas Coming Soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will contain the full flow builder from the legacy implementation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-8 flex justify-between items-center">
        <Button variant="outline">
          ← Back to Flows
        </Button>
        <div className="space-x-2">
          <Button variant="outline">Save Draft</Button>
          <Button>Activate Flow</Button>
        </div>
      </div>
    </div>
  );
}