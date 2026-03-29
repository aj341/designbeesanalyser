import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface Finding {
  id: string;
  type: "strength" | "weakness";
  category: string;
  title: string;
  evidence: string;
  suggestion: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CategoryScore {
  name: string;
  score: number;
  description: string;
}

export const analysesTable = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  screenshotUrl: text("screenshot_url"),
  screenshotWidth: integer("screenshot_width"),
  screenshotHeight: integer("screenshot_height"),
  overallScore: real("overall_score"),
  findings: text("findings", { mode: "json" })
    .$type<Finding[]>()
    .notNull()
    .default(sql`'[]'`),
  scores: text("scores", { mode: "json" })
    .$type<CategoryScore[]>()
    .notNull()
    .default(sql`'[]'`),
  summary: text("summary"),
  pageIntent: text("page_intent"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  createdAt: true,
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
