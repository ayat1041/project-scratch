//-------------------------------------
// logger
//-------------------------------------
import {
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  IS_STAGING,
} from "@/constants/variables";
import { createLogger, transports, format, Logger } from "winston";
import LokiTransport from "winston-loki";

const privateIP = process.env.PRIVATE_IP;
const monitoringHostIP = process.env.MONITORING_HOST_IP;

const activeTransports: (
  | InstanceType<typeof transports.Console>
  | LokiTransport
)[] = [
  new transports.Console({
    format: format.combine(format.timestamp(), format.simple()),
  }),
];

if (IS_PRODUCTION || IS_STAGING) {
  activeTransports.push(
    new LokiTransport({
      labels: {
        app: IS_STAGING ? "starter-api-staging" : "starter-api-production",
      },
      host: IS_PRODUCTION
        ? `http://${monitoringHostIP}:3100`
        : `http://${privateIP}:3100`,
    }),
  );
}

if (IS_DEVELOPMENT) {
  activeTransports.push(
    new LokiTransport({
      labels: {
        app: "starter-api-development",
      },
      host: `http://${privateIP}:3100`,
    }),
  );
}

export const logger: Logger = createLogger({ transports: activeTransports });
