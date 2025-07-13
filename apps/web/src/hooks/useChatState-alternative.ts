// Alternative approach: Let the component handle the query, hook handles the state
import { createSignal, createMemo, createEffect } from "solid-js";
import { Conversation, Message } from "@/types/chat";
import { isWithinDateWindow } from "@/utils/chatUtils";

export function useChatState(initialMessages?: Message[]) {
  // Core state
  const [conversations, setConversations] = createSignal<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = createSignal<Conversation | null>(null);
  const [messages, setMessages] = createSignal<Message[]>(initialMessages ?? []);
  const [newMessage, setNewMessage] = createSignal("");

  // Filter state
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedTeam, setSelectedTeam] = createSignal<string | null>(null);
  const [selectedAgent, setSelectedAgent] = createSignal<string | null>(null);
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = createSignal(false);

  // UI state
  const [showRightSidebar, setShowRightSidebar] = createSignal(false);
  const [showTagFilter, setShowTagFilter] = createSignal(false);

  // Date filter state
  const [dateFilterEnabled, setDateFilterEnabled] = createSignal(false);
  const [dateWindowStart, setDateWindowStart] = createSignal(new Date());

  // Auto-select first conversation when conversations change
  createEffect(() => {
    const convs = conversations();
    if (convs.length > 0 && !selectedConversation()) {
      setSelectedConversation(convs[0]);
    }
  });

  // Method to update conversations from external source
  const updateConversations = (newConversations: Conversation[]) => {
    setConversations(newConversations);
  };

  // Computed values
  const allTags = createMemo(() => {
    const tagSet = new Set<string>();
    conversations().forEach((conv) => {
      if (conv.campaign) tagSet.add(conv.campaign);
      if (conv.assigned_agent) tagSet.add(`agent:${conv.assigned_agent}`);
    });
    return Array.from(tagSet).sort();
  });

  const filteredConversations = createMemo(() => {
    let filtered = conversations();

    if (searchQuery()) {
      filtered = filtered.filter(
        (conv) =>
          (conv?.name ?? "")
            .toLowerCase()
            .includes(searchQuery().toLowerCase()) ||
          (conv?.phone_number ?? "").includes(searchQuery())
      );
    }

    if (selectedTeam()) {
      filtered = filtered.filter((conv) => conv.campaign === selectedTeam());
    }

    if (selectedAgent()) {
      filtered = filtered.filter(
        (conv) => conv.assigned_agent === selectedAgent()
      );
    }

    if (selectedTags().length > 0) {
      filtered = filtered.filter((conv) =>
        selectedTags().some((tag) => 
          conv.campaign === tag || 
          conv.assigned_agent === tag.replace('agent:', '') ||
          tag.includes(conv.assigned_agent || '')
        )
      );
    }

    if (showUnreadOnly()) {
      filtered = filtered.filter((conv) => (conv as any).unread_count > 0);
    }

    if (dateFilterEnabled()) {
      filtered = filtered.filter((conv) =>
        isWithinDateWindow(conv.created || '', dateWindowStart())
      );
    }

    return filtered;
  });

  // Rest of your actions...
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const sendMessage = (event: Event) => {
    event.preventDefault();
    if (!newMessage().trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage(),
      timestamp: new Date().toISOString(),
      isOutgoing: true,
      status: "sent",
      type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const selectTeam = (teamId: string | null) => {
    setSelectedTeam(teamId);
    setSelectedAgent(null);
  };

  const selectAgent = (agentId: string | null) => {
    setSelectedAgent(agentId);
    setSelectedTeam(null);
  };

  const moveDateWindow = (direction: "forward" | "backward") => {
    const current = new Date(dateWindowStart());
    if (direction === "forward") {
      current.setDate(current.getDate() + 2);
    } else {
      current.setDate(current.getDate() - 2);
    }
    setDateWindowStart(current);
  };

  const resetDateWindow = () => {
    setDateWindowStart(new Date());
  };

  return {
    // State
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    newMessage,
    setNewMessage,
    searchQuery,
    setSearchQuery,
    selectedTeam,
    selectedAgent,
    selectedTags,
    showUnreadOnly,
    setShowUnreadOnly,
    showRightSidebar,
    setShowRightSidebar,
    showTagFilter,
    setShowTagFilter,
    dateFilterEnabled,
    setDateFilterEnabled,
    dateWindowStart,

    // Computed
    allTags,
    filteredConversations,

    // Actions
    updateConversations, // New method to update conversations
    toggleTag,
    clearTags,
    sendMessage,
    selectTeam,
    selectAgent,
    moveDateWindow,
    resetDateWindow,
  };
}
