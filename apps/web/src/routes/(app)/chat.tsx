import { useAuth } from "@/hooks/useAuth";
import { createFileRoute } from "@tanstack/solid-router";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  Show,
  Suspense,
} from "solid-js";

import { useChatState } from "@/hooks/useChatState";

// Components
import { TeamAgentSidebar } from "@/components/chat/TeamAgentSidebar";
import { ConversationFilters } from "@/components/chat/ConversationFilters";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessagesArea } from "@/components/chat/MessagesArea";
import { MessageInput } from "@/components/chat/MessageInput";
import { ContactSidebar } from "@/components/chat/ContactSidebar";
import { EmptyState } from "@/components/chat/EmptyState";
import { dbquery } from "@/lib/useQueryTable";
import { Conversation, Message } from "@/types/chat";
import { UseQueryResult } from "@tanstack/solid-query";
import { useMessageState } from "@/hooks/useMessageState";
import { useSequentialConversations } from "@/hooks/useSequentialQuery";

export const Route = createFileRoute("/(app)/chat")({
  component: RouteComponent,
  errorComponent: ({ error }) => {
    // Render an error message
    console.error(error);
    return <div>{error.message}</div>;
  },
});

function RouteComponent() {
  const conversationsState = useSequentialConversations();

  const chatState = useChatState(
    conversationsState.query as Accessor<UseQueryResult<Conversation[], Error>>
  );
  const messages = dbquery(
    "messages",
    () => ({
      filter: `convo_id.=.` + chatState.selectedConversation()?.id,
      limit: 1000,
    }),
    () => [chatState.selectedConversation()?.id ?? "0"], // Dependencies array
    {
      enabled: () => !!chatState.selectedConversation()?.id,
      staleTime: () => 0,
    }
  );

  const messageState = useMessageState();

  return (
    <div class="flex h-full bg-gray-100">
      {/* Left Sidebar - Teams and Agents */}
      {/* <TeamAgentSidebar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeam={chatState.selectedTeam()}
        selectedAgent={chatState.selectedAgent()}
        conversationCount={chatState.conversations()?.data?.length ?? 0}
        onTeamSelect={chatState.selectTeam}
        onAgentSelect={chatState.selectAgent}
      /> */}

      {/* Conversations List */}
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ConversationFilters
          searchQuery={chatState.searchQuery()}
          onSearchChange={chatState.setSearchQuery}
          dateFilterEnabled={chatState.dateFilterEnabled()}
          onDateFilterToggle={() =>
            chatState.setDateFilterEnabled(!chatState.dateFilterEnabled())
          }
          dateWindowStart={chatState.dateWindowStart()}
          onDateWindowMove={chatState.moveDateWindow}
          onDateWindowReset={chatState.resetDateWindow}
          showUnreadOnly={chatState.showUnreadOnly()}
          onUnreadToggle={() =>
            chatState.setShowUnreadOnly(!chatState.showUnreadOnly())
          }
          showTagFilter={chatState.showTagFilter()}
          onTagFilterToggle={() =>
            chatState.setShowTagFilter(!chatState.showTagFilter())
          }
          selectedTags={chatState.selectedTags()}
          allTags={chatState.allTags()}
          onTagToggle={chatState.toggleTag}
          onClearTags={chatState.clearTags}
        />

        <ConversationList
          conversations={chatState.filteredConversations ?? []}
          selectedConversation={chatState.selectedConversation()}
          onConversationSelect={chatState.setSelectedConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div class="flex-1 flex flex-col">
        <Show when={chatState.selectedConversation()} fallback={<EmptyState />}>
          <ChatHeader
            conversation={chatState.selectedConversation()!}
            showRightSidebar={chatState.showRightSidebar()}
            onToggleRightSidebar={() =>
              chatState.setShowRightSidebar(!chatState.showRightSidebar())
            }
          />

          <Show when={!messages().isPending}>
            <MessagesArea messages={messages().data} />
          </Show>
          <MessageInput
            newMessage={messageState.newMessage()}
            onMessageChange={messageState.setNewMessage}
            onSendMessage={messageState.sendMessage}
          />
        </Show>
      </div>

      {/* Right Sidebar - Conversation Details */}
      {/* <Show
        when={chatState.showRightSidebar() && chatState.selectedConversation()}
      >
        <ContactSidebar
          conversation={chatState.selectedConversation()!}
          teams={mockTeams}
          agents={mockAgents}
          onClose={() => chatState.setShowRightSidebar(false)}
        />
      </Show> */}
    </div>
  );
}
