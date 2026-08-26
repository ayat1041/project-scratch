import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only run files under __integration__ folders to separate from node:test unit files
  testMatch: ["**/integration/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@repo/constants$": "<rootDir>/../../packages/constants/src/index.ts",
    "^@repo/utilities$": "<rootDir>/../../packages/utilities/src/index.ts",
    "^@repo/utilities/security/dom-purify$": "<rootDir>/__jestmocks__/dom-purify.ts",
    "^@repo/utilities/(.*)$": "<rootDir>/../../packages/utilities/src/$1",
    // Strip .js extensions from relative imports (TS ESM pattern used in packages)
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
        tsconfig: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      },
    ],
  },
  // Increase timeout for integration tests that may do async work
  testTimeout: 15000,
};

export default config;
