import { createSignal, createMemo } from "solid-js";
import { Conversation, Message, Team, Agent } from "@/types/chat";
import { isWithinDateWindow } from "@/utils/chatUtils";

export function useChatState(
  initialConversations: Conversation[],
  initialMessages: Message[]
) {
  // Core state
  const [selectedConversation, setSelectedConversation] =
    createSignal<Conversation | null>(initialConversations[0] || null);
  const [messages, setMessages] = createSignal<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = createSignal("");
  const [conversations, setConversations] =
    createSignal<Conversation[]>(initialConversations);

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

  // Computed values
  const allTags = createMemo(() => {
    const tagSet = new Set<string>();
    conversations().forEach((conv) => {
      conv.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  const filteredConversations = createMemo(() => {
    let filtered = conversations();

    if (searchQuery()) {
      filtered = filtered.filter(
        (conv) =>
          conv.name.toLowerCase().includes(searchQuery().toLowerCase()) ||
          conv.phone.includes(searchQuery()) ||
          conv.lastMessage.toLowerCase().includes(searchQuery().toLowerCase())
      );
    }

    if (selectedTeam()) {
      filtered = filtered.filter((conv) => conv.teamId === selectedTeam());
    }

    if (selectedAgent()) {
      filtered = filtered.filter(
        (conv) => conv.assignedAgent === selectedAgent()
      );
    }

    if (selectedTags().length > 0) {
      filtered = filtered.filter((conv) =>
        selectedTags().some((tag) => conv.tags.includes(tag))
      );
    }

    if (showUnreadOnly()) {
      filtered = filtered.filter((conv) => conv.unreadCount > 0);
    }

    if (dateFilterEnabled()) {
      filtered = filtered.filter((conv) =>
        isWithinDateWindow(conv.lastActivity, dateWindowStart())
      );
    }

    return filtered;
  });

  // Date filter utilities
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

  // Actions
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

  return {
    // State
    selectedConversation,
    setSelectedConversation,
    messages,
    newMessage,
    setNewMessage,
    conversations,
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
    toggleTag,
    clearTags,
    sendMessage,
    selectTeam,
    selectAgent,
    moveDateWindow,
    resetDateWindow,
  };
}
