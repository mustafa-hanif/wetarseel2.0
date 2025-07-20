import { CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/solid-router";
import { For } from "solid-js";
import { useAuth } from "@/hooks/useAuth";

export interface IAutomation {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  template?: string;
}

interface ActiveAutomationsProps {
  automations: IAutomation[];
}

export function ActiveAutomations(props: ActiveAutomationsProps) {
  const auth = useAuth();
  
  const toggleAutomationLocal = async (id: string, status: boolean) => {
    // TODO: Implement toggle automation API call
    console.log("Toggle automation:", id, status);
  };

  return (
    <div class="mx-auto py-8">
      <div class="mb-6">
        <CardTitle>Currently Active Automations</CardTitle>
        <p>These automations are now live and are responding to users, manage them or disable them</p>
      </div>
      <ul class="space-y-4">
        <For each={props.automations}>
          {(automation) => (
            <li class="flex items-center justify-between p-4 bg-slate-100 rounded-lg dark:bg-slate-800">
              <div class="flex items-center space-x-4">
                <div 
                  class={`w-3 h-3 rounded-full ${
                    automation.isActive 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-gray-300'
                  }`} 
                />
                <div>
                  <Link to="/flows/create-automation/$automationId" params={{ automationId: automation.id }}>
                    <h3 class="text-lg font-semibold">{automation.name}</h3>
                  </Link>
                  <p class="text-sm text-slate-500 dark:text-slate-400">{automation.description}</p>
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground mt-1">
                    {automation.template || 'General'}
                  </span>
                  {!automation.template && (
                    <small class="block">This automation will run for any incoming messages</small>
                  )}
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automation.isActive}
                    onChange={(e) => toggleAutomationLocal(automation.id, e.target.checked)}
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                <span class="text-sm">{automation.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}