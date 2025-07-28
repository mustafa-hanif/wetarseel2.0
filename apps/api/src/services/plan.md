# Conversation Metadata Implementation - COMPLETED ✅

## Original Plan

a conversation is assigned to one agent
or a conversation is with the entire account
create a conversation entity using dynamodb-toolbox which has a conversation id as primary key and META as sort key
in it is a json object of each agent's user id and the unread count of him for this conversation

## Implementation Details

### 1. DynamoDB Schema (mySchema.ts)

```typescript
export const conversationMeta = item({
  conversationId: string()
    .key()
    .transform(prefix("CONVERSATION"))
    .savedAs("pk"),
  metaType: string().key().default("META").savedAs("sk"),
  assignedAgents: record(string(), number()).optional(), // userId -> unreadCount mapping
  isAccountWide: boolean().default(false), // true if conversation is with entire account
  lastUpdated: string(),
  totalUnreadCount: number().default(0), // total unread messages across all agents
});
```

### 2. Entity Definition (entities.ts)

```typescript
export const ConversationMeta = new Entity({
  name: "CONVERSATION_META",
  table: WeTable,
  schema: conversationMeta,
});
```

### 3. Service Layer (conversation-meta.ts)

- `ConversationMetaService.createConversationMeta()` - Initialize conversation metadata
- `ConversationMetaService.assignToAgent()` - Assign conversation to specific agent
- `ConversationMetaService.setAccountWide()` - Make conversation accessible to all agents
- `ConversationMetaService.incrementUnreadCount()` - Increment unread count when message arrives
- `ConversationMetaService.markAsReadForAgent()` - Mark messages as read for specific agent
- `ConversationMetaService.markAsReadForAccount()` - Mark all messages as read for account-wide conversations
- `ConversationMetaService.getUnreadCountForAgent()` - Get unread count for specific agent
- `ConversationMetaService.removeAgent()` - Remove agent from conversation

### 4. API Layer (conversation-api.ts)

Wrapper functions for HTTP endpoints:

- `ConversationAPI.assignConversationToAgent()`
- `ConversationAPI.setConversationAccountWide()`
- `ConversationAPI.markMessagesAsRead()`
- `ConversationAPI.getUnreadCount()`
- `ConversationAPI.getConversationMeta()`

### 5. Integration with WhatsApp Consumer

- Added automatic unread count increment when messages arrive
- Imported `ConversationMetaService` in `whatsapp-consumer.ts`
- Calls `incrementUnreadCount()` after saving message to database

## DynamoDB Structure

```
PK: CONVERSATION#{conversationId}
SK: META
Attributes:
- assignedAgents: { "userId1": 3, "userId2": 0 } // unread counts per agent
- isAccountWide: false // or true for account-wide conversations
- totalUnreadCount: 5 // total unread across all agents
- lastUpdated: "2025-07-28T..."
```

## Usage Examples

### Assign conversation to agent

```typescript
await ConversationMetaService.assignToAgent("conv-123", "agent-456");
```

### Set as account-wide

```typescript
await ConversationMetaService.setAccountWide("conv-123");
```

### Mark as read

```typescript
await ConversationMetaService.markAsReadForAgent("conv-123", "agent-456");
```

### Get unread count

```typescript
const count = await ConversationMetaService.getUnreadCountForAgent(
  "conv-123",
  "agent-456"
);
```

## Testing

Run the test script:

```bash
cd apps/api
bun test-conversation-meta.mjs
```
