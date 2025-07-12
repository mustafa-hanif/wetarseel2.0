import { Button } from "@/components/ui/button";
import { Icon } from "@iconify-icon/solid";
import Users from "lucide-solid/icons/users";
import User from "lucide-solid/icons/user";
import { For } from "solid-js";
import { Team, Agent } from "@/types/chat";

interface TeamAgentSidebarProps {
  teams: Team[];
  agents: Agent[];
  selectedTeam: string | null;
  selectedAgent: string | null;
  conversationCount: number;
  onTeamSelect: (teamId: string | null) => void;
  onAgentSelect: (agentId: string | null) => void;
}

export function TeamAgentSidebar(props: TeamAgentSidebarProps) {
  return (
    <div class="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Team Inbox */}
      <div class="border-b border-gray-200">
        <div class="p-3 text-sm font-medium text-gray-900">Team Inbox</div>
        <div class="space-y-1">
          <Button
            variant="ghost"
            class={`w-full justify-between text-left ${!props.selectedTeam ? "bg-gray-100" : ""}`}
            onClick={() => {
              props.onTeamSelect(null);
              props.onAgentSelect(null);
            }}
          >
            <div class="flex items-center gap-2">
              <Icon icon="mdi:inbox" width={16} height={16} />
              <span>All Conversations</span>
            </div>
            <span class="text-xs text-gray-500">{props.conversationCount}</span>
          </Button>

          <For each={props.teams}>
            {(team) => (
              <Button
                variant="ghost"
                class={`w-full justify-between text-left ${props.selectedTeam === team.id ? "bg-gray-100" : ""}`}
                onClick={() => {
                  props.onTeamSelect(team.id);
                  props.onAgentSelect(null);
                }}
              >
                <div class="flex items-center gap-2">
                  <Users size={16} />
                  <span>{team.name}</span>
                </div>
                <span class="text-xs text-gray-500">
                  {team.conversationCount}
                </span>
              </Button>
            )}
          </For>
        </div>
      </div>

      {/* Agents */}
      <div class="border-b border-gray-200">
        <div class="p-3 text-sm font-medium text-gray-900">Agents</div>
        <div class="space-y-1">
          <For each={props.agents}>
            {(agent) => (
              <Button
                variant="ghost"
                class={`w-full justify-between text-left ${props.selectedAgent === agent.id ? "bg-gray-100" : ""}`}
                onClick={() => {
                  props.onAgentSelect(agent.id);
                  props.onTeamSelect(null);
                }}
              >
                <div class="flex items-center gap-2">
                  <User size={16} />
                  <span>{agent.name}</span>
                </div>
                <span class="text-xs text-gray-500">
                  {agent.conversationCount}
                </span>
              </Button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
