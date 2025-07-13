import Tag from "lucide-solid/icons/tag";
import User from "lucide-solid/icons/user";
import { createEffect, createSignal, For, Show } from "solid-js";
import { Conversation } from "@/types/chat";
import { formatDate } from "@/utils/chatUtils";
import { Button } from "../ui/button";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
}

export function ConversationList(props: ConversationListProps) {
  const [loadMore, setLoadMore] = createSignal(10);
  return (
    <div class="flex-1 overflow-y-auto">
      <For each={props.conversations.slice(0, loadMore())}>
        {(conversation) => {
          const tags = (conversation?.leads?.tags ?? []) as string[];
          return (
            <div
              class={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                props.selectedConversation?.id === conversation.id
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
              onClick={() => props.onConversationSelect(conversation)}
            >
              <div class="flex items-start gap-3">
                {/* Avatar */}
                <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={20} class="text-gray-600" />
                </div>

                {/* Content */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-medium text-gray-900 truncate">
                      {conversation.leads?.name}
                    </h3>
                    <span class="text-xs text-gray-500">
                      {formatDate(conversation.updated ?? "")}
                    </span>
                  </div>

                  <p class="text-sm text-gray-600 truncate mt-1">
                    {conversation?.messages?.message ?? ""}
                  </p>

                  <div class="flex items-center justify-between mt-2">
                    {/* Tags */}
                    <div class="flex gap-1">
                      <For each={tags.slice(0, 2)}>
                        {(tag) => (
                          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            <Tag size={10} />
                            {tag}
                          </span>
                        )}
                      </For>
                      <Show when={tags.length > 2}>
                        <span class="text-xs text-gray-500">
                          +{tags.length - 2}
                        </span>
                      </Show>
                    </div>

                    {/* Unread count */}
                    <Show when={Number(conversation.unread_count) > 0}>
                      <span class="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {Number(conversation.unread_count)}
                      </span>
                    </Show>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </For>

      <Show when={props.conversations.length > 0}>
        <Button
          class="mx-auto mt-4"
          variant={"outline"}
          onClick={() => setLoadMore((prev) => prev + 10)}
        >
          Load More
        </Button>
      </Show>
      <Show when={props.conversations.length === 0}>
        <div class="p-8 text-center text-gray-500">
          <div class="text-lg mb-2">No conversations found</div>
          <div class="text-sm">Try adjusting your search or filters</div>
        </div>
      </Show>
    </div>
  );
}
