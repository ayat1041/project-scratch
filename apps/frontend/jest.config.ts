import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  // No test files ship with the starter template yet — don't fail CI on an
  // empty suite. Remove once the first `__tests__/**/*.test.ts(x)` lands.
  passWithNoTests: true,
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Pin react/react-dom to this app's own copy. Workspace packages like
  // @repo/ui can otherwise resolve a different hoisted React version from
  // the pnpm store, causing "Cannot read properties of null" hook errors
  // when rendering their (e.g. Radix-based) components under test.
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime',
    '^react/jsx-dev-runtime$': '<rootDir>/node_modules/react/jsx-dev-runtime',
    '^react-dom/client$': '<rootDir>/node_modules/react-dom/client',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
