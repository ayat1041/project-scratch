import { ROUTING_KEYS } from "@/constants/routing-keys";

export type RoutingKey = (typeof ROUTING_KEYS)[keyof typeof ROUTING_KEYS];

export interface EventPublisher {
  publish(
    routingKey: RoutingKey,
    payload: unknown,
    opts?: { messageId?: string },
  ): Promise<void>;
}
