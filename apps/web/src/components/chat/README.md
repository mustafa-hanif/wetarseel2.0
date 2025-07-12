# Chat Components Architecture

This directory contains the modular chat interface components that were split from the original monolithic chat component.

## Component Structure

### Core Components

#### `TeamAgentSidebar.tsx`

- **Purpose**: Left sidebar displaying teams and agents
- **Props**: Teams list, agents list, selection state, and callbacks
- **Features**: Team inbox, agent filtering, conversation counts

#### `ConversationFilters.tsx`

- **Purpose**: Search and filter controls for conversations
- **Props**: Filter states, search query, and callback functions
- **Features**:
  - Text search
  - Date range filtering (2-day window)
  - Unread messages filter
  - Tag-based filtering

#### `ConversationList.tsx`

- **Purpose**: List of conversations with basic info
- **Props**: Filtered conversations, selection state, callback
- **Features**: Conversation cards with avatars, timestamps, tags, unread counts

#### `ChatHeader.tsx`

- **Purpose**: Header for active conversation
- **Props**: Selected conversation, sidebar state, toggle callback
- **Features**: Contact info, action buttons, conversation tags

#### `MessagesArea.tsx`

- **Purpose**: Message display area with chat bubbles
- **Props**: Messages array
- **Features**: Incoming/outgoing message styling, timestamps, read status

#### `MessageInput.tsx`

- **Purpose**: Message composition and sending
- **Props**: Input value, change handler, submit handler
- **Features**: Text input with send button

#### `ContactSidebar.tsx`

- **Purpose**: Right sidebar with detailed contact information
- **Props**: Selected conversation, teams/agents data, close callback
- **Features**:
  - Contact details (email, phone, company, location)
  - Assignment information (team, agent)
  - Tags display
  - Timeline (created, last activity)
  - Notes section

#### `EmptyState.tsx`

- **Purpose**: Placeholder when no conversation is selected
- **Props**: Optional title and subtitle
- **Features**: Icon and messaging prompting user to select a conversation

## Supporting Files

### `types/chat.ts`

- TypeScript interfaces for all chat-related data structures
- Includes: `Message`, `Conversation`, `Team`, `Agent`

### `data/mockData.ts`

- Mock data for development and testing
- Exports: `mockTeams`, `mockAgents`, `mockConversations`, `mockMessages`

### `utils/chatUtils.ts`

- Utility functions for date/time formatting and filtering
- Functions: `formatTime`, `formatDate`, `formatDateRange`, `isWithinDateWindow`

### `hooks/useChatState.ts`

- Custom hook managing all chat state and logic
- Encapsulates: filters, selections, UI state, computed values, actions

## Usage

The main chat route (`routes/(app)/chat.tsx`) now simply composes these components:

```tsx
import { useChatState } from "@/hooks/useChatState";
import {
  mockTeams,
  mockAgents,
  mockConversations,
  mockMessages,
} from "@/data/mockData";
import {
  TeamAgentSidebar,
  ConversationFilters,
  ConversationList,
  ChatHeader,
  MessagesArea,
  MessageInput,
  ContactSidebar,
  EmptyState,
} from "@/components/chat";

function ChatRoute() {
  const chatState = useChatState(mockConversations, mockMessages);

  return (
    <div class="flex h-full bg-gray-100">
      <TeamAgentSidebar {...teamAgentProps} />
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <ConversationFilters {...filterProps} />
        <ConversationList {...listProps} />
      </div>
      <div class="flex-1 flex flex-col">
        <Show when={chatState.selectedConversation()} fallback={<EmptyState />}>
          <ChatHeader {...headerProps} />
          <MessagesArea {...messageProps} />
          <MessageInput {...inputProps} />
        </Show>
      </div>
      <Show when={chatState.showRightSidebar()}>
        <ContactSidebar {...sidebarProps} />
      </Show>
    </div>
  );
}
```

## Benefits of This Architecture

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be used in different contexts
3. **Testability**: Easier to unit test individual components
4. **Maintainability**: Changes to one feature don't affect others
5. **Type Safety**: Strong typing throughout with shared interfaces
6. **Performance**: Better tree-shaking and code splitting opportunities
7. **Developer Experience**: Easier to locate and modify specific functionality

## File Organization

```
src/
├── components/chat/
│   ├── index.ts                 # Re-exports for easy importing
│   ├── TeamAgentSidebar.tsx     # Left sidebar
│   ├── ConversationFilters.tsx  # Search and filters
│   ├── ConversationList.tsx     # Conversation list
│   ├── ChatHeader.tsx           # Chat header
│   ├── MessagesArea.tsx         # Message display
│   ├── MessageInput.tsx         # Message input
│   ├── ContactSidebar.tsx       # Right sidebar
│   └── EmptyState.tsx           # Empty state
├── types/
│   └── chat.ts                  # Type definitions
├── data/
│   └── mockData.ts              # Mock data
├── utils/
│   └── chatUtils.ts             # Utility functions
├── hooks/
│   └── useChatState.ts          # State management hook
└── routes/(app)/
    └── chat.tsx                 # Main chat route
```
