import { useAuth } from "@/hooks/useAuth";
import { createFileRoute } from "@tanstack/solid-router";
import { Show } from "solid-js";
import {
  mockTeams,
  mockAgents,
  mockConversations,
  mockMessages,
} from "@/data/mockData";
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

export const Route = createFileRoute("/(app)/chat")({
  component: RouteComponent,
});

function RouteComponent() {
  const data = useAuth();
  const chatState = useChatState(mockConversations, mockMessages);

  return (
    <div class="flex h-full bg-gray-100">
      {/* Left Sidebar - Teams and Agents */}
      <TeamAgentSidebar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeam={chatState.selectedTeam()}
        selectedAgent={chatState.selectedAgent()}
        conversationCount={chatState.conversations().length}
        onTeamSelect={chatState.selectTeam}
        onAgentSelect={chatState.selectAgent}
      />

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
          conversations={chatState.filteredConversations()}
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

          <MessagesArea messages={chatState.messages()} />

          <MessageInput
            newMessage={chatState.newMessage()}
            onMessageChange={chatState.setNewMessage}
            onSendMessage={chatState.sendMessage}
          />
        </Show>
      </div>

      {/* Right Sidebar - Conversation Details */}
      <Show
        when={chatState.showRightSidebar() && chatState.selectedConversation()}
      >
        <ContactSidebar
          conversation={chatState.selectedConversation()!}
          teams={mockTeams}
          agents={mockAgents}
          onClose={() => chatState.setShowRightSidebar(false)}
        />
      </Show>
    </div>
  );
}
