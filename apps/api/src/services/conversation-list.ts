import { ConversationMetaService } from "./conversation-meta";
import { db, pool } from "../../db";
import { ConversationMeta, WeTable } from "../../dynamodb/entities";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";

export interface ConversationWithMeta {
  id: number;
  account: number;
  from: number;
  message?: number;
  created: Date;
  updated: Date;
  lead?: any;
  lastMessage?: any;
  // Metadata fields
  unreadCount: number;
  isAssignedToMe: boolean;
  isAccountWide: boolean;
  assignedAgents: string[];
  totalUnreadCount: number;
  lastMessageTime?: string;
  priority: string;
}

export class ConversationListService {
  /**
   * 🚀 SUPER EFFICIENT: Get all conversations for an account with metadata in a single optimized call
   * This is the RECOMMENDED approach for conversation list pages
   */
  static async getConversationsWithMeta(
    accountId: string,
    userId: string,
    limit: number = 50
  ): Promise<ConversationWithMeta[]> {
    try {
      const p1 = performance.now();
      // Step 1: Get conversations from PostgreSQL with expansions
      const conversations = await db.sql`
        SELECT 
          c.*,
          CASE 
            WHEN l.id IS NOT NULL 
            THEN row_to_json(l.*)
            ELSE NULL
          END as leads,
          CASE 
            WHEN m.id IS NOT NULL 
            THEN row_to_json(m.*)
            ELSE NULL
          END as messages
        FROM conversations c
        LEFT JOIN leads l ON c.from = l.id
        LEFT JOIN messages m ON c.message = m.id
        WHERE c.account = ${db.param(accountId)}
        ORDER BY c.updated DESC
        LIMIT ${db.param(limit)}
      `.run(pool);

      console.log(
        `Fetched ${conversations.length} conversations in ${performance.now() - p1}ms`
      );
      if (conversations.length === 0) {
        return [];
      }

      const p = performance.now();
      // Step 2: Get ALL conversation metadata for this account in ONE query 🚀
      const allMetadata =
        await ConversationMetaService.getAllConversationMetaForAccount(
          accountId.toString()
        );
      console.log(
        `Fetched ${allMetadata.length} conversation metadata in ${performance.now() - p}ms`
      );
      // Create a map for quick lookup
      const metaMap = new Map();
      allMetadata.forEach((meta) => {
        metaMap.set(meta.conversationId, meta);
      });

      // Step 3: Combine PostgreSQL data with DynamoDB metadata
      const conversationsWithMeta: ConversationWithMeta[] = conversations.map(
        (conv: any) => {
          const convId = conv.id.toString();
          const meta = metaMap.get(convId);
          let unreadCount = 0;
          let isAssignedToMe = false;
          let isAccountWide = false;
          let assignedAgents: string[] = [];

          if (meta) {
            isAccountWide = meta.isAccountWide;
            assignedAgents = Object.keys(meta.assignedAgents || {});

            if (isAccountWide) {
              unreadCount = meta.totalUnreadCount || 0;
            } else if (meta.assignedAgents?.[userId] !== undefined) {
              isAssignedToMe = true;
              unreadCount = meta.assignedAgents[userId] || 0;
            }
          }

          return {
            ...conv,
            unreadCount,
            isAssignedToMe,
            isAccountWide,
            assignedAgents,
            totalUnreadCount: meta?.totalUnreadCount || 0,
            lastMessageTime: meta?.lastMessageTime,
            priority: meta?.priority || "normal",
          };
        }
      );

      return conversationsWithMeta;
    } catch (error) {
      console.error("Error getting conversations with metadata:", error);
      throw error;
    }
  }

  /**
   * Get conversations filtered by assignment status
   */
  static async getConversationsForAgent(
    accountId: string,
    userId: string,
    limit: number = 50
  ): Promise<ConversationWithMeta[]> {
    // Get all conversations with metadata
    const allConversations = await this.getConversationsWithMeta(
      accountId,
      userId,
      limit
    );

    // Filter to only show conversations assigned to this agent or account-wide
    return allConversations.filter(
      (conv) => conv.isAssignedToMe || conv.isAccountWide
    );
  }

  /**
   * Get only conversations with unread messages
   */
  static async getUnreadConversations(
    accountId: string,
    userId: string,
    limit: number = 50
  ): Promise<ConversationWithMeta[]> {
    const allConversations = await this.getConversationsWithMeta(
      accountId,
      userId,
      limit
    );

    return allConversations.filter((conv) => conv.unreadCount > 0);
  }

  /**
   * Get unread count summary for account
   */
  static async getUnreadSummary(
    accountId: string,
    userId: string
  ): Promise<{
    totalUnreadConversations: number;
    totalUnreadMessages: number;
    assignedUnreadMessages: number;
    accountWideUnreadMessages: number;
  }> {
    const conversations = await this.getConversationsWithMeta(
      accountId,
      userId,
      1000
    ); // Get more for summary

    const unreadConversations = conversations.filter(
      (conv) => conv.unreadCount > 0
    );
    const totalUnreadMessages = unreadConversations.reduce(
      (sum, conv) => sum + conv.unreadCount,
      0
    );
    const assignedUnreadMessages = unreadConversations
      .filter((conv) => conv.isAssignedToMe)
      .reduce((sum, conv) => sum + conv.unreadCount, 0);
    const accountWideUnreadMessages = unreadConversations
      .filter((conv) => conv.isAccountWide)
      .reduce((sum, conv) => sum + conv.unreadCount, 0);

    return {
      totalUnreadConversations: unreadConversations.length,
      totalUnreadMessages,
      assignedUnreadMessages,
      accountWideUnreadMessages,
    };
  }

  /**
   * Utility method to chunk arrays
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
