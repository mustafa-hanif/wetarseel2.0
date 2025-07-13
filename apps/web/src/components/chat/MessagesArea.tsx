import Check from "lucide-solid/icons/check";
import CheckCheck from "lucide-solid/icons/check-check";
import { createEffect, For, Show } from "solid-js";
import { Message } from "@/types/chat";
import { formatTime } from "@/utils/chatUtils";

interface MessagesAreaProps {
  messages?: Message[];
}

export function MessagesArea(props: MessagesAreaProps) {
  let scrollContainer: HTMLDivElement | undefined;

  // Scroll to bottom when messages change
  createEffect(() => {
    if (props.messages && scrollContainer) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollContainer!.scrollTop = scrollContainer!.scrollHeight;
      }, 0);
    }
  });

  return (
    <div
      ref={scrollContainer}
      class="flex-1 overflow-y-auto p-4 bg-gray-50"
      style={{
        "background-color": "#f9fafb",
        "background-image":
          "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
        "background-size": "20px 20px",
        "background-position": "0 0, 10px 10px",
      }}
    >
      <div class="space-y-4">
        <For each={props.messages}>
          {(message) => (
            <div
              class={`flex ${message.from === "agent" ? "justify-end" : "justify-start"}`}
            >
              <div
                class={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.from === "agent"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <p class="text-sm">{message.message}</p>
                <div
                  class={`flex items-center justify-end gap-1 mt-1 ${
                    message.from === "agent" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  <span class="text-xs">
                    {formatTime(message.created ?? "")}
                  </span>
                  <Show when={message.from === "agent"}>
                    <Show
                      when={message.delivery_status === "read"}
                      fallback={<Check size={12} />}
                    >
                      <CheckCheck size={12} />
                    </Show>
                  </Show>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
