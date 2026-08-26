// For backward compatibility - the main entry point is now server.ts
// This file can be used for programmatic access to the app
export { createApp } from "@/app/app";
export { serverConfig } from "@/config/server";

// If this file is run directly, start the server
if (require.main === module) {
  console.log("Please use 'npm run dev' or 'npm start' to run the server");
  console.log("The main entry point is now server.ts");
}
