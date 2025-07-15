import { Button } from "@/components/ui/button";
import Phone from "lucide-solid/icons/phone";
import Archive from "lucide-solid/icons/archive";
import Info from "lucide-solid/icons/info";
import MoreVertical from "lucide-solid/icons/more-vertical";
import User from "lucide-solid/icons/user";
import Tag from "lucide-solid/icons/tag";
import { For } from "solid-js";
import { Conversation } from "@/types/chat";

interface ChatHeaderProps {
  conversation: Conversation;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
}

export function ChatHeader(props: ChatHeaderProps) {
  return (
    <div class="bg-white border-b border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} class="text-gray-600" />
          </div>
          <div>
            <h3 class="font-medium text-gray-900">
              {props.conversation.leads.name}
            </h3>
            <p class="text-sm text-gray-500">
              {props.conversation.leads.phone_number}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Archive size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onToggleRightSidebar}
            class={props.showRightSidebar ? "bg-gray-100" : ""}
          >
            <Info size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div class="flex gap-2 mt-3">
        <For each={(props?.conversation?.leads.tags ?? []) as string[]}>
          {(tag) => (
            <span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              <Tag size={10} />
              {tag}
            </span>
          )}
        </For>
      </div>
    </div>
  );
}
