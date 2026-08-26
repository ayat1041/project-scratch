import axios from "axios";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import {
  MAIN_SWAGGER,
  authSwagger,
  commonSwagger,
  userManagementSwagger,
} from "@/config/swagger";
import {
  buildCombinedSwaggerSpec,
  writeCombinedSwaggerSpecToFile,
} from "@/config/swagger-combined";
import { IS_PRODUCTION } from "@/constants/variables";

const execFileAsync = promisify(execFile);

// Type for OpenAPI spec
interface OpenAPIOperation {
  "x-order"?: number;
  [key: string]: unknown;
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  [key: string]: unknown;
}

interface OpenAPISpec {
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, OpenAPIPathItem>;
  tags?: Array<{ name?: string; description?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

type PostmanRequestUrl = {
  path?: string[];
};

type PostmanRequest = {
  name?: string;
  method?: string;
  url?: PostmanRequestUrl;
  body?: {
    mode?: string;
    raw?: string;
  };
};

type PostmanResponse = {
  code?: number;
  name?: string;
  body?: string;
  _postman_previewlanguage?: string;
  originalRequest?: PostmanRequest;
};

type PostmanItem = {
  name?: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  response?: PostmanResponse[];
};

type OpenApiSchema = {
  type?: string;
  example?: unknown;
  enum?: unknown[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
};

const normalizePostmanPath = (pathParts: string[]): string => {
  const normalized = pathParts
    .map((part) => {
      const variableMatch = part.match(/^\{\{(.+)\}\}$/);
      if (variableMatch) {
        return `{${variableMatch[1]}}`;
      }

      // openapi-to-postman can emit ":param" path parts; normalize them to OpenAPI style.
      if (part.startsWith(":")) {
        return `{${part.slice(1)}}`;
      }

      return part;
    })
    .join("/");

  return `/${normalized}`;
};

const canonicalizeOpenApiPath = (path: string): string =>
  path.replace(/\{[^/]+\}/g, "{}");

const getOperationForPostmanItem = (
  spec: OpenAPISpec,
  item: PostmanItem,
): Record<string, unknown> | undefined => {
  const method = item.request?.method?.toLowerCase();
  const pathParts = item.request?.url?.path;

  if (!method || !pathParts || pathParts.length === 0) {
    return undefined;
  }

  const path = normalizePostmanPath(pathParts);
  const exactPathItem = spec.paths?.[path] as
    | Record<string, unknown>
    | undefined;
  const exactOperation = exactPathItem?.[method] as
    | Record<string, unknown>
    | undefined;

  if (exactOperation) {
    return exactOperation;
  }

  const canonicalPath = canonicalizeOpenApiPath(path);
  for (const [openApiPath, openApiPathItemUnknown] of Object.entries(
    spec.paths ?? {},
  )) {
    if (canonicalizeOpenApiPath(openApiPath) !== canonicalPath) {
      continue;
    }

    const openApiPathItem = openApiPathItemUnknown as Record<string, unknown>;
    const operation = openApiPathItem[method] as
      | Record<string, unknown>
      | undefined;
    if (operation) {
      return operation;
    }
  }

  return undefined;
};

const buildExampleFromSchema = (schema?: OpenApiSchema): unknown => {
  if (!schema || typeof schema !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(schema, "example")) {
    return schema.example;
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return buildExampleFromSchema(schema.oneOf[0]);
  }

  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return buildExampleFromSchema(schema.anyOf[0]);
  }

  if (schema.type === "object" || schema.properties) {
    const properties = schema.properties ?? {};
    const objectExample: Record<string, unknown> = {};

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      const propertyExample = buildExampleFromSchema(propertySchema);
      if (propertyExample !== undefined) {
        objectExample[propertyName] = propertyExample;
      }
    }

    return Object.keys(objectExample).length > 0 ? objectExample : undefined;
  }

  if (schema.type === "array" && schema.items) {
    const itemExample = buildExampleFromSchema(schema.items);
    return itemExample === undefined ? [] : [itemExample];
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  }

  return undefined;
};

const getFirstOpenApiExample = (
  mediaTypeObject: Record<string, unknown>,
): unknown => {
  if (Object.prototype.hasOwnProperty.call(mediaTypeObject, "example")) {
    return mediaTypeObject.example;
  }

  const examples = mediaTypeObject.examples as
    | Record<string, unknown>
    | undefined;
  if (!examples) {
    return undefined;
  }

  for (const example of Object.values(examples)) {
    if (
      example &&
      typeof example === "object" &&
      Object.prototype.hasOwnProperty.call(example, "value")
    ) {
      return (example as { value: unknown }).value;
    }
  }

  const schema = mediaTypeObject.schema as OpenApiSchema | undefined;
  return buildExampleFromSchema(schema);
};

const getRequestBodyExampleFromOperation = (
  operation: Record<string, unknown>,
): unknown => {
  const requestBody = operation.requestBody as
    | Record<string, unknown>
    | undefined;
  if (!requestBody) {
    return undefined;
  }

  const content = requestBody.content as
    | Record<string, Record<string, unknown>>
    | undefined;
  const mediaType = content?.["application/json"];
  if (!mediaType) {
    return undefined;
  }

  return getFirstOpenApiExample(mediaType);
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const selectExampleEntry = (
  examples: Record<string, unknown>,
  postmanResponseName?: string,
): Record<string, unknown> | undefined => {
  const entries = Object.entries(examples).filter(
    ([, val]) => val && typeof val === "object",
  );
  if (entries.length === 0) {
    return undefined;
  }

  if (!postmanResponseName) {
    return entries[0][1] as Record<string, unknown>;
  }

  const target = normalizeText(postmanResponseName);
  for (const [key, value] of entries) {
    const exampleObject = value as Record<string, unknown>;
    const summary =
      typeof exampleObject.summary === "string" ? exampleObject.summary : "";

    const keyNorm = normalizeText(key);
    const summaryNorm = normalizeText(summary);
    if (
      target === keyNorm ||
      target.includes(keyNorm) ||
      keyNorm.includes(target) ||
      (summaryNorm &&
        (target === summaryNorm ||
          target.includes(summaryNorm) ||
          summaryNorm.includes(target)))
    ) {
      return exampleObject;
    }
  }

  return entries[0][1] as Record<string, unknown>;
};

const getOpenApiResponseAndRequestExamples = (
  mediaTypeObject: Record<string, unknown>,
  postmanResponseName?: string,
): { responseExample?: unknown; requestExample?: unknown } => {
  if (Object.prototype.hasOwnProperty.call(mediaTypeObject, "examples")) {
    const examples = mediaTypeObject.examples as Record<string, unknown>;
    const selected = selectExampleEntry(examples, postmanResponseName);
    if (selected) {
      return {
        responseExample: selected.value,
        requestExample: selected["x-requestExample"],
      };
    }
  }

  return { responseExample: getFirstOpenApiExample(mediaTypeObject) };
};

const applyOpenApiExamplesToPostmanCollection = (
  collection: Record<string, unknown>,
  spec: OpenAPISpec,
): void => {
  const walkItems = (items: PostmanItem[]): void => {
    for (const item of items) {
      if (item.item && Array.isArray(item.item)) {
        walkItems(item.item);
      }

      if (!item.request || !item.response || !Array.isArray(item.response)) {
        continue;
      }

      const method = item.request.method?.toLowerCase();
      const pathParts = item.request.url?.path;

      if (!method || !pathParts || pathParts.length === 0) {
        continue;
      }

      const path = normalizePostmanPath(pathParts);
      const pathItem = spec.paths?.[path];
      if (!pathItem) {
        continue;
      }

      const operation = pathItem[method] as Record<string, unknown> | undefined;
      const responses = operation?.responses as
        | Record<string, Record<string, unknown>>
        | undefined;

      const requestBodyExample = getRequestBodyExampleFromOperation(
        operation ?? {},
      );
      if (
        requestBodyExample !== undefined &&
        item.request.body?.mode === "raw"
      ) {
        item.request.body.raw = JSON.stringify(requestBodyExample, null, 2);
      }

      if (!responses) {
        continue;
      }

      for (const postmanResponse of item.response) {
        const code = String(postmanResponse.code ?? "");
        const responseObject = responses[code];
        if (!responseObject) {
          continue;
        }

        const content = responseObject.content as
          | Record<string, Record<string, unknown>>
          | undefined;
        const mediaType = content?.["application/json"];
        if (!mediaType) {
          continue;
        }

        const { responseExample, requestExample } =
          getOpenApiResponseAndRequestExamples(mediaType, postmanResponse.name);

        const exampleValue = responseExample;
        if (exampleValue === undefined) {
          continue;
        }

        postmanResponse.body = JSON.stringify(exampleValue, null, 2);
        postmanResponse._postman_previewlanguage = "json";

        if (
          requestExample !== undefined &&
          postmanResponse.originalRequest?.body?.mode === "raw"
        ) {
          postmanResponse.originalRequest.body.raw = JSON.stringify(
            requestExample,
            null,
            2,
          );
        }
      }
    }
  };

  const rootItems = collection.item;
  if (!Array.isArray(rootItems)) {
    return;
  }

  walkItems(rootItems as PostmanItem[]);
};

const collectRequestItems = (
  items: PostmanItem[],
  out: PostmanItem[] = [],
): PostmanItem[] => {
  for (const item of items) {
    if (item.request) {
      out.push(item);
    }

    if (item.item && Array.isArray(item.item)) {
      collectRequestItems(item.item, out);
    }
  }

  return out;
};

const getRequestSignature = (item: PostmanItem): string | null => {
  const method = item.request?.method?.toUpperCase();
  const pathParts = item.request?.url?.path;

  if (!method || !pathParts || pathParts.length === 0) {
    return null;
  }

  const normalizedPath = normalizePostmanPath(pathParts);
  return `${method} ${normalizedPath}`;
};

const scoreRequestItem = (item: PostmanItem): number => {
  const responses = item.response ?? [];
  let score = responses.length * 10;

  for (const response of responses) {
    if (typeof response.body === "string") {
      score += response.body.length;
    }

    if (response.originalRequest?.body?.raw) {
      score += response.originalRequest.body.raw.length;
    }
  }

  if (item.request?.body?.raw) {
    score += item.request.body.raw.length;
  }

  return score;
};

const dedupeRequestItems = (items: PostmanItem[]): PostmanItem[] => {
  const bySignature = new Map<string, PostmanItem>();

  for (const item of items) {
    const signature = getRequestSignature(item);
    if (!signature) {
      continue;
    }

    const existing = bySignature.get(signature);
    if (!existing) {
      bySignature.set(signature, item);
      continue;
    }

    // Keep the richer item to preserve examples/responses when duplicates exist.
    if (scoreRequestItem(item) > scoreRequestItem(existing)) {
      bySignature.set(signature, item);
    }
  }

  return Array.from(bySignature.values());
};

const getOperationTags = (spec: OpenAPISpec, item: PostmanItem): string[] => {
  const operation = getOperationForPostmanItem(spec, item);
  const tags = operation?.tags;

  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag): tag is string => typeof tag === "string");
};

const splitTagHierarchy = (primaryTag: string): string[] => {
  const parts = primaryTag
    .split(" - ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return parts.length > 0 ? parts : ["Uncategorized"];
};

const reorganizePostmanCollectionByTags = (
  collection: Record<string, unknown>,
  spec: OpenAPISpec,
): void => {
  const rootItems = collection.item;
  if (!Array.isArray(rootItems)) {
    return;
  }

  const requestItems = dedupeRequestItems(
    collectRequestItems(rootItems as PostmanItem[]),
  );

  type FolderNode = {
    name: string;
    requests: PostmanItem[];
    children: Map<string, FolderNode>;
  };

  const rootNode: FolderNode = {
    name: "root",
    requests: [],
    children: new Map<string, FolderNode>(),
  };

  for (const requestItem of requestItems) {
    const operation = getOperationForPostmanItem(spec, requestItem);
    if (!operation) {
      // Skip stale requests that no longer exist in the current OpenAPI spec.
      continue;
    }

    const tags = getOperationTags(spec, requestItem);
    const primaryTag = tags[0] ?? "Uncategorized";
    const hierarchy = splitTagHierarchy(primaryTag);

    let currentNode = rootNode;
    for (const levelName of hierarchy) {
      if (!currentNode.children.has(levelName)) {
        currentNode.children.set(levelName, {
          name: levelName,
          requests: [],
          children: new Map<string, FolderNode>(),
        });
      }

      const child = currentNode.children.get(levelName);
      if (!child) {
        continue;
      }

      currentNode = child;
    }

    currentNode.requests.push(requestItem);
  }

  const buildFolderItems = (node: FolderNode): PostmanItem[] => {
    const result: PostmanItem[] = [];

    for (const childNode of node.children.values()) {
      const nestedItems: PostmanItem[] = [
        ...childNode.requests,
        ...buildFolderItems(childNode),
      ];

      result.push({
        name: childNode.name,
        item: nestedItems,
      });
    }

    return result;
  };

  collection.item = buildFolderItems(rootNode);
};

const ensureUniquePostmanRequestNames = (
  collection: Record<string, unknown>,
): void => {
  const rootItems = collection.item;
  if (!Array.isArray(rootItems)) {
    return;
  }

  type RequestEntry = {
    item: PostmanItem;
    baseName: string;
    signature: string | null;
    trail: string[];
  };

  const requestEntries: RequestEntry[] = [];

  const walk = (items: PostmanItem[], trail: string[] = []): void => {
    for (const item of items) {
      const currentName = item.name ?? "Unnamed Request";
      const nextTrail = [...trail, currentName];

      if (item.request) {
        requestEntries.push({
          item,
          baseName: currentName,
          signature: getRequestSignature(item),
          trail: nextTrail,
        });
      }

      if (item.item && Array.isArray(item.item)) {
        walk(item.item, nextTrail);
      }
    }
  };

  walk(rootItems as PostmanItem[]);

  const byName = new Map<string, RequestEntry[]>();
  for (const entry of requestEntries) {
    if (!byName.has(entry.baseName)) {
      byName.set(entry.baseName, []);
    }
    byName.get(entry.baseName)?.push(entry);
  }

  for (const [baseName, entries] of byName) {
    if (entries.length <= 1) {
      continue;
    }

    // If same display name maps to multiple endpoints, disambiguate with context.
    const uniqueSigs = new Set(entries.map((entry) => entry.signature));
    if (uniqueSigs.size <= 1) {
      continue;
    }

    const usedNames = new Set<string>();

    for (const entry of entries) {
      const moduleName = entry.trail[0] ?? "Module";
      const featureName = entry.trail[1] ?? moduleName;

      let candidate = `${featureName} - ${baseName}`;

      if (usedNames.has(candidate)) {
        const signatureLabel = entry.signature ?? "UNKNOWN /unknown";
        candidate = `${featureName} - ${baseName} [${signatureLabel}]`;
      }

      if (usedNames.has(candidate)) {
        const signatureLabel = entry.signature ?? "UNKNOWN /unknown";
        candidate = `${moduleName} - ${baseName} [${signatureLabel}]`;
      }

      usedNames.add(candidate);
      entry.item.name = candidate;

      if (entry.item.request) {
        entry.item.request.name = candidate;
      }
    }
  }
};

/**
 * Sort paths in an OpenAPI spec by x-order property
 */
const sortSwaggerPaths = (spec: OpenAPISpec): OpenAPISpec => {
  if (!spec.paths) return spec;

  const methods = ["get", "post", "put", "patch", "delete"] as const;

  // Create array of [path, method, operation, order] tuples
  const operations: Array<{
    path: string;
    method: string;
    order: number;
  }> = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (operation) {
        operations.push({
          path,
          method,
          order: operation["x-order"] ?? 999,
        });
      }
    }
  }

  // Sort by x-order
  operations.sort((a, b) => a.order - b.order);

  // Rebuild paths object in sorted order
  const sortedPaths: Record<string, OpenAPIPathItem> = {};
  for (const { path, method } of operations) {
    if (!sortedPaths[path]) {
      sortedPaths[path] = {};
    }
    sortedPaths[path][method] = spec.paths[path][method];
  }

  return { ...spec, paths: sortedPaths };
};

// Sort auth swagger paths
const sortedAuthSwagger = sortSwaggerPaths(authSwagger as OpenAPISpec);

// Swagger UI configuration options
const swaggerUIOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
  },
  customCss: `.swagger-ui .topbar { display: none }
    .swagger-ui .model { margin: 0 20px; }
    .swagger-ui .btn { border-radius: 4px; }`,
};

/**
 * Register all Swagger documentation routes
 * @param app - Express application instance
 */
export const registerSwaggerRoutes = (app: Express): void => {
  if (IS_PRODUCTION) {
    return;
  }

  // Serve swagger JSON specs for each module
  app.get("/api-docs/auth/swagger.json", (req, res) =>
    res.json(sortedAuthSwagger),
  );
  app.get("/api-docs/common/swagger.json", (req, res) =>
    res.json(commonSwagger),
  );
  app.get("/api-docs/users/swagger.json", (req, res) =>
    res.json(userManagementSwagger),
  );
  app.get("/api-docs/swagger.json", (req, res) => res.json(MAIN_SWAGGER));
  app.get("/api-docs/all-modules/swagger.json", (req, res) => {
    res.json(buildCombinedSwaggerSpec());
  });

  // Manual endpoint for dev review: regenerates combined OpenAPI file on demand.
  app.post("/api-docs/all-modules/sync", (req, res) => {
    if (IS_PRODUCTION) {
      return res.status(403).json({
        success: false,
        message: "Manual swagger sync endpoint is disabled in production",
      });
    }

    const outputPath =
      typeof req.query.outputPath === "string" && req.query.outputPath
        ? req.query.outputPath
        : "docs/postman/all-modules.openapi.json";

    const combinedSpec = writeCombinedSwaggerSpecToFile(outputPath);

    return res.status(200).json({
      success: true,
      message: "Combined OpenAPI spec generated",
      outputPath,
      pathsCount: Object.keys(combinedSpec.paths || {}).length,
      tagsCount: (combinedSpec.tags || []).length,
    });
  });

  // Manual endpoint for dev review: regenerates OpenAPI, converts to Postman collection, and syncs to Postman.
  app.post("/api-docs/all-modules/sync-postman", async (req, res) => {
    if (IS_PRODUCTION) {
      return res.status(403).json({
        success: false,
        message: "Manual Postman sync endpoint is disabled in production",
      });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const outputPath =
      typeof body.outputPath === "string" && body.outputPath
        ? body.outputPath
        : "docs/postman/all-modules.openapi.json";
    const collectionPath =
      typeof body.collectionPath === "string" && body.collectionPath
        ? body.collectionPath
        : "docs/postman/all-modules.postman_collection.json";
    const existingCollectionPath =
      typeof body.existingCollectionPath === "string" &&
      body.existingCollectionPath
        ? body.existingCollectionPath
        : "docs/postman/all-modules.existing.postman_collection.json";

    const postmanApiKeyHeader = req.header("x-postman-api-key");
    const postmanCollectionUidHeader = req.header("x-postman-collection-uid");

    const postmanApiKey =
      (typeof body.postmanApiKey === "string" && body.postmanApiKey) ||
      postmanApiKeyHeader ||
      process.env.POSTMAN_API_KEY;

    const postmanCollectionUid =
      (typeof body.postmanCollectionUid === "string" &&
        body.postmanCollectionUid) ||
      postmanCollectionUidHeader ||
      process.env.POSTMAN_COLLECTION_UID;

    if (!postmanApiKey || !postmanCollectionUid) {
      return res.status(400).json({
        success: false,
        message:
          "Missing Postman credentials. Provide postmanApiKey and postmanCollectionUid in body or x-postman-api-key and x-postman-collection-uid headers.",
      });
    }

    try {
      const combinedSpec = writeCombinedSwaggerSpecToFile(outputPath);

      const existingCollectionResponse = await axios.get(
        `https://api.getpostman.com/collections/${postmanCollectionUid}`,
        {
          headers: {
            "X-Api-Key": postmanApiKey,
          },
        },
      );

      const existingCollection = existingCollectionResponse.data?.collection;
      if (!existingCollection) {
        return res.status(502).json({
          success: false,
          message: "Unable to fetch existing Postman collection",
        });
      }

      await writeFile(
        existingCollectionPath,
        JSON.stringify(existingCollection, null, 2),
      );

      await execFileAsync(
        "pnpm",
        [
          "dlx",
          "openapi-to-postmanv2",
          "-s",
          outputPath,
          "--sync",
          existingCollectionPath,
          "-o",
          collectionPath,
          "-p",
        ],
        { cwd: process.cwd() },
      );

      const collectionRaw = await readFile(collectionPath, "utf-8");
      const collectionJson = JSON.parse(collectionRaw) as Record<
        string,
        unknown
      >;

      applyOpenApiExamplesToPostmanCollection(collectionJson, combinedSpec);
      reorganizePostmanCollectionByTags(collectionJson, combinedSpec);
      ensureUniquePostmanRequestNames(collectionJson);

      await writeFile(collectionPath, JSON.stringify(collectionJson, null, 2));

      await axios.put(
        `https://api.getpostman.com/collections/${postmanCollectionUid}`,
        { collection: collectionJson },
        {
          headers: {
            "X-Api-Key": postmanApiKey,
            "Content-Type": "application/json",
          },
        },
      );

      return res.status(200).json({
        success: true,
        message: "Swagger docs synced to Postman collection successfully",
        outputPath,
        collectionPath,
        existingCollectionPath,
        pathsCount: Object.keys(combinedSpec.paths || {}).length,
        tagsCount: (combinedSpec.tags || []).length,
        collectionUid: postmanCollectionUid,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      // Postman's API returns a descriptive JSON body on failure (e.g. "API
      // Key is invalid or has now been revoked") — surface it instead of the
      // generic "Request failed with status code 401" from axios, which
      // gives no signal on whether the key is invalid, expired, or just
      // lacks access to this specific collection.
      const postmanErrorDetail = axios.isAxiosError(error)
        ? (error.response?.data ?? null)
        : null;

      return res.status(500).json({
        success: false,
        message: "Failed to sync Swagger docs to Postman",
        error: errorMessage,
        ...(postmanErrorDetail !== null && {
          postmanError: postmanErrorDetail,
        }),
      });
    }
  });

  // IMPORTANT: Register specific module routes BEFORE the general /api-docs route
  // Using serveFiles for module-specific routes

  // Authentication Module Documentation
  app.use(
    "/api-docs/auth",
    swaggerUi.serveFiles(sortedAuthSwagger, swaggerUIOptions),
    swaggerUi.setup(sortedAuthSwagger, {
      ...swaggerUIOptions,
      customSiteTitle: "Starter API - Authentication",
    }),
  );

  // Common Resources Module Documentation
  app.use(
    "/api-docs/common",
    swaggerUi.serveFiles(commonSwagger, swaggerUIOptions),
    swaggerUi.setup(commonSwagger, {
      ...swaggerUIOptions,
      customSiteTitle: "Starter API - Common Resources",
    }),
  );

  // User Management Module Documentation
  app.use(
    "/api-docs/users",
    swaggerUi.serveFiles(userManagementSwagger, swaggerUIOptions),
    swaggerUi.setup(userManagementSwagger, {
      ...swaggerUIOptions,
      customSiteTitle: "Starter API - User Management",
    }),
  );

  // Main API Documentation (Overview) - MUST be LAST since /api-docs matches all sub-routes
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(MAIN_SWAGGER, {
      ...swaggerUIOptions,
      customSiteTitle: "Starter API - Overview",
    }),
  );

  // Debug route to check swagger content
  app.get("/debug/auth-swagger", (req, res) => {
    res.json({
      info: sortedAuthSwagger.info,
      pathsCount: Object.keys(sortedAuthSwagger.paths || {}).length,
      paths: Object.keys(sortedAuthSwagger.paths || {}),
      tags: sortedAuthSwagger.tags || [],
    });
  });

  // API Documentation index page
  app.get("/docs", (req, res) => {
    res.send(getDocsIndexPage());
  });
};

/**
 * Returns the HTML for the documentation index page
 */
const getDocsIndexPage = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Starter API Documentation</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 { 
            color: #333; 
            text-align: center; 
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .description {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.1em;
        }
        .modules {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .module {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
        }
        .module:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
        .module h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 1.3em;
        }
        .module p {
            color: #666;
            margin-bottom: 0;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #444;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0e0e0;
        }
        .admin-section {
            border: 2px solid #e8e0f5;
            border-radius: 10px;
            padding: 24px;
            background: #faf8ff;
            margin-bottom: 30px;
        }
        .admin-section .section-title {
            color: #764ba2;
            border-bottom-color: #d4c5ea;
        }
        .admin-section .module {
            background: white;
        }
        .admin-section .module:hover {
            border-color: #764ba2;
            box-shadow: 0 5px 15px rgba(118, 75, 162, 0.15);
        }
        .admin-section .module h3 {
            color: #764ba2;
        }
        .overview {
            text-align: center;
            margin-top: 30px;
        }
        .overview a {
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.3s ease;
        }
        .overview a:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Starter API Documentation</h1>
        <div class="description">
            Choose a module to view its API documentation
        </div>
        
        <div class="section">
            <div class="modules">
                <a href="/api-docs/auth" class="module">
                    <h3>🔐 Authentication</h3>
                    <p>User authentication, sign-in, sign-up, password management, and session handling</p>
                </a>

                <a href="/api-docs/common" class="module">
                    <h3>⚙️ Common Resources</h3>
                    <p>Countries, states, cities, languages, activity logs, and utility endpoints</p>
                </a>

                <a href="/api-docs/users" class="module">
                    <h3>👥 User Management</h3>
                    <p>Roles, permissions, and user administration</p>
                </a>
            </div>
        </div>

        <div class="overview">
            <a href="/api-docs">📋 View Complete API Overview</a>
        </div>
    </div>
</body>
</html>`;
