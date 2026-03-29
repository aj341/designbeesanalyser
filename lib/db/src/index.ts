import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..", "..");

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

export const sqlite = createClient({
  url: pathToFileURL(databasePath).href,
});

export const db = drizzle(sqlite, { schema });

export * from "./schema";
