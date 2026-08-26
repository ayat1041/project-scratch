import { env } from "@/utils/environment";

const MANAGEMENT_PORT = 15672;

interface QueueDetailResponse {
  messages?: number;
}

const getManagementCredentials = (): {
  baseUrl: string;
  authHeader: string;
} => {
  const rabbitUrl = new URL(env.RABBITMQ_URL());
  const baseUrl = `http://${rabbitUrl.hostname}:${MANAGEMENT_PORT}`;
  const username = decodeURIComponent(rabbitUrl.username);
  const password = decodeURIComponent(rabbitUrl.password);
  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  return { baseUrl, authHeader };
};

// Message count for a queue via the RabbitMQ management HTTP API (enabled by
// the `rabbitmq:*-management` image). "%2f" is the URL-encoded default vhost "/".
export const getQueueDepth = async (queueName: string): Promise<number> => {
  const { baseUrl, authHeader } = getManagementCredentials();
  const response = await fetch(
    `${baseUrl}/api/queues/%2f/${encodeURIComponent(queueName)}`,
    { headers: { Authorization: authHeader } },
  );

  if (!response.ok) {
    throw new Error(
      `RabbitMQ management API returned ${response.status} for queue "${queueName}"`,
    );
  }

  const data = (await response.json()) as QueueDetailResponse;
  return data.messages ?? 0;
};
