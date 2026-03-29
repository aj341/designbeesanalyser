import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SubmitAnalysisBody } from "@workspace/api-zod";
import { captureScreenshot } from "../../services/screenshot.js";
import { analyseWebsite } from "../../services/analyser.js";
import type { Logger } from "pino";
import { assertSsrfSafe } from "../../lib/ssrf-guard.js";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  const parsed = SubmitAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { url } = parsed.data;

  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    await assertSsrfSafe(normalizedUrl);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Invalid or disallowed URL." });
    return;
  }

  // Return existing completed analysis for the same URL if one exists
  const [existing] = await db
    .select()
    .from(analysesTable)
    .where(and(eq(analysesTable.url, normalizedUrl), eq(analysesTable.status, "completed")))
    .orderBy(analysesTable.createdAt)
    .limit(1);

  if (existing) {
    res.status(200).json({
      id: existing.id,
      url: existing.url,
      status: existing.status,
      createdAt: existing.createdAt,
      completedAt: existing.completedAt,
      error: existing.error,
      existing: true,
    });
    return;
  }

  const id = randomUUID();

  await db.insert(analysesTable).values({
    id,
    url: normalizedUrl,
    status: "pending",
    findings: [],
    scores: [],
  });

  runAnalysis(id, normalizedUrl, req.log).catch((err) => {
    req.log.error({ err, id }, "Background analysis failed");
  });

  res.status(202).json({
    id,
    url: normalizedUrl,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  });
});

const ANALYSIS_TIMEOUT_MS = 8 * 60 * 1000; // 8 minutes

async function runAnalysis(id: string, url: string, log: Logger) {
  try {
    await db.update(analysesTable).set({ status: "processing" }).where(eq(analysesTable.id, id));
    log.info({ id, url }, "Starting analysis");

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Analysis timed out after 8 minutes. The site may be slow or unavailable.")), ANALYSIS_TIMEOUT_MS)
    );

    const workPromise = (async () => {
      const screenshot = await captureScreenshot(url, id);

      const analysisResult = await analyseWebsite(
        url,
        {
          pageTitle: screenshot.pageTitle,
          metaDescription: screenshot.metaDescription,
          headings: screenshot.headings,
          ctaButtons: screenshot.ctaButtons,
          hasHeroSection: screenshot.hasHeroSection,
          hasSocialProof: screenshot.hasSocialProof,
          hasTrustSignals: screenshot.hasTrustSignals,
          bodyText: screenshot.bodyText,
          links: screenshot.links,
        },
        screenshot.width,
        screenshot.height,
        screenshot.elementPositions,
        screenshot.viewportSnapshots,
        screenshot.detectedCarousels
      );

      return { screenshot, analysisResult };
    })();

    const { screenshot, analysisResult } = await Promise.race([workPromise, timeoutPromise]);

    await db.update(analysesTable)
      .set({
        status: "completed",
        screenshotUrl: screenshot.publicUrl,
        screenshotWidth: screenshot.width,
        screenshotHeight: screenshot.height,
        overallScore: analysisResult.overallScore,
        findings: analysisResult.findings,
        scores: analysisResult.scores,
        summary: analysisResult.summary,
        pageIntent: analysisResult.pageIntent,
        completedAt: new Date(),
      })
      .where(eq(analysesTable.id, id));

    log.info({ id }, "Analysis completed successfully");
  } catch (err) {
    log.error({ err, id }, "Analysis failed");
    await db.update(analysesTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error occurred",
        completedAt: new Date(),
      })
      .where(eq(analysesTable.id, id));
  }
}

router.get("/", async (req, res) => {
  const analyses = await db
    .select({
      id: analysesTable.id,
      url: analysesTable.url,
      status: analysesTable.status,
      screenshotUrl: analysesTable.screenshotUrl,
      overallScore: analysesTable.overallScore,
      createdAt: analysesTable.createdAt,
      completedAt: analysesTable.completedAt,
    })
    .from(analysesTable)
    .orderBy(analysesTable.createdAt);

  res.json(analyses.reverse().map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  })));
});

router.delete("/", async (req, res) => {
  await db.delete(analysesTable);
  res.status(200).json({ success: true });
});

router.get("/:id/status", async (req, res) => {
  const { id } = req.params;
  const [analysis] = await db
    .select({
      id: analysesTable.id,
      url: analysesTable.url,
      status: analysesTable.status,
      createdAt: analysesTable.createdAt,
      completedAt: analysesTable.completedAt,
      error: analysesTable.error,
    })
    .from(analysesTable)
    .where(eq(analysesTable.id, id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json({
    ...analysis,
    createdAt: analysis.createdAt.toISOString(),
    completedAt: analysis.completedAt?.toISOString() ?? null,
    error: analysis.error ?? null,
  });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json({
    ...analysis,
    createdAt: analysis.createdAt.toISOString(),
    completedAt: analysis.completedAt?.toISOString() ?? null,
    findings: analysis.findings ?? [],
    scores: analysis.scores ?? [],
    error: analysis.error ?? null,
    summary: analysis.summary ?? null,
    pageIntent: analysis.pageIntent ?? null,
    screenshotUrl: analysis.screenshotUrl ?? null,
    screenshotWidth: analysis.screenshotWidth ?? null,
    screenshotHeight: analysis.screenshotHeight ?? null,
    overallScore: analysis.overallScore ?? null,
  });
});

router.get("/:id/seo", async (req, res) => {
  const { id } = req.params;
  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  if (analysis.status !== "completed") {
    res.status(400).json({ error: "Analysis not yet completed" });
    return;
  }

  res.status(403).json({ error: "SEO analysis is a premium feature. Upgrade to unlock." });
});

export default router;
