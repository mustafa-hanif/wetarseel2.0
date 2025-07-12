import { Button } from "@/components/ui/button";
import Mail from "lucide-solid/icons/mail";
import Phone from "lucide-solid/icons/phone";
import Building from "lucide-solid/icons/building";
import MapPin from "lucide-solid/icons/map-pin";
import UserCheck from "lucide-solid/icons/user-check";
import Users from "lucide-solid/icons/users";
import Calendar from "lucide-solid/icons/calendar";
import Clock from "lucide-solid/icons/clock";
import User from "lucide-solid/icons/user";
import Tag from "lucide-solid/icons/tag";
import X from "lucide-solid/icons/x";
import { Show, For } from "solid-js";
import { Conversation, Team, Agent } from "@/types/chat";
import { formatDate } from "@/utils/chatUtils";

interface ContactSidebarProps {
  conversation: Conversation;
  teams: Team[];
  agents: Agent[];
  onClose: () => void;
}

export function ContactSidebar(props: ContactSidebarProps) {
  return (
    <div class="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Contact Info</h3>
        <Button variant="ghost" size="sm" onClick={props.onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Contact Details */}
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Section */}
        <div class="text-center">
          <div class="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
            <User size={32} class="text-gray-600" />
          </div>
          <h4 class="text-xl font-semibold text-gray-900">
            {props.conversation.name}
          </h4>
          <p class="text-gray-500">{props.conversation.phone}</p>
        </div>

        {/* Contact Information */}
        <div class="space-y-4">
          <h5 class="text-sm font-medium text-gray-900 uppercase tracking-wide">
            Contact Information
          </h5>

          <Show when={props.conversation.email}>
            <div class="flex items-center gap-3">
              <Mail size={16} class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-600">Email</p>
                <p class="text-sm font-medium text-gray-900">
                  {props.conversation.email}
                </p>
              </div>
            </div>
          </Show>

          <div class="flex items-center gap-3">
            <Phone size={16} class="text-gray-400" />
            <div>
              <p class="text-sm text-gray-600">Phone</p>
              <p class="text-sm font-medium text-gray-900">
                {props.conversation.phone}
              </p>
            </div>
          </div>

          <Show when={props.conversation.company}>
            <div class="flex items-center gap-3">
              <Building size={16} class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-600">Company</p>
                <p class="text-sm font-medium text-gray-900">
                  {props.conversation.company}
                </p>
              </div>
            </div>
          </Show>

          <Show when={props.conversation.location}>
            <div class="flex items-center gap-3">
              <MapPin size={16} class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-600">Location</p>
                <p class="text-sm font-medium text-gray-900">
                  {props.conversation.location}
                </p>
              </div>
            </div>
          </Show>
        </div>

        {/* Assignment Information */}
        <div class="space-y-4">
          <h5 class="text-sm font-medium text-gray-900 uppercase tracking-wide">
            Assignment
          </h5>

          <Show when={props.conversation.assignedAgent}>
            <div class="flex items-center gap-3">
              <UserCheck size={16} class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-600">Assigned Agent</p>
                <p class="text-sm font-medium text-gray-900">
                  {props.agents.find(
                    (agent) => agent.id === props.conversation.assignedAgent
                  )?.name || "Unknown Agent"}
                </p>
              </div>
            </div>
          </Show>

          <Show when={props.conversation.teamId}>
            <div class="flex items-center gap-3">
              <Users size={16} class="text-gray-400" />
              <div>
                <p class="text-sm text-gray-600">Team</p>
                <p class="text-sm font-medium text-gray-900">
                  {props.teams.find(
                    (team) => team.id === props.conversation.teamId
                  )?.name || "Unknown Team"}
                </p>
              </div>
            </div>
          </Show>
        </div>

        {/* Tags */}
        <div class="space-y-4">
          <h5 class="text-sm font-medium text-gray-900 uppercase tracking-wide">
            Tags
          </h5>
          <div class="flex flex-wrap gap-2">
            <For each={props.conversation.tags}>
              {(tag) => (
                <span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  <Tag size={10} />
                  {tag}
                </span>
              )}
            </For>
          </div>
        </div>

        {/* Timeline */}
        <div class="space-y-4">
          <h5 class="text-sm font-medium text-gray-900 uppercase tracking-wide">
            Timeline
          </h5>

          <div class="flex items-center gap-3">
            <Calendar size={16} class="text-gray-400" />
            <div>
              <p class="text-sm text-gray-600">Created</p>
              <p class="text-sm font-medium text-gray-900">
                {formatDate(props.conversation.createdAt)}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Clock size={16} class="text-gray-400" />
            <div>
              <p class="text-sm text-gray-600">Last Activity</p>
              <p class="text-sm font-medium text-gray-900">
                {formatDate(props.conversation.lastActivity)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <Show when={props.conversation.notes}>
          <div class="space-y-4">
            <h5 class="text-sm font-medium text-gray-900 uppercase tracking-wide">
              Notes
            </h5>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm text-gray-700">{props.conversation.notes}</p>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
