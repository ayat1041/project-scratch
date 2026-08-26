import { mkdirSync, writeFileSync } from "node:fs";
import * as swaggerConfig from "@/config/swagger";

type JsonObject = Record<string, unknown>;

export type OpenAPISpec = {
  openapi?: string;
  info?: JsonObject;
  servers?: unknown[];
  security?: unknown[];
  tags?: Array<{ name?: string; [key: string]: unknown }>;
  paths?: Record<string, JsonObject>;
  components?: Record<string, JsonObject>;
};

export const buildCombinedSwaggerSpec = (): OpenAPISpec => {
  const specs: OpenAPISpec[] = Object.entries(swaggerConfig)
    .filter(([key, value]) => {
      return (
        key.endsWith("Swagger") &&
        key !== "MAIN_SWAGGER" &&
        typeof value === "object" &&
        value !== null
      );
    })
    .map(([, value]) => value as OpenAPISpec);

  const first = specs[0] ?? {};

  const combined: OpenAPISpec = {
    openapi: first.openapi ?? "3.0.0",
    info: {
      title: "Starter API (Combined)",
      version: "1.0.0",
      description:
        "Combined OpenAPI spec generated from all backend module Swagger docs.",
    },
    servers: first.servers ?? [],
    security: first.security ?? [],
    tags: [],
    paths: {},
    components: {},
  };

  const tagNames = new Set<string>();

  for (const spec of specs) {
    if (spec.paths) {
      Object.assign(combined.paths as Record<string, JsonObject>, spec.paths);
    }

    if (spec.tags) {
      for (const tag of spec.tags) {
        const tagName = tag?.name;
        if (!tagName || tagNames.has(tagName)) {
          continue;
        }
        tagNames.add(tagName);
        (
          combined.tags as Array<{ name?: string; [key: string]: unknown }>
        ).push(tag);
      }
    }

    if (spec.components) {
      for (const [componentKey, componentValue] of Object.entries(
        spec.components,
      )) {
        const existing = ((combined.components as Record<string, JsonObject>)[
          componentKey
        ] ?? {}) as JsonObject;

        (combined.components as Record<string, JsonObject>)[componentKey] = {
          ...existing,
          ...(componentValue ?? {}),
        };
      }
    }
  }

  return combined;
};

export const writeCombinedSwaggerSpecToFile = (
  outputPath = "docs/postman/all-modules.openapi.json",
): OpenAPISpec => {
  const combined = buildCombinedSwaggerSpec();
  const outputDir = outputPath.split("/").slice(0, -1).join("/");

  if (outputDir) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(combined, null, 2));

  return combined;
};
