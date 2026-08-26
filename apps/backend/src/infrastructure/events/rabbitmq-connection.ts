import amqp, {
  Channel,
  ChannelWrapper,
  AmqpConnectionManager,
} from "amqp-connection-manager";
import { env } from "@/utils/environment";
import { logger } from "@/infrastructure/monitoring/logger";
import { assertEventsTopology } from "./rabbitmq-topology";

let connection: AmqpConnectionManager | undefined;
let channelWrapper: ChannelWrapper | undefined;

export const getRabbitChannel = (): ChannelWrapper => {
  if (channelWrapper) {
    return channelWrapper;
  }

  connection = amqp.connect([env.RABBITMQ_URL()]);
  connection.on("disconnect", (err) => {
    logger.error("RabbitMQ connection lost", { error: err });
    console.error("RabbitMQ connection lost", err);
  });
  channelWrapper = connection.createChannel({
    json: true,
    setup: (channel: Channel) => assertEventsTopology(channel),
  });
  // Without this, an error here (e.g. a queue-argument mismatch) is an
  // unhandled EventEmitter "error" event, which crashes the whole process
  // instead of letting amqp-connection-manager's own reconnect/retry
  // logic handle it.
  channelWrapper.on("error", (err) => {
    logger.error("RabbitMQ channel error", { error: err });
  });
  return channelWrapper;
};
