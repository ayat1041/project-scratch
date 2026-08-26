module.exports = {
  '*.{ts,tsx}': [
    'pnpm exec eslint --fix', // Runs ESLint and fixes errors
    'pnpm run format:fix', // Runs Prettier to format code
  ],
  '*.{json,md}': ['pnpm run format:fix'], // Format JSON and Markdown files
};
