// Module alias registration must be first
import "module-alias/register";
import "dotenv/config";

import { ConsumeMessage } from "amqplib";
import { Channel } from "amqp-connection-manager";
import { logger } from "@/infrastructure/monitoring/logger";
import { getRabbitChannel } from "@/infrastructure/events/rabbitmq-connection";
import { MAX_RETRY_COUNT } from "@/infrastructure/events/rabbitmq-topology";
import {
  sendEmailUsingMailhog,
  sendEmailWithNodemailer,
} from "@/infrastructure/email/emails";
import { IS_DEVELOPMENT, IS_PRODUCTION } from "@/constants/variables";
import { QUEUES } from "@/constants/queues";
import { WORKERS } from "@/constants/workers";
import { EmailJob } from "@/infrastructure/events/email-job.types";

const QUEUE_NAME = QUEUES.EMAIL_QUEUE;
const WORKER_NAME = WORKERS.EMAIL_SEND_CONSUMER;

const handleMessage = async (msg: ConsumeMessage): Promise<void> => {
  const job = JSON.parse(msg.content.toString()) as EmailJob;
  const { to, from, subject, html, text } = job;

  const emailPayload = {
    from: from || process.env.DEFAULT_FROM_EMAIL,
    to,
    subject,
    html: html || text,
  };

  if (IS_PRODUCTION) {
    await sendEmailWithNodemailer(emailPayload);
  } else if (IS_DEVELOPMENT) {
    await sendEmailUsingMailhog(emailPayload);
  } else {
    await sendEmailWithNodemailer(emailPayload);
  }

  logger.info(`${WORKER_NAME}: email sent to ${to}`);
};

const start = async (): Promise<void> => {
  const channel = getRabbitChannel();
  // Wait for the topology setup (exchange/queue/DLX declarations,
  // registered in rabbitmq-connection.ts) to actually finish before
  // registering a second setup that consumes from a queue that setup
  // creates — without this, ch.consume() can race ahead of assertQueue()
  // and fail with 404 "no queue" on first connect.
  await channel.waitForConnect();
  await channel.addSetup(async (ch: Channel) => {
    await ch.prefetch(10);
    await ch.consume(QUEUE_NAME, async (msg) => {
      if (!msg) {
        return;
      }
      const xDeath = msg.properties.headers?.["x-death"] as
        | unknown[]
        | undefined;
      const retryCount = xDeath?.length ?? 0;
      try {
        await handleMessage(msg);
        ch.ack(msg);
      } catch (error) {
        logger.error(`${WORKER_NAME}: job failed`, { error });
        if (retryCount >= MAX_RETRY_COUNT) {
          ch.sendToQueue(`${QUEUE_NAME}.dlq`, msg.content, {
            persistent: true,
            headers: msg.properties.headers,
          });
          ch.ack(msg);
        } else {
          ch.nack(msg, false, false);
        }
      }
    });
  });
  logger.info(`${WORKER_NAME}: consuming ${QUEUE_NAME}`);
};

start().catch((error) => {
  logger.error(`${WORKER_NAME}: failed to start`, { error });
  process.exit(1);
});
