import { ConversationListService } from "../src/services/conversation-list";
import { ConversationMetaService } from "../src/services/conversation-meta";

export default {
  async fetch(req: Request, accountId: string) {
    const url = new URL(req.url);
    const method = req.method;

    if (method === "GET") {
      return await handleGetConversations(url, accountId);
    } else if (method === "POST") {
      return await handlePostConversations(url, req, accountId);
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
      });
    }
  },
};

async function handleGetConversations(url: URL, accountId: string) {
  try {
    const userId = url.searchParams.get("userId");
    const limit = Number(url.searchParams.get("limit")) || 50;
    const filter = url.searchParams.get("filter"); // "assigned" | "unread" | "all"
    const pathname = url.pathname;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
      });
    }

    // Handle different endpoints
    if (pathname.includes("/summary")) {
      // GET /conversations/summary
      const summary = await ConversationListService.getUnreadSummary(
        accountId,
        userId
      );

      return new Response(
        JSON.stringify({
          success: true,
          summary,
        }),
        { status: 200 }
      );
    } else {
      // GET /conversations
      let conversations;

      switch (filter) {
        case "assigned":
          conversations =
            await ConversationListService.getConversationsForAgent(
              accountId,
              userId,
              limit
            );
          break;
        case "unread":
          conversations = await ConversationListService.getUnreadConversations(
            accountId,
            userId,
            limit
          );
          break;
        default:
          conversations =
            await ConversationListService.getConversationsWithMeta(
              accountId,
              userId,
              limit
            );
      }

      return new Response(
        JSON.stringify({
          success: true,
          conversations,
          total: conversations.length,
        }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch conversations" }),
      { status: 500 }
    );
  }
}

async function handlePostConversations(
  url: URL,
  req: Request,
  accountId: string
) {
  try {
    const pathname = url.pathname;
    const conversationId = pathname.split("/")[2]; // /conversations/:id/action

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        {
          status: 400,
        }
      );
    }

    if (pathname.includes("/read")) {
      // POST /conversations/:conversationId/read
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
        });
      }

      // Get conversation metadata to determine if it's account-wide
      const meta = await ConversationMetaService.getConversationMeta(
        accountId,
        conversationId
      );

      if (!meta) {
        return new Response(
          JSON.stringify({ error: "Conversation not found" }),
          { status: 404 }
        );
      }

      if (meta.isAccountWide) {
        await ConversationMetaService.markAsReadForAccount(
          accountId,
          conversationId
        );
      } else {
        await ConversationMetaService.markAsReadForAgent(
          accountId,
          conversationId,
          userId
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Conversation marked as read",
        }),
        { status: 200 }
      );
    } else if (pathname.includes("/assign")) {
      // POST /conversations/:conversationId/assign
      const body = (await req.json()) as { userId?: string };
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
        });
      }

      await ConversationMetaService.assignToAgent(
        accountId,
        conversationId,
        userId
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Conversation assigned to ${userId}`,
        }),
        { status: 200 }
      );
    } else if (pathname.includes("/unassign")) {
      // POST /conversations/:conversationId/unassign
      await ConversationMetaService.setAccountWide(accountId, conversationId);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Conversation set as account-wide",
        }),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
        status: 404,
      });
    }
  } catch (error) {
    console.error("Error processing conversation action:", error);
    return new Response(JSON.stringify({ error: "Failed to process action" }), {
      status: 500,
    });
  }
}
