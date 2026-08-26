import { logger } from "@/infrastructure/monitoring/logger";

/**
 * Wraps a synchronous RabbitMQ channel call (`ack`/`nack`/`sendToQueue`) so a
 * stale channel — e.g. after a reconnect following a socket error mid-job —
 * logs instead of throwing. `ch.nack`/`ch.ack` throw `IllegalOperationError`
 * synchronously when called on a closed channel; uncaught inside an async
 * `ch.consume` callback, that becomes an unhandled rejection and crashes the
 * whole consumer process (no auto-restart — `tsx watch` only respawns on a
 * file save, not after a crash).
 *
 * Safe to skip the ack/nack on failure: RabbitMQ redelivers any message left
 * unacknowledged when its channel/connection drops, so the message isn't
 * lost — it just retries once the consumer reconnects instead of being
 * explicitly nacked now.
 */
export const safeChannelOp = (
  op: () => void,
  opName: string,
  workerName: string,
): void => {
  try {
    op();
  } catch (error) {
    logger.error(
      `${workerName}: ${opName} failed on a stale channel — message will be redelivered on reconnect`,
      { error },
    );
  }
};
