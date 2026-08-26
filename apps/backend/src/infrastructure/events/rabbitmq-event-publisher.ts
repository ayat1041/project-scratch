import { EventPublisher } from "./event-publisher.types";
import { EVENTS_EXCHANGE } from "./rabbitmq-topology";
import { getRabbitChannel } from "./rabbitmq-connection";

export const rabbitMqEventPublisher: EventPublisher = {
  async publish(routingKey, payload, opts) {
    const channel = getRabbitChannel();
    await channel.publish(EVENTS_EXCHANGE, routingKey, payload, {
      persistent: true,
      messageId: opts?.messageId,
    });
  },
};
