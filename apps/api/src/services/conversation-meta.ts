import { ConversationMeta, WeTable } from "../../dynamodb/entities";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";

export interface ConversationMetaData {
  accountId: string;
  conversationId: string;
  assignedAgents?: Record<string, number>; // userId -> unreadCount
  isAccountWide: boolean;
  lastUpdated: string;
  totalUnreadCount: number;
  lastMessageTime?: string;
  priority?: string;
}

export class ConversationMetaService {
  /**
   * 🚀 SUPER EFFICIENT: Get ALL conversation metadata for an account in ONE query
   */
  static async getAllConversationMetaForAccount(
    accountId: string
  ): Promise<ConversationMetaData[]> {
    try {
      const queryCommand = WeTable.build(QueryCommand);

      const response = await queryCommand
        .query({
          partition: `ACCOUNT#${accountId}`,
          range: { beginsWith: "CONVERSATION#" },
        })
        .entities(ConversationMeta)
        .send();

      return response.Items || [];
    } catch (error) {
      console.error(
        `Error getting all conversation meta for account ${accountId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Create or initialize conversation metadata
   */
  static async createConversationMeta(
    accountId: string,
    conversationId: string,
    isAccountWide: boolean = false,
    assignedAgents: Record<string, number> = {}
  ): Promise<void> {
    const metaData: ConversationMetaData = {
      accountId,
      conversationId,
      assignedAgents,
      isAccountWide,
      lastUpdated: new Date().toISOString(),
      totalUnreadCount: 0,
      lastMessageTime: new Date().toISOString(),
      priority: "normal",
    };

    await ConversationMeta.build(PutItemCommand).item(metaData).send();

    console.log(
      `Created conversation meta for conversation: ${conversationId} in account: ${accountId}`
    );
  }

  /**
   * Get conversation metadata
   */
  static async getConversationMeta(
    accountId: string,
    conversationId: string
  ): Promise<ConversationMetaData | null> {
    try {
      const response = await ConversationMeta.build(GetItemCommand)
        .key({
          accountId: accountId,
          conversationId: conversationId,
        })
        .send();

      return (response.Item as unknown as ConversationMetaData) || null;
    } catch (error) {
      console.error(
        `Error getting conversation meta for ${conversationId} in account ${accountId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Assign conversation to a specific agent
   */
  static async assignToAgent(
    accountId: string,
    conversationId: string,
    userId: string
  ): Promise<void> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    if (!meta) {
      // Create new meta if it doesn't exist
      await this.createConversationMeta(accountId, conversationId, false, {
        [userId]: 0,
      });
      return;
    }

    const updatedAgents = {
      ...meta.assignedAgents,
      [userId]: meta.assignedAgents?.[userId] || 0,
    };

    await ConversationMeta.build(PutItemCommand)
      .item({
        accountId,
        conversationId,
        assignedAgents: updatedAgents,
        isAccountWide: false,
        lastUpdated: new Date().toISOString(),
        totalUnreadCount: meta.totalUnreadCount || 0,
        lastMessageTime: meta.lastMessageTime,
        priority: meta.priority || "normal",
      })
      .send();

    console.log(
      `Assigned conversation ${conversationId} to agent ${userId} in account ${accountId}`
    );
  }

  /**
   * Set conversation as account-wide (not assigned to specific agent)
   */
  static async setAccountWide(
    accountId: string,
    conversationId: string
  ): Promise<void> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    await ConversationMeta.build(PutItemCommand)
      .item({
        accountId,
        conversationId,
        isAccountWide: true,
        assignedAgents: {},
        lastUpdated: new Date().toISOString(),
        totalUnreadCount: meta?.totalUnreadCount || 0,
        lastMessageTime: meta?.lastMessageTime,
        priority: meta?.priority || "normal",
      })
      .send();

    console.log(
      `Set conversation ${conversationId} as account-wide in account ${accountId}`
    );
  }

  /**
   * Increment unread count for a conversation
   * If assigned to specific agents, increment their counts
   * If account-wide, increment total count
   */
  static async incrementUnreadCount(
    accountId: string,
    conversationId: string
  ): Promise<void> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    if (!meta) {
      // Create new meta if it doesn't exist (account-wide by default)
      await this.createConversationMeta(accountId, conversationId, true, {});
      await this.incrementUnreadCount(accountId, conversationId); // Retry after creation
      return;
    }

    if (meta.isAccountWide) {
      // Increment total unread count for account-wide conversations
      await ConversationMeta.build(PutItemCommand)
        .item({
          accountId,
          conversationId,
          assignedAgents: meta.assignedAgents || {},
          isAccountWide: true,
          totalUnreadCount: (meta.totalUnreadCount || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastMessageTime: new Date().toISOString(),
          priority: meta.priority || "normal",
        })
        .send();
    } else {
      // Increment unread count for each assigned agent
      const updatedAgents = { ...meta.assignedAgents };
      for (const userId in updatedAgents) {
        updatedAgents[userId] = (updatedAgents[userId] || 0) + 1;
      }

      await ConversationMeta.build(PutItemCommand)
        .item({
          accountId,
          conversationId,
          assignedAgents: updatedAgents,
          isAccountWide: false,
          totalUnreadCount: (meta.totalUnreadCount || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastMessageTime: new Date().toISOString(),
          priority: meta.priority || "normal",
        })
        .send();
    }

    console.log(
      `Incremented unread count for conversation: ${conversationId} in account: ${accountId}`
    );
  }

  /**
   * Mark messages as read for a specific agent
   */
  static async markAsReadForAgent(
    accountId: string,
    conversationId: string,
    userId: string
  ): Promise<void> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    if (!meta || !meta.assignedAgents?.[userId]) {
      console.log(
        `No unread messages for agent ${userId} in conversation ${conversationId} in account ${accountId}`
      );
      return;
    }

    const unreadCount = meta.assignedAgents[userId];
    const updatedAgents = { ...meta.assignedAgents };
    updatedAgents[userId] = 0;

    const newTotalUnread = Math.max(
      0,
      (meta.totalUnreadCount || 0) - unreadCount
    );

    await ConversationMeta.build(PutItemCommand)
      .item({
        accountId,
        conversationId,
        assignedAgents: updatedAgents,
        isAccountWide: meta.isAccountWide,
        totalUnreadCount: newTotalUnread,
        lastUpdated: new Date().toISOString(),
        lastMessageTime: meta.lastMessageTime,
        priority: meta.priority || "normal",
      })
      .send();

    console.log(
      `Marked ${unreadCount} messages as read for agent ${userId} in conversation ${conversationId} in account ${accountId}`
    );
  }

  /**
   * Mark all messages as read for account-wide conversation
   */
  static async markAsReadForAccount(
    accountId: string,
    conversationId: string
  ): Promise<void> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    if (!meta) {
      return;
    }

    await ConversationMeta.build(PutItemCommand)
      .item({
        accountId,
        conversationId,
        assignedAgents: meta.assignedAgents || {},
        isAccountWide: meta.isAccountWide,
        totalUnreadCount: 0,
        lastUpdated: new Date().toISOString(),
        lastMessageTime: meta.lastMessageTime,
        priority: meta.priority || "normal",
      })
      .send();

    console.log(
      `Marked all messages as read for account-wide conversation: ${conversationId} in account ${accountId}`
    );
  }

  /**
   * Get unread count for a specific agent
   */
  static async getUnreadCountForAgent(
    accountId: string,
    conversationId: string,
    userId: string
  ): Promise<number> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    if (!meta) return 0;

    if (meta.isAccountWide) {
      return meta.totalUnreadCount || 0;
    }

    return meta.assignedAgents?.[userId] || 0;
  }

  /**
   * Get total unread count for conversation
   */
  static async getTotalUnreadCount(
    accountId: string,
    conversationId: string
  ): Promise<number> {
    const meta = await this.getConversationMeta(accountId, conversationId);
    return meta?.totalUnreadCount || 0;
  }

  /**
   * Remove agent from conversation
   */
  static async removeAgent(
    accountId: string,
    conversationId: string,
    userId: string
  ): Promise<void> {
    const meta = await this.getConversationMeta(accountId, conversationId);

    if (!meta || !meta.assignedAgents?.[userId]) {
      return;
    }

    const unreadCount = meta.assignedAgents[userId];
    const updatedAgents = { ...meta.assignedAgents };
    delete updatedAgents[userId];

    const newTotalUnread = Math.max(
      0,
      (meta.totalUnreadCount || 0) - unreadCount
    );

    // If no agents left, make it account-wide
    const isAccountWide = Object.keys(updatedAgents).length === 0;

    await ConversationMeta.build(PutItemCommand)
      .item({
        accountId,
        conversationId,
        assignedAgents: updatedAgents,
        isAccountWide,
        totalUnreadCount: newTotalUnread,
        lastUpdated: new Date().toISOString(),
        lastMessageTime: meta.lastMessageTime,
        priority: meta.priority || "normal",
      })
      .send();

    console.log(
      `Removed agent ${userId} from conversation ${conversationId} in account ${accountId}`
    );
  }

  /**
   * 🎯 GAME CHANGER: Get conversations filtered by assignment in a single query
   */
  static async getConversationsForAgent(
    accountId: string,
    userId: string
  ): Promise<ConversationMetaData[]> {
    // Get all conversation metadata for the account
    const allMeta = await this.getAllConversationMetaForAccount(accountId);

    // Filter in application layer (still very fast since it's in memory)
    return allMeta.filter(
      (meta) =>
        meta.isAccountWide || meta.assignedAgents?.hasOwnProperty(userId)
    );
  }

  /**
   * Get only conversations with unread messages
   */
  static async getUnreadConversationsForAccount(
    accountId: string
  ): Promise<ConversationMetaData[]> {
    const allMeta = await this.getAllConversationMetaForAccount(accountId);

    return allMeta.filter((meta) => (meta.totalUnreadCount || 0) > 0);
  }
}
