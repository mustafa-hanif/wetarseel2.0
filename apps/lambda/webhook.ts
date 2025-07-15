// AWS Lambda types are only for TypeScript compilation, not runtime
interface APIGatewayProxyEventV2 {
  requestContext: {
    http: {
      method: string;
    };
  };
  queryStringParameters?: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
}

interface APIGatewayProxyResultV2 {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION || "me-central-1" });

interface WhatsAppWebhookEvent {
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
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
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
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const queueUrl = process.env.SQS_QUEUE_URL;

    if (!queueUrl) {
      console.error("SQS_QUEUE_URL environment variable not set");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }

    const main = await mainQueueHandler(event, queueUrl);
    try {
      let devQueue = await mainQueueHandler(
        event,
        "https://sqs.me-central-1.amazonaws.com/147997141811/wetarseel-dev-whatsapp-local"
      );
    } catch (e) {
      console.log("Failed to send to dev queue", e);
    }
    return main;
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

const mainQueueHandler = async (
  event: APIGatewayProxyEventV2,
  queueUrl: string
): Promise<APIGatewayProxyResultV2> => {
  try {
    const method = event.requestContext.http.method;
    if (!queueUrl) {
      console.error("SQS_QUEUE_URL environment variable not set");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }

    if (method === "GET") {
      // WhatsApp webhook verification
      const queryParams = event.queryStringParameters || {};
      const mode = queryParams["hub.mode"];
      const token = queryParams["hub.verify_token"];
      const challenge = queryParams["hub.challenge"];

      console.log("Webhook verification request:", { mode, token, challenge });

      // You should set this token in your WhatsApp webhook configuration
      const VERIFY_TOKEN =
        process.env.WHATSAPP_VERIFY_TOKEN || "your-verify-token";

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        return {
          statusCode: 200,
          body: challenge || "",
        };
      } else {
        console.log("Webhook verification failed");
        return {
          statusCode: 403,
          body: JSON.stringify({ error: "Forbidden" }),
        };
      }
    }

    if (method === "POST") {
      // WhatsApp webhook event
      const body = event.body;

      if (!body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "No body provided" }),
        };
      }

      let webhookData: WhatsAppWebhookEvent;
      try {
        webhookData = JSON.parse(body);
      } catch (error) {
        console.error("Failed to parse webhook body:", error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid JSON" }),
        };
      }

      console.log(
        "WhatsApp webhook data:",
        JSON.stringify(webhookData, null, 2)
      );

      // Send the webhook data to SQS
      const sqsMessage = {
        timestamp: new Date().toISOString(),
        source: "whatsapp-webhook",
        data: webhookData,
        headers: event.headers,
      };

      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(sqsMessage),
        MessageAttributes: {
          source: {
            DataType: "String",
            StringValue: "whatsapp-webhook",
          },
          timestamp: {
            DataType: "String",
            StringValue: new Date().toISOString(),
          },
        },
      });

      try {
        const result = await sqs.send(sendMessageCommand);
        console.log("Message sent to SQS:", result.MessageId, queueUrl);

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            messageId: result.MessageId,
          }),
        };
      } catch (error) {
        console.error("Failed to send message to SQS:", error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to process webhook" }),
        };
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
