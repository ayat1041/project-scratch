import dotenv from "dotenv";
dotenv.config();

interface ServerConfig {
  port: number;
  env: string;
  cors: {
    origin: string[];
    credentials: boolean;
    methods?: string[];
    maxAge?: number;
  };
  bodyParser: {
    limit: string;
  };
}

// Development-only headers (for testing)
export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || "8000", 10),
  env: process.env.NODE_ENV || "development",
  cors: {
    origin: [
      "http://localhost:3000", // frontend
      "http://localhost:4000", // admin (`pnpm run dev`, see apps/admin/package.json)
      "http://localhost:3003", // admin (`docker compose -f docker-compose.dev.yml up`)
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
      "https://dev.example.com",
      "https://staging.example.com",
      "https://example.com",
    ].filter((origin): origin is string => Boolean(origin)),
    credentials: true,
  },

  bodyParser: {
    limit: "10mb",
  },
};
