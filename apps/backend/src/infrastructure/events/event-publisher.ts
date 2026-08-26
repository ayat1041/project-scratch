import { EventPublisher } from "./event-publisher.types";
import { rabbitMqEventPublisher } from "./rabbitmq-event-publisher";

// Single shared publisher for every producer in the app — invitation-send,
// action-center email notifications, and anything added later. BullMQ has
// been fully decommissioned (Phase 6): no transport branching left here.
export const eventPublisher: EventPublisher = rabbitMqEventPublisher;
