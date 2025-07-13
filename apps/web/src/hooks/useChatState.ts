import { createSignal, createMemo, createEffect, Accessor } from "solid-js";
import { Conversation, Message, Team, Agent } from "@/types/chat";
import { isWithinDateWindow } from "@/utils/chatUtils";
import { UseQueryResult } from "@tanstack/solid-query";

export function useChatState(
  conversations: Accessor<UseQueryResult<Conversation[], Error>>
) {
  // Core state
  const [selectedConversation, setSelectedConversation] =
    createSignal<Conversation | null>(conversations().data?.[0] || null);

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
    conversations()?.data?.forEach((conv) => {
      ((conv?.leads?.tags ?? []) as string[]).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  const filteredConversations = createMemo(() => {
    let filtered = conversations().data ?? [];

    if (searchQuery()) {
      filtered = filtered.filter(
        (conv) =>
          (conv?.leads?.name ?? "")
            .toLowerCase()
            .includes(searchQuery().toLowerCase()) ||
          (conv?.leads?.phone_number ?? "").includes(searchQuery()) // ||
        // conv.lastMessage.toLowerCase().includes(searchQuery().toLowerCase())
      );
    }

    // if (selectedTeam()) {
    //   filtered = filtered.filter((conv) => conv.teamId === selectedTeam());
    // }

    if (selectedAgent()) {
      filtered = filtered.filter(
        (conv) => conv.assigned_agent === selectedAgent()
      );
    }

    if (selectedTags().length > 0) {
      filtered = filtered.filter((conv) =>
        selectedTags().some((tag) =>
          ((conv?.leads?.tags ?? []) as string[]).includes(tag)
        )
      );
    }

    if (showUnreadOnly()) {
      filtered = filtered.filter((conv) => Number(conv.unread_count) > 0);
    }

    if (dateFilterEnabled()) {
      filtered = filtered.filter((conv) =>
        isWithinDateWindow(conv.updated ?? "", dateWindowStart())
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
    selectTeam,
    selectAgent,
    moveDateWindow,
    resetDateWindow,
  };
}
