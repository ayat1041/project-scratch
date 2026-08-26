import swaggerJsdoc from "swagger-jsdoc";

// Base configuration shared across all modules
const baseConfig = {
  openapi: "3.0.0",
  servers: [
    {
      url: process.env.API_URL || "http://localhost:8000",
      description: "API Server",
    },
    {
      url: "https://devapi.example.com",
      description: "Dev API Server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "session_token",
        description: "Session token stored in cookies",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Error type/code",
          },
          message: {
            type: "string",
            description: "Error message",
          },
          details: {
            type: "object",
            description: "Additional error details",
          },
        },
        required: ["message"],
      },
      Success: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
          },
          data: {
            type: "object",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          email: {
            type: "string",
            format: "email",
          },
          userName: {
            type: "string",
          },
          profileImage: {
            type: "string",
            format: "uri",
          },
          isVerified: {
            type: "boolean",
          },
          isDeleted: {
            type: "boolean",
          },
          roles: {
            type: "array",
            items: {
              type: "string",
            },
          },
          permissions: {
            type: "array",
            items: {
              type: "string",
            },
          },
          registeredAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
    {
      bearerAuth: [],
    },
  ],
};

// Function to create swagger spec for a specific module
const createModuleSwagger = (
  moduleName: string,
  description: string,
  apis: string[],
) => {
  return swaggerJsdoc({
    definition: {
      ...baseConfig,
      info: {
        title: `Starter ${moduleName} API`,
        version: "1.0.0",
        description: `${description} - Starter Platform`,
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
      },
      tags: [
        {
          name: moduleName,
          description: description,
        },
      ],
    },
    apis,
  });
};

// Individual module specifications
export const authSwagger = createModuleSwagger(
  "Authentication",
  "User authentication and authorization endpoints",
  [
    "./src/modules/auth/features/**/swagger-docs/**/*.ts",
    "./src/modules/auth/features/**/controllers/**/*.ts",
  ],
);

export const commonSwagger = createModuleSwagger(
  "Common Resources",
  "Shared reference data (countries, states, cities, languages) and common utilities",
  [
    "./src/modules/common/**/swagger-docs/**/*.ts",
    "./src/modules/common/**/controllers/*.ts",
  ],
);

export const userManagementSwagger = createModuleSwagger(
  "User Management",
  "User profiles, preferences, and user administration",
  [
    "./src/modules/user-management/**/swagger-docs/**/*.ts",
    "./src/modules/user-management/**/controllers/*.ts",
  ],
);

// Main swagger spec (overview/combined view)
export const MAIN_SWAGGER = swaggerJsdoc({
  definition: {
    ...baseConfig,
    info: {
      title: "Starter API Documentation",
      version: "1.0.0",
      description: `
# Starter Platform API Documentation

Welcome to the Starter API documentation. This platform provides comprehensive APIs for:

## Available Modules:
- **[Authentication](/api-docs/auth)** - User auth, sign-in, sign-up, password management
- **[Common Resources](/api-docs/common)** - Countries, languages, activity logs, and shared utilities
- **[User Management](/api-docs/users)** - Roles, permissions, and user administration

Each module has its own dedicated documentation page for better organization.
      `,
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
  },
  apis: [
    "./src/routes.ts", // Only main routes for overview
  ],
});

// Backward compatibility - keep the main export
export const swaggerSpec = MAIN_SWAGGER;
