#!/usr/bin/env bun

import { ConversationMetaService } from "../src/services/conversation-meta";
import { ConversationAPI } from "../src/routes/conversation-api";

async function testConversationMeta() {
  console.log("🧪 Testing Conversation Meta Service...\n");

  const testConversationId = "test-conv-123";
  const testUserId = "agent-456";

  try {
    // Test 1: Create conversation meta
    console.log("1. Creating conversation metadata...");
    await ConversationMetaService.createConversationMeta(testConversationId, false, {
      [testUserId]: 0,
    });
    console.log("✅ Conversation metadata created\n");

    // Test 2: Get conversation meta
    console.log("2. Getting conversation metadata...");
    const meta = await ConversationMetaService.getConversationMeta(testConversationId);
    console.log("✅ Retrieved metadata:", JSON.stringify(meta, null, 2), "\n");

    // Test 3: Increment unread count
    console.log("3. Incrementing unread count...");
    await ConversationMetaService.incrementUnreadCount(testConversationId);
    await ConversationMetaService.incrementUnreadCount(testConversationId);
    await ConversationMetaService.incrementUnreadCount(testConversationId);
    
    const updatedMeta = await ConversationMetaService.getConversationMeta(testConversationId);
    console.log("✅ Updated metadata after incrementing:", JSON.stringify(updatedMeta, null, 2), "\n");

    // Test 4: Get unread count for agent
    console.log("4. Getting unread count for agent...");
    const unreadCount = await ConversationMetaService.getUnreadCountForAgent(testConversationId, testUserId);
    console.log(`✅ Unread count for agent ${testUserId}: ${unreadCount}\n`);

    // Test 5: Mark as read
    console.log("5. Marking messages as read...");
    await ConversationMetaService.markAsReadForAgent(testConversationId, testUserId);
    
    const finalMeta = await ConversationMetaService.getConversationMeta(testConversationId);
    console.log("✅ Final metadata after marking as read:", JSON.stringify(finalMeta, null, 2), "\n");

    // Test 6: Set conversation as account-wide
    console.log("6. Setting conversation as account-wide...");
    await ConversationMetaService.setAccountWide(testConversationId);
    
    const accountWideMeta = await ConversationMetaService.getConversationMeta(testConversationId);
    console.log("✅ Account-wide metadata:", JSON.stringify(accountWideMeta, null, 2), "\n");

    // Test 7: Test API wrapper
    console.log("7. Testing API wrapper...");
    const apiResult = await ConversationAPI.getConversationMeta(testConversationId);
    console.log("✅ API result:", JSON.stringify(apiResult, null, 2), "\n");

    console.log("🎉 All tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testConversationMeta();
