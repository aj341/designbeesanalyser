import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "../lib/logger.js";
import type { ElementPosition, DetectedCarousel } from "./screenshot.js";

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

export interface ScoreCategory {
  name: string;
  score: number;
  description: string;
}

export interface AnalysisResult {
  pageIntent: string;
  findings: Finding[];
  scores: ScoreCategory[];
  overallScore: number;
  summary: string;
}

export interface SeoFinding {
  category: string;
  title: string;
  status: "good" | "warning" | "error";
  details: string;
  recommendation: string;
}

export interface SeoResult {
  overallScore: number;
  findings: SeoFinding[];
  summary: string;
}

interface PageData {
  pageTitle: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  ctaButtons: { text: string; type: string }[];
  hasHeroSection: boolean;
  hasSocialProof: boolean;
  hasTrustSignals: boolean;
  bodyText: string;
  links: { text: string; href: string }[];
}

export async function analyseWebsite(url: string, pageData: PageData, screenshotWidth: number, screenshotHeight: number, elementPositions: ElementPosition[], viewportSnapshots: string[], detectedCarousels: DetectedCarousel[] = []): Promise<AnalysisResult> {
  const positionsBlock = elementPositions.length > 0
    ? `\nACTUAL ELEMENT POSITIONS (measured from the page, as % of full screenshot dimensions):
${elementPositions.map(e => `- [${e.selector}] "${e.text}" → x:${e.xPct}% y:${e.yPct}% w:${e.widthPct}% h:${e.heightPct}%`).join('\n')}

CRITICAL: When creating findings, you MUST use the coordinates from the list above for any element that appears in it. Do not guess or use generic heuristics — the coordinates above are exact measurements. If a finding refers to the H1 headline, use the x/y/width/height from the h1 entry above.`
    : "";

  const snapshotCount = viewportSnapshots.length;
  const visualNote = snapshotCount > 0
    ? `\nIMPORTANT: You are provided with ${snapshotCount} screenshots covering the full page. The first is the above-the-fold view. The remaining screenshots are sequential scrolled views going further down the page at 800px intervals. Together they show the complete page content. Use these images as your primary source of truth for what is VISUALLY present — logos, images, icons, testimonials, case studies, and any JS-rendered content. Do NOT claim an element is missing or absent if it is visible in any screenshot. When assessing below-the-fold sections (e.g. testimonials, case studies, features), look at the later scrolled screenshots before drawing conclusions.`
    : "";

  const carouselBlock = detectedCarousels.length > 0
    ? `\nDETECTED CAROUSEL / SLIDER COMPONENTS on this page:
${detectedCarousels.map(c => `- ${c.container}: ${c.slideCount} slides detected${c.hasNavArrows ? ', has prev/next navigation arrows' : ''}${c.context ? ` (near section: "${c.context}")` : ''}`).join('\n')}

CAROUSEL RULE: Screenshots can only show ONE slide at a time. Do NOT flag a carousel as "only one X visible" or suggest adding more items — the carousel already contains multiple items. Instead, evaluate the carousel DESIGN: e.g. are the navigation controls obvious? Is the first slide the strongest? Does auto-advance risk users missing content? Is the slide count/indicator visible?`
    : "";

  const prompt = `You are a world-class conversion rate optimisation (CRO) expert and copywriter. Analyse the following website page data.${visualNote}${carouselBlock}

URL: ${url}
Page Title: ${pageData.pageTitle}
Meta Description: ${pageData.metaDescription}

Headings on the page:
${pageData.headings.map(h => `${h.level.toUpperCase()}: ${h.text}`).join('\n')}

CTA Buttons/Links found:
${pageData.ctaButtons.slice(0, 10).map(b => `- "${b.text}" (${b.type})`).join('\n')}

Has hero section: ${pageData.hasHeroSection}
Has social proof: ${pageData.hasSocialProof}
Has trust signals: ${pageData.hasTrustSignals}

Body text excerpt:
${pageData.bodyText.substring(0, 3000)}

Screenshot dimensions: ${screenshotWidth}px wide × ${screenshotHeight}px tall
${positionsBlock}

STEP 1 — Determine page intent. Classify this page as exactly one of:
- "Lead Generation" (capture contact details, book a call, download a resource)
- "E-commerce" (sell products directly, add to cart, buy now)
- "SaaS / Software" (sign up, start a trial, get access to software)
- "Portfolio / Agency" (showcase work, attract clients, hire me)
- "Local Business" (get directions, call us, visit the store)
- "Blog / Content" (read articles, subscribe, consume information)
- "Landing Page" (single-purpose, one specific action)
- "Corporate / Brand" (awareness, legitimacy, investor relations)

STEP 2 — Score the page on the 5 most relevant categories for its intent type. Use these category sets:

Lead Generation: Headline Clarity, Value Proposition, Form Friction, Trust Signals, CTA Effectiveness
E-commerce: Product Clarity, Social Proof, Trust & Security, Urgency/Scarcity, CTA Effectiveness
SaaS / Software: Value Proposition, Feature Communication, Social Proof, Pricing Clarity, CTA Effectiveness
Portfolio / Agency: Work Quality Display, Credibility Signals, Service Clarity, Contact Ease, Visual Impact
Local Business: Contact Clarity, Trust Signals, Service Clarity, Local Credibility, CTA Effectiveness
Blog / Content: Headline Appeal, Readability, Content Depth, Email Capture, Internal Linking
Landing Page: Headline Clarity, Value Proposition, CTA Effectiveness, Trust Signals, Message Match
Corporate / Brand: Brand Clarity, Credibility Signals, Navigation Clarity, Content Quality, Contact Accessibility

STEP 3 — Identify every genuine strength and genuine weakness on the page. There is no minimum or maximum — report exactly as many findings as the page warrants. Cover the full page from top to bottom; review ALL screenshots including the scrolled ones before concluding. Only include a finding if it has real impact on achieving the page's primary goal (as determined in STEP 1 — e.g. for a Lead Generation page this means conversion, for a Blog/Content page this means readability and engagement, for a Portfolio/Agency page this means credibility and contact ease, etc.). Do not pad with minor or trivial observations, but do not omit anything meaningful. For each finding, set the x/y/width/height coordinates using the ACTUAL ELEMENT POSITIONS provided above. If the element you are describing appears in the positions list, you must copy those exact coordinates. Only estimate coordinates for elements not listed above.

PAGE COVERAGE RULE — This is mandatory: You must analyse and produce findings for the ENTIRE page, not just the above-the-fold hero area. The full-page screenshot is ${screenshotHeight}px tall. Examine every scrolled screenshot carefully. Findings must be distributed across the full vertical extent of the page — if all your finding y-coordinates are below 30% of the page height, you have failed to cover the page. Sections commonly missed that must be assessed: footer CTAs, testimonial/social-proof sections, pricing tables, feature grids, FAQ sections, contact forms, and any section visible only in the scrolled screenshots. For each section visible in a scrolled screenshot, you must produce at least one finding (strength or weakness) that references it with a y-coordinate matching where it actually appears on the full-page screenshot.

IMPORTANT consistency rules:
- Do NOT flag the same element as both a strength and a weakness. Each page element gets one finding only.
- If the H1 headline is effective (clear, benefit-led, local/specific), mark it as a strength and do NOT separately flag "no hero section" — the H1 IS the hero entry point.
- "No hero section" is only a valid weakness when there is literally no clear above-the-fold headline or opening statement at all.
- If has_hero_section is false but there IS a strong H1, treat the page as having a de-facto hero and focus weaknesses on what surrounds it (missing subheadline, weak CTA, no imagery).
- Findings must not contradict each other. If you give a strength for the headline copy, your weaknesses must address different issues.

Findings should point to specific elements — keep boxes tight to the element, not spanning the full width unless the element truly fills the width.

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "pageIntent": "SaaS / Software",
  "findings": [
    {
      "id": "f1",
      "type": "strength",
      "category": "Value Proposition",
      "title": "Short descriptive title (max 60 chars)",
      "evidence": "Specific evidence from the page content",
      "suggestion": "Specific, actionable improvement suggestion",
      "x": 10,
      "y": 8,
      "width": 55,
      "height": 10
    }
  ],
  "scores": [
    { "name": "Value Proposition", "score": 75, "description": "One sentence describing why this score was given." },
    { "name": "CTA Effectiveness", "score": 80, "description": "One sentence describing why this score was given." }
  ],
  "overallScore": 72,
  "summary": "2-3 sentence executive summary covering the page's purpose, its main conversion strength, and the single most important thing to fix."
}`;

  logger.info({ url, viewportSnapshots: viewportSnapshots.length }, "Sending analysis request to Anthropic");

  const imageBlocks = viewportSnapshots.map((b64) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: b64,
    },
  }));

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          { type: "text" as const, text: prompt },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  let jsonText = content.text.trim();
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  const raw = JSON.parse(jsonText) as AnalysisResult;

  const clampPct = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : fallback;
  };

  const result: AnalysisResult = {
    pageIntent: typeof raw.pageIntent === "string" ? raw.pageIntent : "Unknown",
    overallScore: clampPct(raw.overallScore, 50),
    summary: typeof raw.summary === "string" ? raw.summary : "",
    scores: Array.isArray(raw.scores)
      ? raw.scores.map(s => ({
          name: String(s.name ?? ""),
          score: clampPct(s.score, 50),
          description: String(s.description ?? ""),
        }))
      : [],
    findings: Array.isArray(raw.findings)
      ? raw.findings.map(f => ({
          id: String(f.id ?? Math.random()),
          type: f.type === "strength" ? "strength" : "weakness",
          category: String(f.category ?? ""),
          title: String(f.title ?? ""),
          evidence: String(f.evidence ?? ""),
          suggestion: String(f.suggestion ?? ""),
          x: clampPct(f.x, 5),
          y: clampPct(f.y, 5),
          width: clampPct(f.width, 20),
          height: clampPct(f.height, 10),
        }))
      : [],
  };

  logger.info({ findingsCount: result.findings.length, pageIntent: result.pageIntent }, "Analysis complete");

  return result;
}

export async function analyseSeo(url: string, pageData: PageData): Promise<SeoResult> {
  const prompt = `You are an SEO expert. Analyse the following website page for SEO effectiveness.

URL: ${url}
Page Title: ${pageData.pageTitle}
Meta Description: ${pageData.metaDescription}

Headings:
${pageData.headings.map(h => `${h.level.toUpperCase()}: ${h.text}`).join('\n')}

Links: ${pageData.links.length} links found

Has meta description: ${!!pageData.metaDescription}
Body text excerpt:
${pageData.bodyText.substring(0, 2000)}

Analyse for: title tag optimisation, meta description, heading structure, keyword usage, internal linking, content quality, URL structure.

Respond with ONLY a valid JSON object:
{
  "overallScore": 72,
  "findings": [
    {
      "category": "Title Tag",
      "title": "Finding title",
      "status": "good",
      "details": "What was observed",
      "recommendation": "Specific recommendation"
    }
  ],
  "summary": "2-3 sentence SEO summary"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  let jsonText = content.text.trim();
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  return JSON.parse(jsonText) as SeoResult;
}
