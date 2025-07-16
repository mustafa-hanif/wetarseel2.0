import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  type Message,
} from "@aws-sdk/client-sqs";

import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { QueryCommand, type Query } from "dynamodb-toolbox/table/actions/query";
import { UserConnection, WeTable } from "dynamodb/entities";
import { db, type s, pool } from "../../db";

interface WMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}
interface WhatsAppWebhookMessage {
  timestamp: string;
  source: string;
  data: {
    object: string;
    entry: Array<{
      id: string;
      changes: Array<{
        value: {
          messaging_product: string;
          metadata: {
            display_phone_number: string;
            phone_number_id: string;
          };
          contacts: Array<{
            profile: {
              name: string;
            };
            wa_id: string;
          }>;
          messages?: Array<WMessage>;
          statuses?: Array<{
            id: string;
            status: string;
            timestamp: string;
            recipient_id: string;
          }>;
        };
        field: string;
      }>;
    }>;
  };
  headers: Record<string, string>;
}

interface Contact {
  profile: {
    name: string;
  };
  wa_id: string;
}

interface UserConnectionItem {
  phoneNumberId: string;
  userId: string;
  connectionId: string;
  domain: string;
  stage: string;
  // Add other properties as needed
}

export class WhatsAppSQSConsumer {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private isRunning = false;
  private pollingInterval = 5000; // 5 seconds
  private maxMessages = 10; // Process up to 10 messages at once
  private waitTimeSeconds = 20; // Long polling

  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || "me-central-1",
    });
    this.queueUrl = process.env.WHATSAPP_SQS_QUEUE_URL || "";

    if (!this.queueUrl) {
      throw new Error(
        "WHATSAPP_SQS_QUEUE_URL environment variable is required"
      );
    }
  }

  /**
   * Start consuming messages from the SQS queue
   */
  public start(): void {
    if (this.isRunning) {
      console.log("WhatsApp SQS consumer is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting WhatsApp SQS consumer...");
    this.poll();
  }

  /**
   * Stop consuming messages
   */
  public stop(): void {
    this.isRunning = false;
    console.log("Stopping WhatsApp SQS consumer...");
  }

  /**
   * Poll for messages from SQS
   */
  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.receiveAndProcessMessages();
      } catch (error) {
        console.error("Error polling SQS:", error);
        // Wait a bit before retrying on error
        await this.sleep(this.pollingInterval);
      }
    }
  }

  /**
   * Receive and process messages from SQS
   */
  private async receiveAndProcessMessages(): Promise<void> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: this.maxMessages,
      WaitTimeSeconds: this.waitTimeSeconds,
      MessageAttributeNames: ["All"],
    });

    const response = await this.sqsClient.send(command);

    if (response.Messages && response.Messages.length > 0) {
      console.log(
        `Received ${response.Messages.length} WhatsApp messages from SQS`
      );

      // Process messages in parallel
      const processingPromises = response.Messages.map((message) =>
        this.processMessage(message)
      );

      await Promise.allSettled(processingPromises);
    }
  }

  /**
   * Process a single SQS message
   */
  private async processMessage(message: Message): Promise<void> {
    try {
      if (!message.Body) {
        console.warn("Received message without body");
        return;
      }

      const webhookMessage: WhatsAppWebhookMessage = JSON.parse(message.Body);
      console.log("Processing WhatsApp webhook message:", {
        timestamp: webhookMessage.timestamp,
        source: webhookMessage.source,
        messageCount:
          webhookMessage.data.entry?.[0]?.changes?.[0]?.value?.messages
            ?.length || 0,
      });

      // Process the WhatsApp webhook data
      await this.handleWhatsAppWebhook(webhookMessage);

      // Delete the message from SQS after successful processing
      if (message.ReceiptHandle) {
        await this.deleteMessage(message.ReceiptHandle);
        console.log("Successfully processed and deleted message from SQS");
      }
    } catch (error) {
      console.error("Error processing WhatsApp message:", error);
      // Message will remain in queue and be retried
      // After max retries, it will go to the dead letter queue
    }
  }

  /**
   * Handle the actual WhatsApp webhook data
   */
  private async handleWhatsAppWebhook(
    webhookMessage: WhatsAppWebhookMessage
  ): Promise<void> {
    const { data } = webhookMessage;

    // Process each entry in the webhook
    for (const entry of data.entry) {
      for (const change of entry.changes) {
        const { value, field } = change;

        if (field === "messages" && value.messages) {
          // Handle incoming messages
          for (const message of value.messages) {
            await this.handleIncomingMessage(
              message,
              value.contacts,
              value.metadata
            );
          }
        }

        if (field === "message_status" && value.statuses) {
          // Handle message status updates
          for (const status of value.statuses) {
            await this.handleMessageStatus(status, value.metadata);
          }
        }
      }
    }
  }

  private async sendWebSocketMessage(
    connection: UserConnectionItem,
    message: any,
    metadata: { display_phone_number: string; phone_number_id: string }
  ): Promise<void> {
    if (!connection.connectionId || !connection.domain || !connection.stage) {
      console.log("Incomplete connection info:", connection);
      return;
    }

    try {
      const apiGwClient = new ApiGatewayManagementApiClient({
        endpoint: `https://${connection.domain}/${connection.stage}`,
      });

      await apiGwClient.send(
        new PostToConnectionCommand({
          ConnectionId: connection.connectionId,
          Data: new TextEncoder().encode(
            JSON.stringify({
              type: "message_received",
              from: connection.connectionId,
              message,
              metadata,
              timestamp: new Date().toISOString(),
            })
          ),
        })
      );

      console.log(
        `Successfully sent live update to connection: ${connection.connectionId}`
      );
    } catch (e) {
      console.log(
        `Unable to send live update to connection ${connection.connectionId}:`
      );
      // Optionally clean up stale connections here
    }
  }
  /**
   * Handle incoming WhatsApp message
   */
  private async handleIncomingMessage(
    message: any,
    contacts: Contact[],
    metadata: { display_phone_number: string; phone_number_id: string }
  ): Promise<void> {
    console.log("Handling incoming WhatsApp message:", {
      from: message.from,
      messageId: message.id,
      type: message.type,
      text: message.text?.body,
      phoneNumberId: metadata.phone_number_id,
    });

    // QueryCommand

    const query: Query<typeof WeTable> = {
      partition: `PHONE#${metadata.phone_number_id}`,
      range: {
        beginsWith: "USER#",
      },
    };

    const queryCommand = WeTable.build(QueryCommand);

    const response = await queryCommand.query(query).send();
    const Items = response.Items as UserConnectionItem[] | undefined;
    if (Items && Items.length > 0) {
      // Process connections sequentially to avoid overwhelming API Gateway
      for (const connection of Items) {
        await this.sendWebSocketMessage(connection, message, metadata);
      }
    }

    // TODO: Implement your business logic here
    // Examples:
    // - Send auto-reply
    // - Trigger notifications
    // - Update conversation state

    // Example: Save to database (you'll need to implement this)
    await this.saveMessageToDatabase(message, contacts, metadata);

    // Example: Send auto-reply for specific keywords
    // if (message.text?.body?.toLowerCase().includes('hello')) {
    //   await this.sendAutoReply(message.from, metadata.phone_number_id);
    // }
  }

  private async saveMessageToDatabase(
    message: WMessage,
    contacts: Contact[],
    metadata: { display_phone_number: string; phone_number_id: string }
  ): Promise<void> {
    console.log("Saving message to database:", {
      from: message.from,
      messageId: message.id,
      type: message.type,
      text: message.text?.body,
      phoneNumberId: metadata.phone_number_id,
    });

    // get the account from metadata.display_phone_number
    const account = await db
      .selectExactlyOne("accounts", { phone_id: metadata.phone_number_id })
      .run(pool);

    console.log("insert lead");
    // check if a lead exists with the phone number id
    const lead = await db
      .upsert(
        "leads",
        {
          phone_number: contacts[0]?.wa_id,
          name: contacts[0]?.profile.name,
          account: account.id,
        },
        ["phone_number", "account"]
      )
      .run(pool);

    console.log("insert conversation");
    // upsert conversation
    const conversation = await db
      .upsert(
        "conversations",
        {
          account: account.id,
          from: lead.id,
        },
        ["account", "from"]
      )
      .run(pool);

    console.log("insert message2");
    const message2 = await db
      .insert("messages", {
        id: message.id,
        convo_id: conversation.id,
        message: message.text?.body,
        from: "user",
        user: lead.id,
        account: account.id,
        wamid: message.id,
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
      })
      .run(pool);

    console.log("update convo");
    await db
      .update(
        "conversations",
        { message: message2.id },
        { id: conversation.id }
      )
      .run(pool);
  }

  /**
   * Handle WhatsApp message status updates
   */
  private async handleMessageStatus(
    status: any,
    metadata: { display_phone_number: string; phone_number_id: string }
  ): Promise<void> {
    console.log("Handling WhatsApp message status:", {
      messageId: status.id,
      status: status.status,
      recipientId: status.recipient_id,
      timestamp: status.timestamp,
    });

    // TODO: Implement status handling
    // Examples:
    // - Update message delivery status in database
    // - Trigger notifications for failed messages
    // - Update conversation analytics
  }

  /**
   * Delete message from SQS queue
   */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.sqsClient.send(command);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get consumer status
   */
  public getStatus(): { isRunning: boolean; queueUrl: string } {
    return {
      isRunning: this.isRunning,
      queueUrl: this.queueUrl,
    };
  }
}

// Export singleton instance
export const whatsappConsumer = new WhatsAppSQSConsumer();
