import "dotenv/config";
import { SQSClient, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

console.log('Environment variables:');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT_SET');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET');
console.log('WHATSAPP_SQS_QUEUE_URL:', process.env.WHATSAPP_SQS_QUEUE_URL);

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'me-central-1',
});

const queueUrl = process.env.WHATSAPP_SQS_QUEUE_URL || '';

async function testSQS() {
  try {
    console.log('\nTesting SQS connection...');
    
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 1,
    });

    const response = await sqsClient.send(command);
    console.log('✅ SQS connection successful!');
    console.log('Messages received:', response.Messages?.length || 0);
    
  } catch (error) {
    console.log('❌ SQS connection failed:');
    console.error(error);
  }
}

testSQS();
