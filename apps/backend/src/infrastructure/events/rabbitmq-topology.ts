import { Channel } from "amqp-connection-manager";
import { QUEUES } from "@/constants/queues";
import { ROUTING_KEYS } from "@/constants/routing-keys";

export const EVENTS_EXCHANGE = "starter.events";

const MAX_RETRY_COUNT = 10;
const RETRY_TTL_MS = 5000;

interface QueueBinding {
  queue: string;
  routingKeys: string[];
}

export const QUEUE_BINDINGS: QueueBinding[] = [
  {
    queue: QUEUES.EMAIL_QUEUE,
    routingKeys: [ROUTING_KEYS.NOTIFICATION_EMAIL_SEND],
  },
];

export const assertEventsTopology = async (channel: Channel): Promise<void> => {
  await channel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });

  for (const binding of QUEUE_BINDINGS) {
    const dlqName = `${binding.queue}.dlq`;
    const retryQueueName = `${binding.queue}.retry`;

    // Terminal DLQ — NOT reached automatically. A queue's dead-letter
    // config is static, so it can't branch "still has retries left" vs.
    // "exhausted" per message. Each consumer decides that by counting
    // x-death entries, then explicitly publishes to this queue and acks
    // the original — see email-send-consumer.ts.
    await channel.assertQueue(dlqName, { durable: true });

    // Main queue — nacked messages dead-letter straight into the retry
    // queue via the default exchange (routes by exact queue name, no
    // extra fanout exchange needed).
    await channel.assertQueue(binding.queue, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: retryQueueName,
    });

    for (const routingKey of binding.routingKeys) {
      await channel.bindQueue(binding.queue, EVENTS_EXCHANGE, routingKey);
    }

    // Retry "holding" queue — short TTL, dead-letters back to the main
    // queue once the TTL expires (the "5s ladder" from §3.2). RabbitMQ
    // appends one `x-death` entry per dead-letter hop automatically —
    // the consumer counts `x-death` length instead of a hand-rolled
    // `x-retry-count` header (which RabbitMQ never increments on its
    // own and nothing was writing to it — see the consumer below).
    await channel.assertQueue(retryQueueName, {
      durable: true,
      messageTtl: RETRY_TTL_MS,
      deadLetterExchange: "", // default exchange
      deadLetterRoutingKey: binding.queue,
    });
  }
};

export { MAX_RETRY_COUNT };
