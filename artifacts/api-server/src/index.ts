import app from "./app";
import { logger } from "./lib/logger";
import { db, analysesTable } from "@workspace/db";
import { or, eq } from "drizzle-orm";

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// On startup, fail any analyses that were left stuck in pending/processing
// state from a previous server process that was killed mid-run.
async function recoverStaleAnalyses() {
  try {
    const stale = await db
      .select({ id: analysesTable.id, status: analysesTable.status })
      .from(analysesTable)
      .where(
        or(
          eq(analysesTable.status, "pending"),
          eq(analysesTable.status, "processing"),
        ),
      );

    if (stale.length > 0) {
      logger.warn({ count: stale.length }, "Marking stale analyses as failed");
      await db
        .update(analysesTable)
        .set({
          status: "failed",
          error:
            "Analysis interrupted - the server restarted while this was running. Please try again.",
        })
        .where(
          or(
            eq(analysesTable.status, "pending"),
            eq(analysesTable.status, "processing"),
          ),
        );
    }
  } catch (err) {
    logger.error({ err }, "Failed to recover stale analyses on startup");
  }
}

recoverStaleAnalyses().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
