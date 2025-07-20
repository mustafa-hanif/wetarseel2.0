import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-solid";
import { Link } from "@tanstack/solid-router";
import { useAuth } from "@/hooks/useAuth";

const automations = [
  {
    title: "Out of Office Reply",
    description: "Automatically respond when you're away from work",
    illustration: "/assets/svg/undraw_into_the_night_vumi.svg",
  },
  {
    title: "Meeting Scheduler",
    description: "Suggest available time slots for meetings",
    illustration: "/assets/svg/undraw_schedule_meeting_52nu.svg",
  },
  {
    title: "Customer Support Triage",
    description: "Categorize and prioritize incoming support requests",
    illustration: "/assets/svg/undraw_connecting_teams_re_hno7.svg",
  },
  {
    title: "Follow-up Reminder",
    description: "Send reminders for unanswered emails after a set time",
    illustration: "/assets/svg/undraw_reminders_re_gtyb.svg",
  },
];

export function AutomationSelector() {
  const auth = useAuth();
  
  return (
    <div class="mb-16">
      <header class="mb-6">
        <CardTitle>Commonly used automations</CardTitle>
        <p>Select from one of the commonly used automations, or create one from scratch</p>
      </header>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {automations.map((automation, index) => (
          <Card class="flex flex-col">
            <CardHeader>
              <div class="w-full h-32 flex items-center justify-center bg-slate-100 rounded-md mb-4 dark:bg-slate-800">
                <img src={automation.illustration} alt={`${automation.title} illustration`} class="max-w-full max-h-full" />
              </div>
              <CardTitle>{automation.title}</CardTitle>
              <CardDescription>{automation.description}</CardDescription>
            </CardHeader>
            <CardFooter class="mt-auto">
              <Button variant="secondary" disabled class="w-full">
                Coming Soon
              </Button>
            </CardFooter>
          </Card>
        ))}
        <Card class="flex flex-col">
          <CardHeader>
            <div class="w-full h-32 flex items-center justify-center bg-slate-100 rounded-md mb-4 dark:bg-slate-800">
              <PlusCircle class="mr-2 h-12 w-12 text-green-700" />
            </div>
            <CardTitle>Create from scratch</CardTitle>
            <CardDescription>Create a brand new automation from scratch</CardDescription>
          </CardHeader>
          <CardFooter class="mt-auto">
            <Link class="w-full" to="/flows/create-automation">
              <Button variant="secondary" class="w-full">
                Select
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}