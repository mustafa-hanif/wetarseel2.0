import { Icon } from "@iconify-icon/solid";
import { Show } from "solid-js";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <div class="flex-1 flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Icon
            icon="mdi:chat-outline"
            width={32}
            height={32}
            class="text-gray-400"
          />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {props.title || "Select a conversation"}
        </h3>
        <p class="text-gray-500">
          {props.subtitle ||
            "Choose a conversation from the list to start messaging"}
        </p>
      </div>
    </div>
  );
}
