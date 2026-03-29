import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "drizzle-kit";

const workspaceRoot = path.resolve(__dirname, "..", "..");

function resolveDatabasePath() {
  const configured = process.env.DATABASE_URL?.trim();

  if (!configured) {
    return path.join(workspaceRoot, "data", "homepage-analyzer.db");
  }

  const normalized = configured.startsWith("file:")
    ? configured.slice("file:".length)
    : configured;

  return path.isAbsolute(normalized)
    ? normalized
    : path.join(workspaceRoot, normalized);
}

const databasePath = resolveDatabasePath();
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: pathToFileURL(databasePath).href,
  },
});
